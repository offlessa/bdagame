import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  ImageBackground, Platform, Dimensions,
} from 'react-native';
import Svg, { Path, G, Rect, Text as SvgText, Circle } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { useCareerStore } from '../src/store/careerStore';
import { useCharacterStore, DEFAULT_LOOK } from '../src/store/characterStore';
import { NPCS } from '../src/data/npcs';
import { GRAFFITI } from '../src/theme/fonts';
import CharacterLayered from '../src/components/CharacterLayered';

const GOLD   = '#FFAA00';
const PURPLE = '#9D00FF';
const RED    = '#FF3030';
const BG     = Platform.OS === 'web'
  ? { uri: '/bg-wall.png' }
  : require('../public/bg-wall.png');
const { width: SW } = Dimensions.get('window');

// ── Constantes de jogo ────────────────────────────────────────────────────────

const ROUND_TIME  = 30;   // segundos por round do jogador
const NPC_TIME    = 2200; // ms de animação "turno do NPC"
const TOTAL_ROUNDS = 3;
const FLOW_MAX    = 60;   // slashes para encher o medidor
const PUNCHLINE_DUR = 4000; // ms do modo punchline

// ── Grupos de rimas ───────────────────────────────────────────────────────────

const GROUPS = [
  { id: 'ao',   words: ['IRMÃO','NÃO','CORAÇÃO','SITUAÇÃO','LEÃO','BASTIÃO','CAMPEÃO'],   color: GOLD,      big: '💥 PUNCHLINE!' },
  { id: 'flow', words: ['FLOW','SHOW','EU SOU','VOOU','PEGOU','GANHOU','COMANDO'],        color: PURPLE,    big: '🎤 MESTRE DO FLOW!' },
  { id: 'rua',  words: ['RUA','LUA','SUA','CRUA','TORTURA','LARGURA','AVENTURA'],         color: '#39FF14', big: '🌙 DAS RUAS!' },
  { id: 'fama', words: ['FAMA','CHAMA','DAMA','TRAMA','DRAMA','PROGRAMA','PANORAMA'],     color: '#FF5500', big: '🔴 BRUTAL!' },
  { id: 'vem',  words: ['ALGUÉM','TAMBÉM','NINGUÉM','CONVÉM','DETÉM','MANTÉM','PORÉM'],  color: '#00CFFF', big: '⚡ RAP É ARTE!' },
];
const TRAPS = ['ERRO','FRACO','VAZIO','CAIU','PAREI','DESISTI','PERDI','BLANK'];

const PERSONALITY_COLOR: Record<string, string> = {
  chill: '#00CED1', arrogante: '#FF2020', timido: '#6A5ACD',
  agitado: GOLD, misterioso: PURPLE,
};

// ── Types ─────────────────────────────────────────────────────────────────────

let _uid = 0;
interface Word {
  id: string; text: string; gid: string | null; color: string;
  x: number; y: number; vx: number; vy: number;
  rot: number; vrot: number; pw: number; active: boolean; slashed: boolean;
  isPunchline?: boolean;
}
interface FX { id: string; x: number; y: number; text: string; color: string; t0: number; }
interface Pt { x: number; y: number; t: number; }

type Phase =
  | 'cd'           // countdown
  | 'player'       // jogador rima
  | 'npc_turn'     // animação NPC
  | 'round_result' // pausa entre rounds
  | 'over';        // fim de jogo

// ── Helpers ───────────────────────────────────────────────────────────────────

function pw(t: string) { return t.length * 11 + 32; }

function spawnWord(canvasH: number, speed: number, punchlineMode: boolean): Word {
  const isPunchline = punchlineMode && Math.random() < 0.35;
  const trap = !isPunchline && Math.random() < 0.18;
  let text: string, gid: string | null, color: string;

  if (isPunchline) {
    const g = GROUPS[Math.floor(Math.random() * GROUPS.length)];
    text = '⚡ ' + g.words[Math.floor(Math.random() * g.words.length)];
    gid = g.id; color = '#FFD700';
  } else if (trap) {
    text = TRAPS[Math.floor(Math.random() * TRAPS.length)];
    gid = null; color = RED;
  } else {
    const g = GROUPS[Math.floor(Math.random() * GROUPS.length)];
    text = g.words[Math.floor(Math.random() * g.words.length)];
    gid = g.id; color = g.color;
  }

  const edge = Math.random();
  let x: number, y: number, vx: number, vy: number;
  if (edge < 0.6) {
    x = SW * 0.1 + Math.random() * SW * 0.8; y = canvasH + 30;
    vx = (Math.random() - 0.5) * 2; vy = -(2.2 + Math.random() * 2.2) * speed;
  } else if (edge < 0.8) {
    x = -90; y = canvasH * 0.2 + Math.random() * canvasH * 0.55;
    vx = (1.6 + Math.random() * 1.8) * speed; vy = -(0.8 + Math.random() * 1.2) * speed;
  } else {
    x = SW + 90; y = canvasH * 0.2 + Math.random() * canvasH * 0.55;
    vx = -(1.6 + Math.random() * 1.8) * speed; vy = -(0.8 + Math.random() * 1.2) * speed;
  }
  return {
    id: `w${_uid++}`, text, gid, color, x, y, vx, vy,
    rot: (Math.random() - 0.5) * 16, vrot: (Math.random() - 0.5) * 0.28,
    pw: pw(text), active: true, slashed: false, isPunchline,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RapSlashScreen() {
  const { npcId }   = useLocalSearchParams<{ npcId: string }>();
  const npc         = NPCS.find(n => n.id === npcId) ?? null;
  const career      = useCareerStore();
  const character   = useCharacterStore(s => s.character);
  const { addBattleResult } = career;

  const npcColor = PERSONALITY_COLOR[npc?.personality ?? ''] ?? GOLD;

  // ── UI state ─────────────────────────────────────────────────────────────
  const [phase,  setPhase]  = useState<Phase>('cd');
  const [cdN,    setCdN]    = useState(3);
  const [score,  setScore]  = useState(0);
  const [lives,  setLives]  = useState(3);
  const [combo,  setCombo]  = useState(0);
  const [flow,   setFlow]   = useState(0);
  const [timer,  setTimer]  = useState(ROUND_TIME);
  const [round,  setRound]  = useState(1);
  const [flash,  setFlash]  = useState('');
  const [punchline, setPunchline] = useState(false);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [npcRoundScores, setNpcRoundScores] = useState<number[]>([]);
  const [npcBarPct, setNpcBarPct] = useState(0);
  const [, bump] = useState(0);
  const rerender = () => bump(n => n + 1);

  // ── Refs (evita closure stale em loops) ──────────────────────────────────
  const phaseR     = useRef<Phase>('cd');
  const roundR     = useRef(1);
  const scoreR     = useRef(0);
  const livesR     = useRef(3);
  const comboR     = useRef(0);
  const maxComboR  = useRef(0);
  const flowR      = useRef(0);
  const punchR     = useRef(false);
  const punchTimer = useRef<any>(null);
  const lastSlash  = useRef<{gid:string;t:number}|null>(null);
  const wordsR     = useRef<Word[]>([]);
  const trailR     = useRef<Pt[]>([]);
  const fxR        = useRef<FX[]>([]);
  const canvasY    = useRef(0);
  const canvasH    = useRef(500);
  const loopId     = useRef<any>(null);
  const spawnId    = useRef<any>(null);
  const timerId    = useRef<any>(null);
  const gameT      = useRef(ROUND_TIME);
  const dead       = useRef(false);
  const playerRounds = useRef<number[]>([]);
  const npcRounds    = useRef<number[]>([]);
  const totalSlashes = useRef(0);

  // Animação da barra do NPC
  const npcBarAnim = useRef(new Animated.Value(0)).current;

  // ── Touch ─────────────────────────────────────────────────────────────────

  const onPointer = useCallback((px: number, py: number) => {
    if (phaseR.current !== 'player') return;
    const cx = px;
    const cy = py - canvasY.current;
    const now = Date.now();
    trailR.current.push({ x: cx, y: cy, t: now });
    if (trailR.current.length > 26) trailR.current.shift();
    for (const w of wordsR.current) {
      if (!w.active || w.slashed) continue;
      if (cx >= w.x - w.pw/2 - 14 && cx <= w.x + w.pw/2 + 14 &&
          cy >= w.y - 24 && cy <= w.y + 24) doSlash(w, now);
    }
  }, []);

  function doSlash(w: Word, now: number) {
    w.slashed = true; w.active = false;
    totalSlashes.current++;
    const newFlow = Math.min(FLOW_MAX, flowR.current + (w.isPunchline ? 6 : 1));
    flowR.current = newFlow;
    setFlow(newFlow);

    if (!w.gid) {
      // trap
      livesR.current = Math.max(0, livesR.current - 1);
      setLives(livesR.current);
      comboR.current = 0; lastSlash.current = null; setCombo(0);
      pushFx(w.x, w.y, '💀 TRAP!', RED);
      if (livesR.current <= 0) endRound();
      return;
    }

    // Punchline mode: extra points
    const bonus = (w.isPunchline ? 3 : 1) * (punchR.current ? 2 : 1);
    const last = lastSlash.current;
    let pts = 10 * bonus;
    let nc  = 1;
    if (last && last.gid === w.gid && now - last.t < 1600) {
      nc  = comboR.current + 1;
      pts = 10 * nc * bonus;
      const g = GROUPS.find(x => x.id === w.gid);
      if (nc >= 3) { pts = Math.round(pts * 1.8); showFlash(g?.big ?? '💥 PUNCHLINE!'); }
      else if (nc === 2) showFlash('🔥 COMBO x' + nc);
    }
    comboR.current = nc;
    if (nc > maxComboR.current) maxComboR.current = nc;
    setCombo(nc);
    lastSlash.current = { gid: w.gid, t: now };
    scoreR.current += pts;
    setScore(scoreR.current);
    pushFx(w.x, w.y, w.isPunchline ? `⚡ +${pts}` : `+${pts}`, w.isPunchline ? '#FFD700' : w.color);

    // Ativa modo punchline quando flow enche
    if (newFlow >= FLOW_MAX && !punchR.current) activatePunchline();
  }

  function activatePunchline() {
    punchR.current = true; setPunchline(true);
    flowR.current = 0; setFlow(0);
    showFlash('💥 MODO PUNCHLINE!');
    clearTimeout(punchTimer.current);
    punchTimer.current = setTimeout(() => {
      punchR.current = false; setPunchline(false);
    }, PUNCHLINE_DUR);
  }

  function pushFx(x: number, y: number, text: string, color: string) {
    fxR.current.push({ id: `e${_uid++}`, x, y, text, color, t0: Date.now() });
  }
  function showFlash(text: string) {
    setFlash(text);
    setTimeout(() => setFlash(''), 1200);
  }

  // ── Game loop ──────────────────────────────────────────────────────────────

  function tick() {
    if (phaseR.current !== 'player') return;
    const now = Date.now();
    for (const w of wordsR.current) {
      if (!w.active) continue;
      w.x += w.vx; w.y += w.vy; w.rot += w.vrot;
      if ((w.y < -60 || w.x < -200 || w.x > SW + 200) && !w.slashed) {
        if (w.gid && !w.isPunchline) {
          livesR.current = Math.max(0, livesR.current - 1);
          setLives(livesR.current);
          if (livesR.current <= 0) { endRound(); return; }
        }
        w.active = false;
      }
    }
    trailR.current = trailR.current.filter(p => now - p.t < 280);
    fxR.current    = fxR.current.filter(e => now - e.t0 < 850);
    rerender();
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let n = 3;
    const cd = setInterval(() => {
      n--;
      if (n <= 0) { clearInterval(cd); startRound(); }
      else setCdN(n);
    }, 1000);
    return () => {
      clearInterval(cd);
      stopLoops();
    };
  }, []);

  function stopLoops() {
    clearInterval(loopId.current);
    clearInterval(spawnId.current);
    clearInterval(timerId.current);
    clearTimeout(punchTimer.current);
  }

  function startRound() {
    wordsR.current = []; trailR.current = []; fxR.current = [];
    gameT.current = ROUND_TIME; setTimer(ROUND_TIME);
    scoreR.current = 0; setScore(0);
    comboR.current = 0; setCombo(0);
    livesR.current = 3; setLives(3);
    flowR.current = 0; setFlow(0);
    punchR.current = false; setPunchline(false);
    lastSlash.current = null;
    dead.current = false;

    phaseR.current = 'player'; setPhase('player');

    const spd = () => 1 + (roundR.current - 1) * 0.22;

    loopId.current  = setInterval(tick, 16);
    spawnId.current = setInterval(() => {
      if (phaseR.current !== 'player') return;
      const speed = spd() + (1 - gameT.current / ROUND_TIME) * 0.4; // acelera no fim
      wordsR.current.push(spawnWord(canvasH.current, speed, punchR.current));
      const active = wordsR.current.filter(w => w.active).length;
      if (active < 4 + roundR.current && Math.random() < 0.35 + roundR.current * 0.1)
        wordsR.current.push(spawnWord(canvasH.current, speed, punchR.current));
    }, Math.max(600, 900 - roundR.current * 80));

    timerId.current = setInterval(() => {
      gameT.current--;
      setTimer(gameT.current);
      if (gameT.current <= 0) endRound();
    }, 1000);
  }

  function endRound() {
    if (dead.current) return;
    dead.current = true;
    stopLoops();
    punchR.current = false; setPunchline(false);

    const playerScore = scoreR.current;
    playerRounds.current.push(playerScore);

    // NPC turno — calcula baseado na dificuldade + round + variação
    phaseR.current = 'npc_turn'; setPhase('npc_turn');
    setNpcBarPct(0);

    const baseMult = (npc?.difficulty ?? 1) * 45 + (roundR.current - 1) * 12;
    const npcScore = Math.round(baseMult + (Math.random() * 20 - 10));

    // Anima barra do NPC
    Animated.timing(npcBarAnim, {
      toValue: Math.min(100, (npcScore / 200) * 100),
      duration: NPC_TIME - 200,
      useNativeDriver: false,
    }).start();
    // Atualiza o número da barra em tempo real
    const npcInterval = setInterval(() => {
      setNpcBarPct(p => Math.min(npcScore, p + Math.ceil(npcScore / 20)));
    }, NPC_TIME / 20);

    setTimeout(() => {
      clearInterval(npcInterval);
      setNpcBarPct(npcScore);
      npcRounds.current.push(npcScore);
      setRoundScores([...playerRounds.current]);
      setNpcRoundScores([...npcRounds.current]);

      if (roundR.current >= TOTAL_ROUNDS) {
        // fim de jogo
        phaseR.current = 'over'; setPhase('over');
        const totalPlayer = playerRounds.current.reduce((a, b) => a + b, 0);
        const totalNpc    = npcRounds.current.reduce((a, b) => a + b, 0);
        const won = totalPlayer > totalNpc;
        if (npc) {
          addBattleResult({
            won,
            npcId: npc.id,
            difficulty: npc.difficulty,
            playerScore: totalPlayer,
            npcScore: totalNpc,
          });
        }
      } else {
        phaseR.current = 'round_result'; setPhase('round_result');
        setTimeout(() => {
          roundR.current++; setRound(roundR.current);
          phaseR.current = 'cd'; setPhase('cd'); setCdN(3);
          let n2 = 3;
          const cd2 = setInterval(() => {
            n2--;
            if (n2 <= 0) { clearInterval(cd2); startRound(); }
            else setCdN(n2);
          }, 1000);
        }, 2500);
      }
    }, NPC_TIME);
  }

  // ── Trail path ─────────────────────────────────────────────────────────────

  function buildPath(): string {
    const pts = trailR.current;
    if (pts.length < 2) return '';
    return pts.reduce((d, p, i) => d + (i === 0 ? `M${p.x} ${p.y}` : ` L${p.x} ${p.y}`), '');
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  const now     = Date.now();
  const words   = wordsR.current.filter(w => w.active);
  const effects = fxR.current.filter(e => now - e.t0 < 850);
  const tp      = buildPath();

  const totalPlayer = playerRounds.current.reduce((a, b) => a + b, 0) + (phase === 'over' || phase === 'npc_turn' || phase === 'round_result' ? 0 : scoreR.current);
  const totalNpc    = npcRounds.current.reduce((a, b) => a + b, 0);
  const playerWins  = totalPlayer > totalNpc;

  const maxTotal    = Math.max(totalPlayer, totalNpc, 100);
  const playerBarPct = Math.min(100, (totalPlayer / maxTotal) * 100);
  const npcDisplayPct = Math.min(100, (totalNpc / maxTotal) * 100);

  const timerPct    = (timer / ROUND_TIME) * 100;
  const timerColor  = timer > 10 ? '#39FF14' : timer > 5 ? '#FF8800' : RED;

  return (
    <ImageBackground source={BG} style={s.root} resizeMode="cover">
      <View style={[s.overlay, punchline && s.overlayPunch]} />

      {/* ── Header battle bar ── */}
      <View style={s.battleHeader}>

        {/* Jogador */}
        <View style={s.headerSide}>
          <View style={[s.miniChar, { borderColor: character?.archetypeColor ?? GOLD }]}>
            <CharacterLayered look={character?.look ?? DEFAULT_LOOK} size={34} />
          </View>
          <View style={s.headerInfo}>
            <Text style={s.headerName} numberOfLines={1}>{character?.battleName ?? 'VOCÊ'}</Text>
            <View style={s.headerBar}>
              <View style={[s.headerFill, { width: `${playerBarPct}%` as any, backgroundColor: character?.archetypeColor ?? GOLD }]} />
            </View>
            <Text style={[s.headerScore, { color: character?.archetypeColor ?? GOLD }]}>{totalPlayer}</Text>
          </View>
        </View>

        {/* Round indicator */}
        <View style={s.roundWrap}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
            const done = i < (roundR.current - 1) || phase === 'over';
            const pW = done ? playerRounds.current[i] ?? 0 : 0;
            const nW = done ? npcRounds.current[i] ?? 0 : 0;
            const pWon = pW > nW;
            return (
              <View key={i} style={[s.roundDot, {
                backgroundColor: done ? (pWon ? (character?.archetypeColor ?? GOLD) : npcColor) : '#2A2A2A',
                borderColor: i === roundR.current - 1 && phase !== 'over' ? '#FFF' : 'transparent',
              }]} />
            );
          })}
          <Text style={s.roundTxt}>R{round}</Text>
        </View>

        {/* NPC */}
        <View style={[s.headerSide, s.headerSideRight]}>
          <View style={s.headerInfo}>
            <Text style={[s.headerName, { textAlign: 'right' }]} numberOfLines={1}>{npc?.name ?? 'NPC'}</Text>
            <View style={[s.headerBar, { transform: [{ scaleX: -1 }] }]}>
              <View style={[s.headerFill, { width: `${npcDisplayPct}%` as any, backgroundColor: npcColor }]} />
            </View>
            <Text style={[s.headerScore, { color: npcColor, textAlign: 'right' }]}>{totalNpc}</Text>
          </View>
          <View style={[s.miniChar, { borderColor: npcColor }]}>
            <Text style={s.npcEmojiMini}>{npc?.emoji ?? '🎤'}</Text>
          </View>
        </View>

      </View>

      {/* ── Timer + Combo ── */}
      <View style={s.statsBar}>
        <View style={s.statCol}>
          <Text style={[s.statBig, { color: GOLD }]}>{score}</Text>
          <Text style={s.statLbl}>PTS ROUND</Text>
        </View>

        {/* Timer circular */}
        <View style={s.timerWrap}>
          <Text style={[s.timerNum, { color: timerColor }]}>{timer}</Text>
          <View style={s.timerBarBg}>
            <View style={[s.timerBarFill, { width: `${timerPct}%` as any, backgroundColor: timerColor }]} />
          </View>
        </View>

        <View style={s.statCol}>
          <Text style={[s.statBig, { color: combo >= 3 ? '#FF5500' : '#FF6600' }]}>x{combo}</Text>
          <Text style={s.statLbl}>COMBO</Text>
        </View>
      </View>

      {/* ── Canvas ── */}
      <View
        style={s.canvas}
        onLayout={e => {
          canvasY.current = e.nativeEvent.layout.y;
          canvasH.current = e.nativeEvent.layout.height;
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={()  => true}
        onResponderGrant={e => onPointer(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        onResponderMove={e  => onPointer(e.nativeEvent.pageX, e.nativeEvent.pageY)}
      >
        <Svg width={SW} height="100%" style={StyleSheet.absoluteFill}>
          {/* Punchline mode glow ring */}
          {punchline && (
            <Circle cx={SW/2} cy={canvasH.current/2} r={Math.min(SW, canvasH.current)*0.45}
              fill="none" stroke="#FFD700" strokeWidth={2} strokeOpacity={0.15} />
          )}

          {/* Trail glow */}
          {tp && <Path d={tp} stroke={punchline ? 'rgba(255,215,0,0.3)' : 'rgba(255,210,50,0.18)'}
            strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
          {/* Trail sharp */}
          {tp && <Path d={tp} stroke={punchline ? '#FFD700' : 'rgba(255,220,80,0.9)'}
            strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />}

          {/* Words */}
          {words.map(w => (
            <G key={w.id} transform={`translate(${w.x},${w.y}) rotate(${w.rot})`}>
              {/* Glow border */}
              <Rect x={-w.pw/2-12} y={-23} width={w.pw+24} height={46} rx={9}
                fill={w.color} opacity={w.isPunchline ? 0.3 : 0.1} />
              {/* Box */}
              <Rect x={-w.pw/2-10} y={-21} width={w.pw+20} height={42} rx={7}
                fill="rgba(0,0,0,0.85)" stroke={w.color} strokeWidth={w.isPunchline ? 2.5 : 1.8} />
              {/* Text */}
              <SvgText textAnchor="middle" y={8} fontSize={w.isPunchline ? 13 : 14} fontWeight="900"
                fill={w.color} letterSpacing={2}>
                {w.text}
              </SvgText>
            </G>
          ))}

          {/* Floating FX */}
          {effects.map(e => {
            const age = (now - e.t0) / 850;
            return (
              <SvgText key={e.id} x={e.x} y={e.y - age * 55}
                textAnchor="middle" fontSize={14} fontWeight="900"
                fill={e.color} opacity={1 - age} letterSpacing={1}>
                {e.text}
              </SvgText>
            );
          })}
        </Svg>

        {/* Flash central */}
        {flash ? (
          <View style={s.flashWrap} pointerEvents="none">
            <Text style={[s.flashTxt, punchline && s.flashPunch]}>{flash}</Text>
          </View>
        ) : null}

        {/* Countdown */}
        {phase === 'cd' && (
          <View style={s.overlay2} pointerEvents="none">
            <Text style={s.cdNum}>{cdN}</Text>
            <Text style={s.cdSub}>ROUND {round} · CORTE AS RIMAS!</Text>
            <Text style={s.cdHint}>Same grupo = COMBO 🔥  · Encha o Flow = PUNCHLINE 💥</Text>
          </View>
        )}

        {/* NPC turn */}
        {phase === 'npc_turn' && (
          <View style={s.overlay2} pointerEvents="none">
            <Text style={[s.npcTurnEmoji, { color: npcColor }]}>{npc?.emoji ?? '🎤'}</Text>
            <Text style={s.npcTurnName}>{npc?.name?.toUpperCase() ?? 'NPC'} RESPONDE</Text>
            <View style={s.npcTurnBarBg}>
              <Animated.View style={[s.npcTurnBarFill, {
                backgroundColor: npcColor,
                width: npcBarAnim.interpolate({ inputRange: [0,100], outputRange: ['0%','100%'] }),
              }]} />
            </View>
            <Text style={[s.npcTurnScore, { color: npcColor }]}>{npcBarPct} PTS</Text>
          </View>
        )}

        {/* Round result */}
        {phase === 'round_result' && (() => {
          const pScore = playerRounds.current[playerRounds.current.length - 1] ?? 0;
          const nScore = npcRounds.current[npcRounds.current.length - 1] ?? 0;
          const won = pScore > nScore;
          return (
            <View style={s.overlay2} pointerEvents="none">
              <Text style={[s.rrTitle, { color: won ? (character?.archetypeColor ?? GOLD) : npcColor }]}>
                {won ? '🏆 ROUND PARA VOCÊ!' : '💀 ROUND PERDIDO'}
              </Text>
              <View style={s.rrRow}>
                <Text style={[s.rrScore, { color: character?.archetypeColor ?? GOLD }]}>{pScore}</Text>
                <Text style={s.rrVs}>vs</Text>
                <Text style={[s.rrScore, { color: npcColor }]}>{nScore}</Text>
              </View>
              <Text style={s.rrNext}>PRÓXIMO ROUND...</Text>
            </View>
          );
        })()}

        {/* GAME OVER */}
        {phase === 'over' && (() => {
          const totalP = playerRounds.current.reduce((a, b) => a + b, 0);
          const totalN = npcRounds.current.reduce((a, b) => a + b, 0);
          const won    = totalP > totalN;
          const accent = won ? (character?.archetypeColor ?? GOLD) : npcColor;
          return (
            <View style={s.resultWrap}>
              {/* Vencedor */}
              <Text style={[s.resultVerdict, { color: accent }]}>
                {won ? '🏆 VOCÊ VENCEU!' : '💀 VOCÊ PERDEU'}
              </Text>
              <Text style={s.resultVs}>{npc?.battleName?.toUpperCase() ?? ''}</Text>

              {/* Score total */}
              <View style={s.resultTotals}>
                <View style={s.resultSide}>
                  <Text style={s.resultSideName}>{character?.battleName ?? 'VOCÊ'}</Text>
                  <Text style={[s.resultTotal, { color: character?.archetypeColor ?? GOLD }]}>{totalP}</Text>
                </View>
                <Text style={s.resultTotalVs}>VS</Text>
                <View style={[s.resultSide, { alignItems: 'flex-start' }]}>
                  <Text style={s.resultSideName}>{npc?.name ?? 'NPC'}</Text>
                  <Text style={[s.resultTotal, { color: npcColor }]}>{totalN}</Text>
                </View>
              </View>

              {/* Rounds breakdown */}
              <View style={s.roundsBreak}>
                {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
                  const p = playerRounds.current[i] ?? 0;
                  const n = npcRounds.current[i] ?? 0;
                  const pW = p > n;
                  return (
                    <View key={i} style={s.roundBreakRow}>
                      <Text style={[s.rbScore, { color: pW ? (character?.archetypeColor ?? GOLD) : '#555' }]}>{p}</Text>
                      <View style={[s.rbDot, { backgroundColor: pW ? (character?.archetypeColor ?? GOLD) : npcColor }]}>
                        <Text style={s.rbDotTxt}>R{i + 1}</Text>
                      </View>
                      <Text style={[s.rbScore, { color: !pW ? npcColor : '#555', textAlign: 'right' }]}>{n}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Stats mini */}
              <View style={s.resultStats}>
                {([
                  ['💥', String(maxComboR.current), 'MAX COMBO', PURPLE],
                  ['🎤', String(totalSlashes.current), 'SLASHES', '#FF6600'],
                ] as [string,string,string,string][]).map(([icon, val, lbl, clr]) => (
                  <View key={lbl} style={s.rStat}>
                    <Text style={s.rStatIcon}>{icon}</Text>
                    <Text style={[s.rStatVal, { color: clr }]}>{val}</Text>
                    <Text style={s.rStatLbl}>{lbl}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={[s.doneBtn, { backgroundColor: accent }]}
                onPress={() => router.replace('/world')} activeOpacity={0.85}>
                <Text style={s.doneBtnTxt}>{won ? 'CONTINUAR ▶' : 'TENTAR DE NOVO'}</Text>
              </TouchableOpacity>
            </View>
          );
        })()}
      </View>

      {/* ── Flow meter ── */}
      {(phase === 'player' || punchline) && (
        <View style={[s.flowBar, punchline && s.flowBarPunch]}>
          <Text style={[s.flowLbl, punchline && { color: '#FFD700' }]}>
            {punchline ? '💥 PUNCHLINE!' : '⚡ FLOW'}
          </Text>
          <View style={s.flowTrack}>
            <View style={[s.flowFill, {
              width: `${(flow / FLOW_MAX) * 100}%` as any,
              backgroundColor: punchline ? '#FFD700' : '#FF6600',
            }]} />
          </View>
          <Text style={[s.flowNum, punchline && { color: '#FFD700' }]}>
            {punchline ? 'ATIVO' : `${flow}/${FLOW_MAX}`}
          </Text>
        </View>
      )}
    </ImageBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#060606' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.52)' },
  overlayPunch: { backgroundColor: 'rgba(20,10,0,0.58)' },

  // Battle header
  battleHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 50, paddingBottom: 10, paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  headerSide: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerSideRight: { flexDirection: 'row-reverse' },
  miniChar: {
    width: 38, height: 48, borderRadius: 5, borderWidth: 1.5,
    overflow: 'hidden', backgroundColor: '#0A0A0A',
    alignItems: 'center', justifyContent: 'flex-end',
  },
  npcEmojiMini: { fontSize: 26, lineHeight: 36 },
  headerInfo: { flex: 1, gap: 3 },
  headerName:  { fontFamily: GRAFFITI, color: '#CCC', fontSize: 11, letterSpacing: 1 },
  headerBar:   { height: 4, backgroundColor: '#1A1A1A', borderRadius: 2, overflow: 'hidden' },
  headerFill:  { height: 4, borderRadius: 2 },
  headerScore: { fontFamily: GRAFFITI, fontSize: 14 },

  roundWrap: { alignItems: 'center', gap: 4, minWidth: 54 },
  roundDot: {
    width: 12, height: 12, borderRadius: 6, borderWidth: 1.5,
  },
  roundTxt: { fontFamily: GRAFFITI, color: '#555', fontSize: 10, letterSpacing: 2 },

  // Stats bar
  statsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 7,
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,170,0,0.1)',
  },
  statCol:   { alignItems: 'center', minWidth: 70 },
  statBig:   { fontFamily: GRAFFITI, fontSize: 24 },
  statLbl:   { fontFamily: GRAFFITI, color: '#333', fontSize: 10, letterSpacing: 2 },
  timerWrap: { alignItems: 'center', gap: 4 },
  timerNum:  { fontFamily: GRAFFITI, fontSize: 38, lineHeight: 40 },
  timerBarBg:{ width: 60, height: 4, backgroundColor: '#1A1A1A', borderRadius: 2 },
  timerBarFill:{ height: 4, borderRadius: 2 },

  canvas: { flex: 1, position: 'relative', overflow: 'hidden' },

  // Flash
  flashWrap: {
    position: 'absolute', top: '25%', left: 0, right: 0,
    alignItems: 'center', zIndex: 10,
  },
  flashTxt: {
    fontFamily: GRAFFITI, fontSize: 28, letterSpacing: 3, color: '#FFF',
    textShadowColor: GOLD, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18,
  },
  flashPunch: { color: '#FFD700', fontSize: 32, textShadowColor: '#FFD700', textShadowRadius: 24 },

  // Overlay shared (cd, npc_turn, round_result)
  overlay2: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)', zIndex: 20, gap: 10,
  },
  // Countdown
  cdNum:  { fontFamily: GRAFFITI, color: GOLD, fontSize: 108, lineHeight: 110 },
  cdSub:  { fontFamily: GRAFFITI, color: '#888', fontSize: 15, letterSpacing: 4 },
  cdHint: { fontFamily: GRAFFITI, color: '#444', fontSize: 11, letterSpacing: 2 },

  // NPC turn
  npcTurnEmoji: { fontSize: 72 },
  npcTurnName:  { fontFamily: GRAFFITI, fontSize: 20, letterSpacing: 4, color: '#FFF' },
  npcTurnBarBg: { width: SW * 0.65, height: 8, backgroundColor: '#1A1A1A', borderRadius: 4, overflow: 'hidden' },
  npcTurnBarFill: { height: 8, borderRadius: 4 },
  npcTurnScore: { fontFamily: GRAFFITI, fontSize: 30 },

  // Round result
  rrTitle: { fontFamily: GRAFFITI, fontSize: 26, letterSpacing: 3 },
  rrRow:   { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 6 },
  rrScore: { fontFamily: GRAFFITI, fontSize: 52, lineHeight: 54 },
  rrVs:    { fontFamily: GRAFFITI, color: '#444', fontSize: 18 },
  rrNext:  { fontFamily: GRAFFITI, color: '#444', fontSize: 14, letterSpacing: 4, marginTop: 6 },

  // Game Over / Result
  resultWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.94)', zIndex: 30, gap: 10, padding: 20,
  },
  resultVerdict: { fontFamily: GRAFFITI, fontSize: 30, letterSpacing: 4 },
  resultVs:      { fontFamily: GRAFFITI, color: '#555', fontSize: 14, letterSpacing: 4, marginTop: -4 },
  resultTotals:  { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 10 },
  resultSide:    { alignItems: 'flex-end', gap: 2 },
  resultSideName:{ fontFamily: GRAFFITI, color: '#555', fontSize: 12, letterSpacing: 2 },
  resultTotal:   { fontFamily: GRAFFITI, fontSize: 52, lineHeight: 54 },
  resultTotalVs: { fontFamily: GRAFFITI, color: '#333', fontSize: 22 },

  roundsBreak: { gap: 6, width: '80%', marginTop: 4 },
  roundBreakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rbScore: { fontFamily: GRAFFITI, fontSize: 20, flex: 1 },
  rbDot: {
    width: 38, height: 22, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  rbDotTxt: { fontFamily: GRAFFITI, color: '#000', fontSize: 10, letterSpacing: 2 },

  resultStats:   { flexDirection: 'row', gap: 28, marginTop: 6 },
  rStat:         { alignItems: 'center', gap: 2 },
  rStatIcon:     { fontSize: 22 },
  rStatVal:      { fontFamily: GRAFFITI, fontSize: 28 },
  rStatLbl:      { fontFamily: GRAFFITI, color: '#444', fontSize: 10, letterSpacing: 2 },

  doneBtn: { marginTop: 16, borderRadius: 6, paddingHorizontal: 40, paddingVertical: 14 },
  doneBtnTxt: { fontFamily: GRAFFITI, color: '#0A0A0A', fontSize: 18, letterSpacing: 5 },

  // Flow bar
  flowBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  flowBarPunch: { borderTopColor: 'rgba(255,215,0,0.4)', backgroundColor: 'rgba(20,15,0,0.88)' },
  flowLbl:   { fontFamily: GRAFFITI, color: '#FF6600', fontSize: 12, letterSpacing: 2 },
  flowTrack: { flex: 1, height: 7, backgroundColor: '#1A1A1A', borderRadius: 4 },
  flowFill:  { height: 7, borderRadius: 4 },
  flowNum:   { fontFamily: GRAFFITI, color: '#FF6600', fontSize: 12 },
});
