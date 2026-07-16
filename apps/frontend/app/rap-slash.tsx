/**
 * RapSlash — rhythm battle game
 *
 * 3 vertical lanes. Words fall from top to hit line.
 * Tap the lane at the right moment → PERFECT / GOOD / OK / MISS.
 * Same rhyme group in a row = COMBO chain.
 * Fill the Flow meter → PUNCHLINE MODE (2× points for 6 beats).
 * 3 rounds: player turn (16 beats) → NPC turn → repeat.
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  ImageBackground, Platform, Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCareerStore } from '../src/store/careerStore';
import { useCharacterStore, DEFAULT_LOOK } from '../src/store/characterStore';
import { NPCS } from '../src/data/npcs';
import { GRAFFITI } from '../src/theme/fonts';
import CharacterLayered from '../src/components/CharacterLayered';

// ── Constants ──────────────────────────────────────────────────────────────────
const GOLD   = '#FFAA00';
const PURPLE = '#9D00FF';
const RED    = '#FF2222';
const GREEN  = '#39FF14';
const CYAN   = '#00CFFF';

const BG = Platform.OS === 'web'
  ? { uri: '/bg-wall.png' }
  : require('../public/bg-wall.png');

const { width: SW } = Dimensions.get('window');
const CANVAS_W  = Math.min(SW, 440);
const CANVAS_OX = (SW - CANVAS_W) / 2;  // left offset to center canvas
const LANE_W    = CANVAS_W / 3;

const BPM           = 90;
const BEAT_MS       = Math.round(60000 / BPM);  // 667 ms
const BEATS_P_ROUND = 16;
const FALL_BEATS    = 4;
const FALL_MS       = FALL_BEATS * BEAT_MS;      // words take 4 beats to fall
const NPC_TURN_MS   = 2600;
const TOTAL_ROUNDS  = 3;

// Timing windows
const WIN_PERFECT = 100;
const WIN_GOOD    = 230;
const WIN_OK      = 420;

// Flow
const FLOW_MAX      = 10;   // perfect hits to fill
const PUNCH_BEATS   = 6;    // beats punchline lasts

// ── Rhyme data ─────────────────────────────────────────────────────────────────
const GROUPS = [
  { id: 'ao',   color: GOLD,      words: ['IRMÃO','NÃO','CORAÇÃO','SITUAÇÃO','LEÃO','BASTIÃO','CAMPEÃO','DESTINO'] },
  { id: 'flow', color: PURPLE,    words: ['FLOW','SHOW','VOOU','GANHOU','PODER','DOMINOU','MANDOU','VIROU'] },
  { id: 'rua',  color: GREEN,     words: ['RUA','LUA','SUA','CRUA','TORTURA','LARGURA','AVENTURA','ALTURA'] },
  { id: 'fama', color: '#FF5500', words: ['FAMA','CHAMA','DAMA','TRAMA','DRAMA','PANORAMA','PROGRAMA'] },
  { id: 'vem',  color: CYAN,      words: ['ALGUÉM','TAMBÉM','NINGUÉM','CONVÉM','MANTÉM','PORÉM','ALÉM'] },
];
const TRAPS = ['SECO','BLANK','FRACO','PAREI','PERDI','VAZIO','CAIU','ERROU'];

const P_COLOR: Record<string, string> = {
  chill: '#00CED1', arrogante: '#FF2020', timido: '#6A5ACD',
  agitado: GOLD,    misterioso: PURPLE,
};

// ── Types ──────────────────────────────────────────────────────────────────────
let _uid = 0;
type Quality  = 'perfect' | 'good' | 'ok' | 'miss' | 'trap';
type WState   = 'falling' | 'hit' | 'missed';
type Phase    = 'cd' | 'player' | 'npc_turn' | 'round_result' | 'over';

interface Word {
  id: string;
  lane: 0 | 1 | 2;
  text: string;
  gid: string | null;
  color: string;
  hitTime: number;
  state: WState;
  quality?: Quality;
}

interface FX {
  id: string;
  lane: number;
  label: string;
  color: string;
  t0: number;
}

// ── Word schedule generator ────────────────────────────────────────────────────
function genSchedule(startTime: number, round: number): Word[] {
  // Which lanes receive a word on each of the 16 beats
  const PATTERNS: number[][][] = [
    // Round 1 — single notes, relaxed
    [[0],[1],[2],[0],[1],[2],[0],[1],[2],[0],[1],[2],[0],[1],[2],[0]],
    // Round 2 — start doubling
    [[0,1],[2],[0],[1,2],[0],[2],[1],[0,1],[2],[0],[1],[0,2],[1],[0],[1,2],[0]],
    // Round 3 — aggressive
    [[0,1],[2],[1,2],[0],[0,1],[2],[0,2],[1],[0,1,2],[0],[1,2],[0],[0,1],[2],[0,1,2],[0]],
  ];

  const pat = PATTERNS[Math.min(round - 1, 2)];
  const words: Word[] = [];
  const lastGid: (string | null)[] = [null, null, null];

  for (let beat = 0; beat < BEATS_P_ROUND; beat++) {
    const lanes = pat[beat] ?? [beat % 3];
    for (const lane of lanes) {
      // hitTime = when word reaches hit line
      const hitTime = startTime + FALL_MS + beat * BEAT_MS;
      const isTrap  = Math.random() < 0.12 + (round - 1) * 0.025;

      let text: string, gid: string | null, color: string;
      if (isTrap) {
        text = TRAPS[Math.floor(Math.random() * TRAPS.length)];
        gid = null; color = RED;
      } else {
        // 40% chance to pick same group as previous in this lane → easier combos
        let g = GROUPS[Math.floor(Math.random() * GROUPS.length)];
        if (lastGid[lane] && Math.random() < 0.4)
          g = GROUPS.find(x => x.id === lastGid[lane]) ?? g;
        text = g.words[Math.floor(Math.random() * g.words.length)];
        gid = g.id; color = g.color;
        lastGid[lane] = g.id;
      }

      words.push({ id: `w${_uid++}`, lane: lane as 0|1|2, text, gid, color, hitTime, state: 'falling' });
    }
  }
  return words;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function RapSlashScreen() {
  const { npcId }   = useLocalSearchParams<{ npcId: string }>();
  const npc         = NPCS.find(n => n.id === npcId) ?? null;
  const career      = useCareerStore();
  const character   = useCharacterStore(s => s.character);
  const npcColor    = P_COLOR[npc?.personality ?? ''] ?? GOLD;
  const playerColor = character?.archetypeColor ?? GOLD;

  // ── UI state ────────────────────────────────────────────────────────────────
  const [phase,    setPhase]    = useState<Phase>('cd');
  const [round,    setRound]    = useState(1);
  const [cdN,      setCdN]      = useState(3);
  const [score,    setScore]    = useState(0);
  const [combo,    setCombo]    = useState(0);
  const [lives,    setLives]    = useState(3);
  const [flow,     setFlow]     = useState(0);
  const [punch,    setPunch]    = useState(false);
  const [beatDot,  setBeatDot]  = useState(-1);
  const [npcBarPct,setNpcBarPct]= useState(0);
  const [roundLog, setRoundLog] = useState<{p:number,n:number}[]>([]);
  const [, bump] = useState(0);
  const tick = () => bump(n => n + 1);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const phaseR      = useRef<Phase>('cd');
  const roundR      = useRef(1);
  const wordsR      = useRef<Word[]>([]);
  const fxR         = useRef<FX[]>([]);
  const scoreR      = useRef(0);
  const livesR      = useRef(3);
  const comboR      = useRef(0);
  const maxComboR   = useRef(0);
  const flowR       = useRef(0);
  const punchR      = useRef(false);
  const punchBeatsR = useRef(0);
  const lastGidR    = useRef<string | null>(null);
  const hitLineY    = useRef(360);
  const playerRnds  = useRef<number[]>([]);
  const npcRnds     = useRef<number[]>([]);
  const totalSlash  = useRef(0);
  const dead        = useRef(false);
  const loopId      = useRef<any>(null);
  const beatId      = useRef<any>(null);
  const beatCountR  = useRef(0);
  const npcBarAnim  = useRef(new Animated.Value(0)).current;

  // Tap press animations
  const tapScales = useRef([0, 1, 2].map(() => new Animated.Value(1))).current;
  // Beat ring pulse
  const beatRing  = useRef(new Animated.Value(0)).current;
  // Hit line flash
  const hitFlash  = useRef(new Animated.Value(0)).current;

  // ── Mount: countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    let n = 3;
    const cd = setInterval(() => {
      n--;
      if (n <= 0) { clearInterval(cd); beginRound(); }
      else setCdN(n);
    }, 1000);
    return () => { clearInterval(cd); stopAll(); };
  }, []);

  function stopAll() {
    clearInterval(loopId.current);
    clearInterval(beatId.current);
  }

  // ── Start a player round ────────────────────────────────────────────────────
  function beginRound() {
    wordsR.current = genSchedule(Date.now(), roundR.current);
    fxR.current    = [];
    scoreR.current = 0;  setScore(0);
    livesR.current = 3;  setLives(3);
    comboR.current = 0;  setCombo(0);
    flowR.current  = 0;  setFlow(0);
    punchR.current = false; punchBeatsR.current = 0; setPunch(false);
    lastGidR.current = null;
    dead.current = false;
    beatCountR.current = 0;
    setBeatDot(-1);

    phaseR.current = 'player'; setPhase('player');

    // Physics loop at ~60fps
    loopId.current = setInterval(gameTick, 16);

    // Beat metronome
    beatId.current = setInterval(beatTick, BEAT_MS);
    beatTick(); // fire immediately so first beat is on time
  }

  // ── Beat metronome ──────────────────────────────────────────────────────────
  function beatTick() {
    if (phaseR.current !== 'player') return;

    const b = beatCountR.current;
    setBeatDot(b % 8);
    beatCountR.current++;

    // Punchline countdown
    if (punchR.current) {
      punchBeatsR.current--;
      if (punchBeatsR.current <= 0) {
        punchR.current = false; setPunch(false);
      }
    }

    // Visual beat pulse
    beatRing.setValue(0);
    Animated.timing(beatRing, { toValue: 1, duration: BEAT_MS * 0.75, useNativeDriver: true }).start();

    // Check if all player beats done
    if (b >= BEATS_P_ROUND) {
      clearInterval(beatId.current);
      setTimeout(endPlayerTurn, BEAT_MS); // wait last note to expire
    }
  }

  // ── Physics tick ────────────────────────────────────────────────────────────
  function gameTick() {
    if (phaseR.current !== 'player') return;
    const now = Date.now();

    for (const w of wordsR.current) {
      if (w.state !== 'falling') continue;
      if (now > w.hitTime + WIN_OK) {
        w.state = 'missed';
        if (w.gid) {
          // missed a real word = lose life
          livesR.current = Math.max(0, livesR.current - 1);
          setLives(livesR.current);
          comboR.current = 0; lastGidR.current = null; setCombo(0);
          addFX(w.lane, 'MISS ✗', RED);
          if (livesR.current <= 0 && !dead.current) { endPlayerTurn(); return; }
        }
        // missed a trap = silent bonus (player dodged!)
      }
    }

    fxR.current = fxR.current.filter(e => now - e.t0 < 750);
    tick();
  }

  // ── Tap a lane ──────────────────────────────────────────────────────────────
  function tapLane(lane: 0 | 1 | 2) {
    if (phaseR.current !== 'player') return;

    // Animate tap button
    Animated.sequence([
      Animated.timing(tapScales[lane], { toValue: 0.88, duration: 55, useNativeDriver: true }),
      Animated.spring(tapScales[lane], { toValue: 1, tension: 220, friction: 6, useNativeDriver: true }),
    ]).start();

    // Flash hit line
    hitFlash.setValue(1);
    Animated.timing(hitFlash, { toValue: 0, duration: 180, useNativeDriver: true }).start();

    const now = Date.now();

    // Find nearest falling word in this lane within OK window
    const cands = wordsR.current.filter(
      w => w.lane === lane && w.state === 'falling' && Math.abs(w.hitTime - now) < WIN_OK
    );

    if (cands.length === 0) {
      // Blind tap — small penalty only if very off
      addFX(lane, '...', '#333');
      return;
    }

    const w = cands.reduce((a, b) =>
      Math.abs(a.hitTime - now) < Math.abs(b.hitTime - now) ? a : b
    );

    const delta = Math.abs(w.hitTime - now);
    w.state = 'hit';
    totalSlash.current++;

    // ── Trap ──
    if (!w.gid) {
      livesR.current = Math.max(0, livesR.current - 1);
      setLives(livesR.current);
      comboR.current = 0; lastGidR.current = null; setCombo(0);
      addFX(lane, '💀 TRAP!', RED);
      if (livesR.current <= 0 && !dead.current) endPlayerTurn();
      return;
    }

    // ── Quality ──
    let quality: 'perfect' | 'good' | 'ok';
    let basePts: number;
    if (delta < WIN_PERFECT)    { quality = 'perfect'; basePts = 20; }
    else if (delta < WIN_GOOD)  { quality = 'good';    basePts = 12; }
    else                        { quality = 'ok';      basePts = 5;  }
    w.quality = quality;

    // ── Combo ──
    const sameGroup = lastGidR.current === w.gid;
    if (sameGroup) comboR.current = Math.min(8, comboR.current + 1);
    else            comboR.current = 1;
    if (comboR.current > maxComboR.current) maxComboR.current = comboR.current;
    lastGidR.current = w.gid;
    setCombo(comboR.current);

    const mult  = comboR.current;
    const punch = punchR.current ? 2 : 1;
    const pts   = basePts * mult * punch;
    scoreR.current += pts;
    setScore(scoreR.current);

    // ── Flow ──
    if (quality === 'perfect') {
      const newFlow = Math.min(FLOW_MAX, flowR.current + 1);
      flowR.current = newFlow; setFlow(newFlow);
      if (newFlow >= FLOW_MAX && !punchR.current) activatePunchline();
    }

    // ── FX ──
    const qualLabel = quality === 'perfect' ? '⚡ PERFECT!' : quality === 'good' ? '✓ GOOD' : 'OK';
    const qualColor = quality === 'perfect' ? '#FFD700' : quality === 'good' ? GREEN : '#CCC';
    const comboStr  = mult > 1 ? ` x${mult}` : '';
    addFX(lane, qualLabel + comboStr, qualColor);
    addFX(lane, `+${pts}`, qualColor);
  }

  function addFX(lane: number, label: string, color: string) {
    fxR.current.push({ id: `f${_uid++}`, lane, label, color, t0: Date.now() });
  }

  function activatePunchline() {
    punchR.current = true; punchBeatsR.current = PUNCH_BEATS;
    flowR.current  = 0;    setFlow(0);
    setPunch(true);
  }

  // ── End of player turn ───────────────────────────────────────────────────────
  function endPlayerTurn() {
    if (dead.current) return;
    dead.current = true;
    stopAll();
    setPunch(false); punchR.current = false;

    const playerScore = scoreR.current;
    playerRnds.current.push(playerScore);

    // NPC responds
    phaseR.current = 'npc_turn'; setPhase('npc_turn');
    npcBarAnim.setValue(0);
    setNpcBarPct(0);

    const diff   = npc?.difficulty ?? 1;
    const npcScore = Math.round(diff * 48 + (roundR.current - 1) * 15 + (Math.random() * 20 - 10));

    Animated.timing(npcBarAnim, {
      toValue: Math.min(100, (npcScore / 250) * 100),
      duration: NPC_TURN_MS - 300,
      useNativeDriver: false,
    }).start();

    const step = npcScore / 22;
    let cur = 0;
    const npcInt = setInterval(() => {
      cur = Math.min(npcScore, cur + step);
      setNpcBarPct(Math.round(cur));
    }, NPC_TURN_MS / 22);

    setTimeout(() => {
      clearInterval(npcInt);
      setNpcBarPct(npcScore);
      npcRnds.current.push(npcScore);
      setRoundLog([...playerRnds.current.map((p, i) => ({ p, n: npcRnds.current[i] ?? 0 }))]);

      if (roundR.current >= TOTAL_ROUNDS) {
        // Game over
        phaseR.current = 'over'; setPhase('over');
        const totalP = playerRnds.current.reduce((a, b) => a + b, 0);
        const totalN = npcRnds.current.reduce((a, b) => a + b, 0);
        if (npc) career.addBattleResult({ won: totalP > totalN, npcId: npc.id, difficulty: npc.difficulty, playerScore: totalP, npcScore: totalN });
      } else {
        phaseR.current = 'round_result'; setPhase('round_result');
        setTimeout(() => {
          roundR.current++; setRound(roundR.current);
          phaseR.current = 'cd'; setPhase('cd'); setCdN(3);
          let n = 3;
          const cd = setInterval(() => {
            n--;
            if (n <= 0) { clearInterval(cd); beginRound(); }
            else setCdN(n);
          }, 1000);
        }, 2500);
      }
    }, NPC_TURN_MS);
  }

  // ── Render helpers ───────────────────────────────────────────────────────────

  const now        = Date.now();
  const totalP     = playerRnds.current.reduce((a, b) => a + b, 0) + (phase === 'player' ? scoreR.current : 0);
  const totalN     = npcRnds.current.reduce((a, b) => a + b, 0);
  const maxTotal   = Math.max(totalP, totalN, 50);
  const pBarPct    = Math.min(100, (totalP / maxTotal) * 100);
  const nBarPct    = Math.min(100, (totalN / maxTotal) * 100);

  // Words rendering: compute Y from hitTime
  const visibleWords = wordsR.current.filter(w => {
    if (w.state === 'missed') return false;
    if (w.state === 'hit')    return now - (w.hitTime) < 180; // brief flash after hit
    const y = hitLineY.current - (w.hitTime - now) * (hitLineY.current / FALL_MS);
    return y > -70 && y < hitLineY.current + 60;
  });

  return (
    <ImageBackground source={BG} style={s.root} resizeMode="cover">
      <View style={[s.overlay, punch && s.overlayPunch]} />

      {/* ══ BATTLE HEADER ══ */}
      <View style={s.battleHeader}>
        {/* Player side */}
        <View style={s.headerSide}>
          <View style={[s.miniAvatar, { borderColor: playerColor }]}>
            <CharacterLayered look={character?.look ?? DEFAULT_LOOK} size={32} />
          </View>
          <View style={s.headerMid}>
            <Text style={s.headerName} numberOfLines={1}>{character?.battleName ?? 'VOCÊ'}</Text>
            <View style={s.scoreBarBg}>
              <View style={[s.scoreBarFill, { width: `${pBarPct}%` as any, backgroundColor: playerColor }]} />
            </View>
            <Text style={[s.headerPts, { color: playerColor }]}>{totalP}</Text>
          </View>
        </View>

        {/* Round dots */}
        <View style={s.centerCol}>
          <View style={s.roundDots}>
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
              const done = i < roundLog.length;
              const won  = done && roundLog[i].p > roundLog[i].n;
              return <View key={i} style={[s.rDot, {
                backgroundColor: done ? (won ? playerColor : npcColor) : '#1E1E1E',
                borderColor: i === round - 1 && phase !== 'over' ? '#FFF' : 'transparent',
              }]} />;
            })}
          </View>
          <Text style={s.roundLabel}>R{round}/{TOTAL_ROUNDS}</Text>
        </View>

        {/* NPC side */}
        <View style={[s.headerSide, s.headerRight]}>
          <View style={s.headerMid}>
            <Text style={[s.headerName, { textAlign: 'right' }]} numberOfLines={1}>{npc?.name ?? '???'}</Text>
            <View style={[s.scoreBarBg, { transform: [{ scaleX: -1 }] }]}>
              <View style={[s.scoreBarFill, { width: `${nBarPct}%` as any, backgroundColor: npcColor }]} />
            </View>
            <Text style={[s.headerPts, { color: npcColor, textAlign: 'right' }]}>{totalN}</Text>
          </View>
          <View style={[s.miniAvatar, { borderColor: npcColor, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 22 }}>{npc?.emoji ?? '🎤'}</Text>
          </View>
        </View>
      </View>

      {/* ══ BEAT TRACK ══ */}
      <View style={s.beatTrack}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={[s.beatDot, {
            backgroundColor: i === beatDot ? (punch ? '#FFD700' : playerColor) : '#1C1C1C',
            transform: [{ scale: i === beatDot ? 1.4 : 1 }],
          }]} />
        ))}
        {/* Beat ring pulse (centered on beat track) */}
        <Animated.View pointerEvents="none" style={[s.beatRingWrap, { opacity: beatRing.interpolate({ inputRange: [0,1], outputRange: [0.7, 0] }), transform: [{ scale: beatRing.interpolate({ inputRange: [0,1], outputRange: [0.6, 2.2] }) }] }]}>
          <View style={[s.beatRing, { borderColor: punch ? '#FFD700' : playerColor }]} />
        </Animated.View>
      </View>

      {/* ══ LANE CANVAS ══ */}
      <View
        style={s.canvas}
        onLayout={e => { hitLineY.current = e.nativeEvent.layout.height * 0.82; }}
      >
        {/* Lane dividers */}
        <View style={[s.laneDivider, { left: CANVAS_OX + LANE_W }]} />
        <View style={[s.laneDivider, { left: CANVAS_OX + LANE_W * 2 }]} />

        {/* Hit line */}
        <Animated.View style={[s.hitLine, {
          top: hitLineY.current,
          left: CANVAS_OX,
          width: CANVAS_W,
          opacity: hitFlash.interpolate({ inputRange: [0,1], outputRange: [0.35, 1] }),
        }]} />

        {/* Hit zone circles */}
        {[0, 1, 2].map(lane => (
          <View key={lane} style={[s.hitCircle, {
            top: hitLineY.current - 14,
            left: CANVAS_OX + lane * LANE_W + LANE_W / 2 - 14,
            borderColor: punch ? '#FFD700' : ['rgba(255,170,0,0.5)','rgba(157,0,255,0.5)','rgba(57,255,20,0.5)'][lane],
          }]} />
        ))}

        {/* Falling words */}
        {visibleWords.map(w => {
          const isHit  = w.state === 'hit';
          const rawY   = hitLineY.current - (w.hitTime - now) * (hitLineY.current / FALL_MS);
          const y      = isHit ? hitLineY.current : rawY;
          const dist   = Math.abs(w.hitTime - now);
          const inPerf = dist < WIN_PERFECT;
          const inGood = dist < WIN_GOOD;
          const scale  = isHit ? 1.2 : inPerf ? 1.06 : 1.0;
          const opacity = isHit ? Math.max(0, 1 - (now - w.hitTime) / 180) : 1;

          return (
            <Animated.View
              key={w.id}
              pointerEvents="none"
              style={[
                s.wordCard,
                {
                  top:  y - 26,
                  left: CANVAS_OX + w.lane * LANE_W + 6,
                  width: LANE_W - 12,
                  borderColor: w.color,
                  borderWidth: inPerf ? 2.5 : inGood ? 2 : 1.5,
                  opacity,
                  transform: [{ scale }],
                  backgroundColor: isHit ? w.color + '30' : 'rgba(0,0,0,0.88)',
                  shadowColor: w.color,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: inPerf ? 0.9 : inGood ? 0.5 : 0.2,
                  shadowRadius: inPerf ? 10 : 5,
                  elevation: inPerf ? 8 : 3,
                }
              ]}
            >
              <Text style={[s.wordText, { color: w.color, fontSize: w.gid ? 13 : 12 }]} numberOfLines={1}>
                {w.gid ? w.text : `✕ ${w.text}`}
              </Text>
            </Animated.View>
          );
        })}

        {/* FX labels */}
        {fxR.current.filter(e => now - e.t0 < 750).map(e => {
          const age = (now - e.t0) / 750;
          return (
            <Text
              key={e.id}
              style={[s.fxLabel, {
                left: CANVAS_OX + e.lane * LANE_W + 4,
                width: LANE_W - 8,
                top: hitLineY.current - 30 - age * 80,
                opacity: 1 - age,
                color: e.color,
              }]}
            >
              {e.label}
            </Text>
          );
        })}

        {/* ── Overlays ── */}

        {/* Countdown */}
        {phase === 'cd' && (
          <View style={s.fullOverlay} pointerEvents="none">
            <Text style={s.cdNum}>{cdN}</Text>
            <Text style={s.cdSub}>ROUND {round} · TAP NO RITMO!</Text>
            <Text style={s.cdHint}>Mesmo grupo = COMBO  •  Flow cheio = PUNCHLINE 💥</Text>
          </View>
        )}

        {/* NPC turn */}
        {phase === 'npc_turn' && (
          <View style={s.fullOverlay} pointerEvents="none">
            <Text style={[s.npcEmoji, { color: npcColor }]}>{npc?.emoji ?? '🎤'}</Text>
            <Text style={s.npcName}>{npc?.name?.toUpperCase() ?? 'NPC'} RESPONDE</Text>
            <View style={s.npcBarBg}>
              <Animated.View style={[s.npcBarFill, {
                backgroundColor: npcColor,
                width: npcBarAnim.interpolate({ inputRange: [0,100], outputRange: ['0%','100%'] }) as any,
              }]} />
            </View>
            <Text style={[s.npcPts, { color: npcColor }]}>{npcBarPct} PTS</Text>
          </View>
        )}

        {/* Round result */}
        {phase === 'round_result' && (() => {
          const last = roundLog[roundLog.length - 1];
          const won  = last ? last.p > last.n : false;
          return (
            <View style={s.fullOverlay} pointerEvents="none">
              <Text style={[s.rrTitle, { color: won ? playerColor : npcColor }]}>
                {won ? '🏆 ROUND SEU!' : '💀 ROUND PERDIDO'}
              </Text>
              <View style={s.rrRow}>
                <Text style={[s.rrScore, { color: playerColor }]}>{last?.p ?? 0}</Text>
                <Text style={s.rrVs}>vs</Text>
                <Text style={[s.rrScore, { color: npcColor }]}>{last?.n ?? 0}</Text>
              </View>
              <Text style={s.rrNext}>PRÓXIMO ROUND...</Text>
            </View>
          );
        })()}

        {/* GAME OVER */}
        {phase === 'over' && (() => {
          const totalPFinal = playerRnds.current.reduce((a, b) => a + b, 0);
          const totalNFinal = npcRnds.current.reduce((a, b) => a + b, 0);
          const won   = totalPFinal > totalNFinal;
          const color = won ? playerColor : npcColor;
          return (
            <View style={s.resultWrap}>
              <Text style={[s.verdict, { color }]}>{won ? '🏆 VOCÊ VENCEU!' : '💀 VOCÊ PERDEU'}</Text>
              <Text style={s.verdictSub}>{npc?.battleName?.toUpperCase() ?? ''}</Text>

              <View style={s.totalsRow}>
                <View style={s.totalBlock}>
                  <Text style={s.totalName}>{character?.battleName ?? 'VOCÊ'}</Text>
                  <Text style={[s.totalNum, { color: playerColor }]}>{totalPFinal}</Text>
                </View>
                <Text style={s.totalVs}>VS</Text>
                <View style={[s.totalBlock, { alignItems: 'flex-start' }]}>
                  <Text style={s.totalName}>{npc?.name ?? 'NPC'}</Text>
                  <Text style={[s.totalNum, { color: npcColor }]}>{totalNFinal}</Text>
                </View>
              </View>

              {/* Round breakdown */}
              <View style={s.breakdown}>
                {roundLog.map((r, i) => {
                  const pw = r.p > r.n;
                  return (
                    <View key={i} style={s.bdRow}>
                      <Text style={[s.bdScore, { color: pw ? playerColor : '#444' }]}>{r.p}</Text>
                      <View style={[s.bdTag, { backgroundColor: pw ? playerColor : npcColor }]}>
                        <Text style={s.bdTagTxt}>R{i+1}</Text>
                      </View>
                      <Text style={[s.bdScore, { color: !pw ? npcColor : '#444', textAlign: 'right' }]}>{r.n}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={s.statRow}>
                <View style={s.statBox}>
                  <Text style={s.statIcon}>💥</Text>
                  <Text style={[s.statVal, { color: PURPLE }]}>{maxComboR.current}</Text>
                  <Text style={s.statLbl}>MAX COMBO</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statIcon}>🎤</Text>
                  <Text style={[s.statVal, { color: '#FF6600' }]}>{totalSlash.current}</Text>
                  <Text style={s.statLbl}>TAPS</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[s.endBtn, { backgroundColor: color }]}
                onPress={() => router.replace('/world')}
                activeOpacity={0.85}
              >
                <Text style={s.endBtnTxt}>{won ? 'CONTINUAR ▶' : 'TENTAR DE NOVO'}</Text>
              </TouchableOpacity>
            </View>
          );
        })()}
      </View>

      {/* ══ TAP BUTTONS ══ */}
      {(phase === 'player' || phase === 'cd') && (
        <View style={[s.tapRow, { left: CANVAS_OX, width: CANVAS_W }]}>
          {([0, 1, 2] as const).map(lane => {
            // Find closest word in this lane for preview
            const preview = wordsR.current
              .filter(w => w.lane === lane && w.state === 'falling')
              .sort((a, b) => a.hitTime - b.hitTime)[0];
            const previewColor = preview ? preview.color : '#1A1A1A';
            const previewText  = preview ? preview.text  : '';
            const isClose = preview && Math.abs(preview.hitTime - now) < WIN_GOOD;

            return (
              <Animated.View key={lane} style={{ flex: 1, transform: [{ scale: tapScales[lane] }] }}>
                <TouchableOpacity
                  style={[s.tapBtn, {
                    borderColor: isClose ? previewColor : '#1C1C1C',
                    backgroundColor: isClose ? previewColor + '18' : 'rgba(0,0,0,0.88)',
                  }]}
                  onPress={() => tapLane(lane)}
                  activeOpacity={0.7}
                >
                  {punch && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFD70010', borderRadius: 8 }]} />
                  )}
                  {previewText ? (
                    <Text style={[s.tapPreview, { color: previewColor }]} numberOfLines={1}>{previewText}</Text>
                  ) : (
                    <Text style={s.tapIcon}>♩</Text>
                  )}
                  <Text style={[s.tapLabel, { color: isClose ? previewColor : '#333' }]}>
                    {['◀', '▼', '▶'][lane]}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* ══ FLOW METER ══ */}
      <View style={[s.flowBar, punch && s.flowBarPunch, { paddingHorizontal: CANVAS_OX + 12 }]}>
        <Text style={[s.flowLbl, punch && { color: '#FFD700' }]}>
          {punch ? '💥 PUNCHLINE 2×!' : '⚡ FLOW'}
        </Text>
        <View style={s.flowTrack}>
          <View style={[s.flowFill, {
            width: `${(flow / FLOW_MAX) * 100}%` as any,
            backgroundColor: punch ? '#FFD700' : '#FF6600',
          }]} />
          {/* Segment ticks */}
          {Array.from({ length: FLOW_MAX - 1 }).map((_, i) => (
            <View key={i} style={[s.flowTick, { left: `${((i + 1) / FLOW_MAX) * 100}%` as any }]} />
          ))}
        </View>
        <Text style={[s.flowNum, punch && { color: '#FFD700' }]}>
          {punch ? `${punchBeatsR.current}♩` : `${flow}/${FLOW_MAX}`}
        </Text>
        {/* Live score */}
        <Text style={[s.liveScore, { color: punch ? '#FFD700' : playerColor }]}>{score}</Text>
        {/* Lives */}
        <View style={s.livesRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[s.heartDot, { backgroundColor: i < lives ? RED : '#1A1A1A' }]} />
          ))}
        </View>
      </View>
    </ImageBackground>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#040404' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.54)' },
  overlayPunch: { backgroundColor: 'rgba(12,8,0,0.60)' },

  // Header
  battleHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 50, paddingBottom: 8, paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.80)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  headerSide:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerRight: { flexDirection: 'row-reverse' },
  miniAvatar: {
    width: 36, height: 46, borderRadius: 5, borderWidth: 1.5,
    overflow: 'hidden', backgroundColor: '#0A0A0A',
    justifyContent: 'flex-end', alignItems: 'center',
  },
  headerMid:   { flex: 1, gap: 2 },
  headerName:  { fontFamily: GRAFFITI, color: '#BBB', fontSize: 10, letterSpacing: 1 },
  scoreBarBg:  { height: 3, backgroundColor: '#1A1A1A', borderRadius: 2, overflow: 'hidden' },
  scoreBarFill:{ height: 3, borderRadius: 2 },
  headerPts:   { fontFamily: GRAFFITI, fontSize: 13 },

  centerCol:  { alignItems: 'center', gap: 3 },
  roundDots:  { flexDirection: 'row', gap: 6 },
  rDot: {
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 1.5,
  },
  roundLabel: { fontFamily: GRAFFITI, color: '#444', fontSize: 9, letterSpacing: 2 },

  // Beat track
  beatTrack: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    position: 'relative',
  },
  beatDot: { width: 8, height: 8, borderRadius: 4 },
  beatRingWrap: {
    position: 'absolute', alignSelf: 'center',
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  beatRing: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },

  // Canvas
  canvas: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  laneDivider: {
    position: 'absolute', top: 0, bottom: 0, width: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  hitLine: {
    position: 'absolute', height: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  hitCircle: {
    position: 'absolute', width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, backgroundColor: 'transparent',
  },

  // Word cards
  wordCard: {
    position: 'absolute',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  wordText: {
    fontFamily: GRAFFITI, letterSpacing: 1,
    textAlign: 'center',
  },

  // FX
  fxLabel: {
    position: 'absolute',
    fontFamily: GRAFFITI, fontSize: 13, letterSpacing: 1,
    textAlign: 'center',
  },

  // Overlays
  fullOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.80)', zIndex: 20, gap: 10,
  },
  cdNum:  { fontFamily: GRAFFITI, color: GOLD, fontSize: 100, lineHeight: 102 },
  cdSub:  { fontFamily: GRAFFITI, color: '#999', fontSize: 14, letterSpacing: 4 },
  cdHint: { fontFamily: GRAFFITI, color: '#444', fontSize: 11, letterSpacing: 1, textAlign: 'center', paddingHorizontal: 20 },

  npcEmoji: { fontSize: 64, lineHeight: 70 },
  npcName:  { fontFamily: GRAFFITI, color: '#FFF', fontSize: 18, letterSpacing: 4, marginTop: 4 },
  npcBarBg: { width: '65%', height: 8, backgroundColor: '#1A1A1A', borderRadius: 4, overflow: 'hidden', marginTop: 10 },
  npcBarFill:{ height: 8, borderRadius: 4 },
  npcPts:   { fontFamily: GRAFFITI, fontSize: 28, marginTop: 6 },

  rrTitle: { fontFamily: GRAFFITI, fontSize: 24, letterSpacing: 3 },
  rrRow:   { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  rrScore: { fontFamily: GRAFFITI, fontSize: 48, lineHeight: 50 },
  rrVs:    { fontFamily: GRAFFITI, color: '#333', fontSize: 18 },
  rrNext:  { fontFamily: GRAFFITI, color: '#444', fontSize: 13, letterSpacing: 4, marginTop: 6 },

  // Game over
  resultWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 30, gap: 10, padding: 20,
  },
  verdict:    { fontFamily: GRAFFITI, fontSize: 28, letterSpacing: 3 },
  verdictSub: { fontFamily: GRAFFITI, color: '#444', fontSize: 12, letterSpacing: 3, marginTop: -4 },
  totalsRow:  { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 10 },
  totalBlock: { alignItems: 'flex-end', gap: 2 },
  totalName:  { fontFamily: GRAFFITI, color: '#555', fontSize: 11, letterSpacing: 2 },
  totalNum:   { fontFamily: GRAFFITI, fontSize: 50, lineHeight: 52 },
  totalVs:    { fontFamily: GRAFFITI, color: '#2A2A2A', fontSize: 22 },
  breakdown:  { gap: 6, width: '75%', marginTop: 4 },
  bdRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bdScore:    { fontFamily: GRAFFITI, fontSize: 18, flex: 1 },
  bdTag:      { width: 36, height: 20, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  bdTagTxt:   { fontFamily: GRAFFITI, color: '#000', fontSize: 10, letterSpacing: 2 },
  statRow:    { flexDirection: 'row', gap: 24, marginTop: 6 },
  statBox:    { alignItems: 'center', gap: 2 },
  statIcon:   { fontSize: 20 },
  statVal:    { fontFamily: GRAFFITI, fontSize: 26 },
  statLbl:    { fontFamily: GRAFFITI, color: '#444', fontSize: 9, letterSpacing: 2 },
  endBtn:     { marginTop: 14, borderRadius: 6, paddingHorizontal: 36, paddingVertical: 14 },
  endBtnTxt:  { fontFamily: GRAFFITI, color: '#000', fontSize: 17, letterSpacing: 5 },

  // Tap buttons
  tapRow: {
    position: 'absolute', bottom: 38, flexDirection: 'row',
    paddingHorizontal: 4, gap: 4,
  },
  tapBtn: {
    flex: 1, height: 80, borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', gap: 4,
    overflow: 'hidden',
  },
  tapPreview: { fontFamily: GRAFFITI, fontSize: 11, letterSpacing: 1, textAlign: 'center', paddingHorizontal: 4 },
  tapIcon:    { fontFamily: GRAFFITI, color: '#2A2A2A', fontSize: 24 },
  tapLabel:   { fontFamily: GRAFFITI, fontSize: 16 },

  // Flow bar
  flowBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  flowBarPunch: { borderTopColor: 'rgba(255,215,0,0.5)' },
  flowLbl:   { fontFamily: GRAFFITI, color: '#FF6600', fontSize: 11, letterSpacing: 1 },
  flowTrack: { flex: 1, height: 7, backgroundColor: '#1A1A1A', borderRadius: 4, overflow: 'hidden', position: 'relative' },
  flowFill:  { height: 7, borderRadius: 4, position: 'absolute', top: 0, left: 0 },
  flowTick:  { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  flowNum:   { fontFamily: GRAFFITI, color: '#FF6600', fontSize: 11, minWidth: 40, textAlign: 'right' },
  liveScore: { fontFamily: GRAFFITI, fontSize: 14, minWidth: 42, textAlign: 'right' },
  livesRow:  { flexDirection: 'row', gap: 3 },
  heartDot:  { width: 8, height: 8, borderRadius: 4 },
});
