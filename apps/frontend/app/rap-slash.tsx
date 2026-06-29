import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ImageBackground, Platform, Dimensions,
} from 'react-native';
import Svg, { Path, G, Rect, Text as SvgText } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { useCareerStore } from '../src/store/careerStore';
import { NPCS } from '../src/data/npcs';
import { GRAFFITI } from '../src/theme/fonts';

const GOLD   = '#FFAA00';
const PURPLE = '#9D00FF';
const BG     = Platform.OS === 'web'
  ? { uri: '/bg-wall.png' }
  : require('../public/bg-wall.png');
const { width: SW } = Dimensions.get('window');

// ── Rhyme data ────────────────────────────────────────────────────────────────

const GROUPS = [
  { id: 'ao',   words: ['IRMÃO','NÃO','CORAÇÃO','SITUAÇÃO','LEÃO','BASTIÃO'],   color: GOLD,      combo: '🔥 RIMOU MANO!',    big: '💥 PUNCHLINE DA HORA!' },
  { id: 'flow', words: ['FLOW','SHOW','EU SOU','VOOU','PEGOU','GANHOU'],        color: PURPLE,    combo: '🎤 QUE FLOW!',      big: '💜 MESTRE DO FLOW!' },
  { id: 'rua',  words: ['RUA','LUA','SUA','CRUA','TORTURA','LARGURA'],          color: '#39FF14', combo: '🌙 DA RUA!',        big: '🟢 POESIA DAS RUAS!' },
  { id: 'fama', words: ['FAMA','CHAMA','DAMA','TRAMA','DRAMA','PROGRAMA'],      color: '#FF5500', combo: '🎭 DRAMA!',         big: '🔴 PUNCHLINE BRUTAL!' },
  { id: 'vem',  words: ['ALGUÉM','TAMBÉM','NINGUÉM','CONVÉM','DETÉM','MANTÉM'],color: '#00CFFF', combo: '💙 RIMA VEM!',      big: '⚡ RAP É ARTE!' },
];
const TRAPS = ['ERRO','FRACO','VAZIO','CAIU','PAREI','DESISTI','PERDI'];

// ── Types ─────────────────────────────────────────────────────────────────────

let _uid = 0;

interface Word {
  id: string; text: string; gid: string | null; color: string;
  x: number; y: number; vx: number; vy: number;
  rot: number; vrot: number; pw: number;
  active: boolean; slashed: boolean;
}
interface Effect { id: string; x: number; y: number; text: string; color: string; t0: number; }
interface Pt { x: number; y: number; t: number; }

// ── Helpers ───────────────────────────────────────────────────────────────────

function pw(t: string) { return t.length * 12 + 28; }

function spawnWord(canvasH: number): Word {
  const trap = Math.random() < 0.2;
  let text: string, gid: string | null, color: string;
  if (trap) {
    text = TRAPS[Math.floor(Math.random() * TRAPS.length)];
    gid = null; color = '#FF3030';
  } else {
    const g = GROUPS[Math.floor(Math.random() * GROUPS.length)];
    text = g.words[Math.floor(Math.random() * g.words.length)];
    gid = g.id; color = g.color;
  }
  const edge = Math.random();
  let x: number, y: number, vx: number, vy: number;
  if (edge < 0.6) {
    x = SW * 0.1 + Math.random() * SW * 0.8; y = canvasH + 30;
    vx = (Math.random() - 0.5) * 2; vy = -(2.2 + Math.random() * 2.5);
  } else if (edge < 0.8) {
    x = -90; y = canvasH * 0.2 + Math.random() * canvasH * 0.55;
    vx = 1.8 + Math.random() * 2; vy = -(0.8 + Math.random() * 1.2);
  } else {
    x = SW + 90; y = canvasH * 0.2 + Math.random() * canvasH * 0.55;
    vx = -(1.8 + Math.random() * 2); vy = -(0.8 + Math.random() * 1.2);
  }
  return {
    id: `w${_uid++}`, text, gid, color, x, y, vx, vy,
    rot: (Math.random() - 0.5) * 18, vrot: (Math.random() - 0.5) * 0.3,
    pw: pw(text), active: true, slashed: false,
  };
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function RapSlashScreen() {
  const { npcId } = useLocalSearchParams<{ npcId: string }>();
  const npc = NPCS.find(n => n.id === npcId) ?? null;
  const { addBattleResult } = useCareerStore();

  const [score,  setScore]  = useState(0);
  const [lives,  setLives]  = useState(3);
  const [combo,  setCombo]  = useState(0);
  const [flow,   setFlow]   = useState(0);
  const [timer,  setTimer]  = useState(30);
  const [phase,  setPhase]  = useState<'cd'|'play'|'over'>('cd');
  const [cdN,    setCdN]    = useState(3);
  const [flash,  setFlash]  = useState('');
  const [, bump] = useState(0);
  const rerender = () => bump(n => n + 1);

  const wordsR    = useRef<Word[]>([]);
  const trailR    = useRef<Pt[]>([]);
  const effectsR  = useRef<Effect[]>([]);
  const scoreR    = useRef(0);
  const livesR    = useRef(3);
  const comboR    = useRef(0);
  const maxComboR = useRef(0);
  const flowR     = useRef(0);
  const lastSlash = useRef<{gid:string;t:number}|null>(null);
  const phaseR    = useRef<'cd'|'play'|'over'>('cd');
  const canvasY   = useRef(0);
  const canvasH   = useRef(500);
  const dead      = useRef(false);
  const loopId    = useRef<any>(null);
  const spawnId   = useRef<any>(null);
  const timerId   = useRef<any>(null);
  const gameT     = useRef(30);

  // ── Touch ─────────────────────────────────────────────────────────────────

  const onPointer = useCallback((px: number, py: number) => {
    if (phaseR.current !== 'play') return;
    const now = Date.now();
    const cx = px;
    const cy = py - canvasY.current;

    trailR.current.push({ x: cx, y: cy, t: now });
    if (trailR.current.length > 24) trailR.current.shift();

    for (const w of wordsR.current) {
      if (!w.active || w.slashed) continue;
      if (cx >= w.x - w.pw / 2 - 12 && cx <= w.x + w.pw / 2 + 12 &&
          cy >= w.y - 22 && cy <= w.y + 22) {
        doSlash(w, now);
      }
    }
  }, []);

  function doSlash(w: Word, now: number) {
    w.slashed = true;
    w.active  = false;
    flowR.current++;
    setFlow(flowR.current);

    if (!w.gid) {
      livesR.current = Math.max(0, livesR.current - 1);
      setLives(livesR.current);
      comboR.current = 0; lastSlash.current = null; setCombo(0);
      pushFx(w.x, w.y, '💀 TRAP!', '#FF3030');
      if (livesR.current <= 0) endGame();
      return;
    }

    const last = lastSlash.current;
    let pts = 10;
    let nc  = 1;
    if (last && last.gid === w.gid && now - last.t < 1500) {
      nc  = comboR.current + 1;
      pts = 10 * nc;
      const g = GROUPS.find(x => x.id === w.gid);
      if (nc >= 3) { pts *= 2; showFlash(g?.big ?? '💥 PUNCHLINE!'); }
      else if (nc === 2) showFlash(g?.combo ?? '🎤 COMBO!');
    }
    comboR.current = nc;
    if (nc > maxComboR.current) maxComboR.current = nc;
    setCombo(nc);
    lastSlash.current = { gid: w.gid, t: now };
    scoreR.current += pts;
    setScore(scoreR.current);
    pushFx(w.x, w.y, `+${pts}`, w.color);
  }

  function pushFx(x: number, y: number, text: string, color: string) {
    effectsR.current.push({ id: `e${_uid++}`, x, y, text, color, t0: Date.now() });
  }
  function showFlash(text: string) {
    setFlash(text);
    setTimeout(() => setFlash(''), 1100);
  }

  // ── Game loop ──────────────────────────────────────────────────────────────

  function tick() {
    if (phaseR.current !== 'play') return;
    const now = Date.now();
    for (const w of wordsR.current) {
      if (!w.active) continue;
      w.x += w.vx; w.y += w.vy; w.rot += w.vrot;
      if ((w.y < -60 || w.x < -200 || w.x > SW + 200) && !w.slashed) {
        if (w.gid) {
          livesR.current = Math.max(0, livesR.current - 1);
          setLives(livesR.current);
          if (livesR.current <= 0) { endGame(); return; }
        }
        w.active = false;
      }
    }
    trailR.current   = trailR.current.filter(p => now - p.t < 300);
    effectsR.current = effectsR.current.filter(e => now - e.t0 < 900);
    rerender();
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let n = 3;
    const cd = setInterval(() => {
      n--;
      if (n <= 0) { clearInterval(cd); startGame(); }
      else setCdN(n);
    }, 1000);
    return () => {
      clearInterval(cd);
      clearInterval(loopId.current);
      clearInterval(spawnId.current);
      clearInterval(timerId.current);
    };
  }, []);

  function startGame() {
    phaseR.current = 'play'; setPhase('play');
    loopId.current  = setInterval(tick, 16);
    spawnId.current = setInterval(() => {
      if (phaseR.current !== 'play') return;
      wordsR.current.push(spawnWord(canvasH.current));
      const active = wordsR.current.filter(w => w.active).length;
      if (active < 5 && Math.random() < 0.4)
        wordsR.current.push(spawnWord(canvasH.current));
    }, 850);
    timerId.current = setInterval(() => {
      gameT.current--;
      setTimer(gameT.current);
      if (gameT.current <= 0) endGame();
    }, 1000);
  }

  function endGame() {
    if (dead.current) return;
    dead.current = true;
    phaseR.current = 'over'; setPhase('over');
    clearInterval(loopId.current);
    clearInterval(spawnId.current);
    clearInterval(timerId.current);

    if (npc) {
      const won = livesR.current > 0 && scoreR.current >= 50;
      addBattleResult({
        won,
        npcId: npc.id,
        difficulty: npc.difficulty,
        playerScore: scoreR.current,
        npcScore: Math.round(50 * npc.difficulty),
      });
    }
  }

  // ── Trail path ─────────────────────────────────────────────────────────────

  function buildPath(): string {
    const pts = trailR.current;
    if (pts.length < 2) return '';
    return pts.reduce((d, p, i) => d + (i === 0 ? `M${p.x} ${p.y}` : ` L${p.x} ${p.y}`), '');
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const now      = Date.now();
  const words    = wordsR.current.filter(w => w.active);
  const effects  = effectsR.current.filter(e => now - e.t0 < 900);
  const tp       = buildPath();

  return (
    <ImageBackground source={BG} style={s.root} resizeMode="cover">
      <View style={s.overlay} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backTxt}>✕</Text>
        </TouchableOpacity>
        <View style={s.titleWrap}>
          <Text style={s.title}>RAP SLASH</Text>
          {npc ? <Text style={s.titleSub}>{npc.battleName.toUpperCase()}</Text> : null}
        </View>
        <View style={s.livesRow}>
          {[0, 1, 2].map(i => (
            <Text key={i} style={{ fontSize: 20, opacity: i < lives ? 1 : 0.15 }}>❤️</Text>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsBar}>
        <View style={s.statCol}>
          <Text style={[s.statBig, { color: GOLD }]}>{score}</Text>
          <Text style={s.statLbl}>PONTOS</Text>
        </View>
        <View style={s.timerWrap}>
          <Text style={[s.timerNum, timer <= 5 && s.timerRed]}>{timer}</Text>
        </View>
        <View style={s.statCol}>
          <Text style={[s.statBig, { color: '#FF6600' }]}>x{combo}</Text>
          <Text style={s.statLbl}>COMBO</Text>
        </View>
      </View>

      {/* Canvas */}
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
          {/* Glow trail */}
          {tp ? <Path d={tp} stroke="rgba(255,210,50,0.22)" strokeWidth={18}
            strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
          {/* Main trail */}
          {tp ? <Path d={tp} stroke="rgba(255,220,80,0.95)" strokeWidth={3.5}
            strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}

          {/* Words */}
          {words.map(w => (
            <G key={w.id} transform={`translate(${w.x},${w.y}) rotate(${w.rot})`}>
              <Rect x={-w.pw/2-10} y={-22} width={w.pw+20} height={44} rx={8} fill={w.color} opacity={0.12} />
              <Rect x={-w.pw/2-8}  y={-20} width={w.pw+16} height={40} rx={6}
                fill="rgba(0,0,0,0.80)" stroke={w.color} strokeWidth={2} />
              <SvgText textAnchor="middle" y={8} fontSize={15} fontWeight="900"
                fill={w.color} letterSpacing={3}>
                {w.text}
              </SvgText>
            </G>
          ))}

          {/* Floating effects */}
          {effects.map(e => {
            const age = (now - e.t0) / 900;
            return (
              <SvgText key={e.id} x={e.x} y={e.y - age * 50}
                textAnchor="middle" fontSize={13} fontWeight="900"
                fill={e.color} opacity={1 - age} letterSpacing={1}>
                {e.text}
              </SvgText>
            );
          })}
        </Svg>

        {/* Punchline flash */}
        {flash ? (
          <View style={s.flashWrap} pointerEvents="none">
            <Text style={s.flashTxt}>{flash}</Text>
          </View>
        ) : null}

        {/* Countdown */}
        {phase === 'cd' && (
          <View style={s.fullOverlay} pointerEvents="none">
            <Text style={s.cdNum}>{cdN}</Text>
            <Text style={s.cdSub}>CORTE AS PALAVRAS CERTAS!</Text>
            <Text style={s.cdHint}>Combos de rimas = PUNCHLINE 💥</Text>
          </View>
        )}

        {/* Result */}
        {phase === 'over' && (
          <View style={s.resultWrap}>
            <Text style={s.resultLbl}>ROUND ENCERRADO</Text>
            <Text style={s.resultScore}>{score}</Text>
            <Text style={s.resultScoreSub}>PONTOS DE RIMA</Text>
            <View style={s.resultGrid}>
              {([
                ['🔥', String(flowR.current),    'SLASHES',   '#FF6600'],
                ['🎤', String(maxComboR.current), 'MAX COMBO', PURPLE],
                ['❤️', String(lives),             'VIDAS',     '#FF3030'],
              ] as [string,string,string,string][]).map(([icon,val,lbl,clr]) => (
                <View key={lbl} style={s.rStat}>
                  <Text style={s.rStatIcon}>{icon}</Text>
                  <Text style={[s.rStatVal, { color: clr }]}>{val}</Text>
                  <Text style={s.rStatLbl}>{lbl}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={s.doneBtn} onPress={() => router.back()} activeOpacity={0.85}>
              <Text style={s.doneBtnTxt}>VOLTAR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Flow bar */}
      {phase === 'play' && (
        <View style={s.flowBar}>
          <Text style={s.flowLbl}>🔥 FLOW</Text>
          <View style={s.flowTrack}>
            <View style={[s.flowFill, { width: `${Math.min(100, flow * 1.5)}%` as any }]} />
          </View>
          <Text style={s.flowNum}>{flow} SLASHES</Text>
        </View>
      )}
    </ImageBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#060606' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 10, paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  back:     { padding: 6 },
  backTxt:   { color: '#888', fontSize: 22, fontWeight: '900' as const },
  titleWrap: { alignItems: 'center' as const },
  title:     { fontFamily: GRAFFITI, color: GOLD, fontSize: 22, letterSpacing: 6 },
  titleSub:  { fontFamily: GRAFFITI, color: '#555', fontSize: 10, letterSpacing: 3, marginTop: -2 },
  livesRow: { flexDirection: 'row', gap: 2 },

  statsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,170,0,0.12)',
  },
  statCol:   { alignItems: 'center', minWidth: 70 },
  statBig:   { fontFamily: GRAFFITI, fontSize: 26 },
  statLbl:   { fontFamily: GRAFFITI, color: '#444', fontSize: 10, letterSpacing: 2 },
  timerWrap: { alignItems: 'center' },
  timerNum:  { fontFamily: GRAFFITI, color: '#FFF', fontSize: 40, lineHeight: 42 },
  timerRed:  { color: '#FF3030' },

  canvas: { flex: 1, position: 'relative', overflow: 'hidden' },

  flashWrap: {
    position: 'absolute', top: '28%', left: 0, right: 0,
    alignItems: 'center', zIndex: 10,
  },
  flashTxt: {
    fontFamily: GRAFFITI, fontSize: 30, letterSpacing: 3, color: '#FFF',
    textShadowColor: GOLD, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18,
  },

  fullOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)', zIndex: 20, gap: 8,
  },
  cdNum:  { fontFamily: GRAFFITI, color: GOLD, fontSize: 110, lineHeight: 112 },
  cdSub:  { fontFamily: GRAFFITI, color: '#888', fontSize: 16, letterSpacing: 4 },
  cdHint: { fontFamily: GRAFFITI, color: '#555', fontSize: 12, letterSpacing: 2 },

  resultWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.90)', zIndex: 20, gap: 8,
  },
  resultLbl:      { fontFamily: GRAFFITI, color: '#555', fontSize: 16, letterSpacing: 6 },
  resultScore:    { fontFamily: GRAFFITI, color: GOLD, fontSize: 84, lineHeight: 86 },
  resultScoreSub: { fontFamily: GRAFFITI, color: '#555', fontSize: 12, letterSpacing: 4 },
  resultGrid:     { flexDirection: 'row', gap: 28, marginTop: 18 },
  rStat:          { alignItems: 'center', gap: 2 },
  rStatIcon:      { fontSize: 24 },
  rStatVal:       { fontFamily: GRAFFITI, fontSize: 30 },
  rStatLbl:       { fontFamily: GRAFFITI, color: '#444', fontSize: 10, letterSpacing: 2 },
  doneBtn: {
    marginTop: 22, backgroundColor: GOLD, borderRadius: 6,
    paddingHorizontal: 42, paddingVertical: 14,
  },
  doneBtnTxt: { fontFamily: GRAFFITI, color: '#0A0A0A', fontSize: 20, letterSpacing: 5 },

  flowBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  flowLbl:   { fontFamily: GRAFFITI, color: '#FF6600', fontSize: 12, letterSpacing: 2 },
  flowTrack: { flex: 1, height: 6, backgroundColor: '#1A1A1A', borderRadius: 3 },
  flowFill:  { height: 6, backgroundColor: '#FF6600', borderRadius: 3 },
  flowNum:   { fontFamily: GRAFFITI, color: '#FF6600', fontSize: 12 },
});
