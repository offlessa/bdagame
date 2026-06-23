import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Easing,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useBattleStore, TIMER_SECONDS } from '../store/battleStore';
import { useCareerStore } from '../store/careerStore';
import { Colors } from '../theme/colors';
import { GRAFFITI } from '../theme/fonts';
import { RhymeQuality } from '../types/game';
import WallBg from '../components/WallBg';

const QUALITY_COLOR: Record<RhymeQuality, string> = {
  fraca:    Colors.muted,
  ok:       Colors.orange,
  boa:      Colors.primary,
  perfeita: Colors.neon,
};

const QUALITY_LABEL: Record<RhymeQuality, string> = {
  fraca: 'FRACA', ok: 'OK', boa: 'BOA', perfeita: 'PERFEITA 🔥',
};

const LANE_COLORS = [Colors.primary, Colors.orange, Colors.purple, Colors.neon];
const LANE_KEYS   = ['A', 'S', 'D', 'F'];

// ── Helpers ─────────────────────────────────────────────────────────────────

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <View style={sc.scoreWrap}>
      <Text style={[sc.scoreLabel, { color }]}>{label}</Text>
      <Text style={[sc.scoreNum,  { color }]}>{score}</Text>
    </View>
  );
}

function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const pct   = seconds / total;
  const color = pct > 0.5 ? Colors.neon : pct > 0.25 ? Colors.primary : Colors.danger;
  return (
    <View style={[sc.timerRing, { borderColor: color }]}>
      <Text style={[sc.timerNum, { color }]}>{seconds}</Text>
    </View>
  );
}

function RoundBadge({ n, active, won }: { n: number; active: boolean; won?: boolean | null }) {
  const bg = won === true ? Colors.neon : won === false ? Colors.danger : active ? Colors.primary : Colors.dim;
  return (
    <View style={[sc.roundDot, { backgroundColor: bg }]}>
      <Text style={sc.roundDotTxt}>{n}</Text>
    </View>
  );
}

// ── Guitar Hero ──────────────────────────────────────────────────────────────

function GuitarHeroRound() {
  const { session, hitNote, missNote, finishRound3 } = useBattleStore();
  const r3 = session?.round3;
  const [activeIdx, setActiveIdx] = useState(0);
  const noteAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!r3 || r3.finished) return;
    const NOTE_MS = 650;
    let idx = 0;

    function next() {
      if (!r3 || idx >= r3.notes.length) { finishRound3(); return; }
      setActiveIdx(idx);
      noteAnim.setValue(0);
      Animated.timing(noteAnim, { toValue: 1, duration: NOTE_MS, easing: Easing.linear, useNativeDriver: true }).start();
      idx++;
      timerRef.current = setTimeout(next, NOTE_MS);
    }

    next();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (!r3 || !session) return null;

  const activeNote = r3.notes[activeIdx];
  const multiplier = Math.min(4, 1 + Math.floor(r3.streak / 4));
  const translateY  = noteAnim.interpolate({ inputRange: [0, 1], outputRange: [-90, 110] });

  function pressLane(lane: number) {
    if (!activeNote) return;
    if (activeNote.lane === lane) hitNote(activeNote.id);
    else missNote(activeNote.id);
  }

  return (
    <View style={sc.guitarWrap}>
      <Text style={sc.guitarTitle}>BATE-VOLTA 🎸</Text>
      <Text style={sc.guitarSub}>Acerte as notas no ritmo do beat!</Text>

      <View style={sc.streakRow}>
        <Text style={sc.streakTxt}>STREAK ×{r3.streak}</Text>
        <View style={[sc.multBadge, { backgroundColor: Colors.primary + '20' }]}>
          <Text style={[sc.multTxt, { color: Colors.primary }]}>×{multiplier} MULTI</Text>
        </View>
      </View>

      <View style={sc.track}>
        {LANE_COLORS.map((color, lane) => (
          <View key={lane} style={[sc.lane, { borderColor: color + '30' }]}>
            {activeNote?.lane === lane && (
              <Animated.View style={[sc.note, { backgroundColor: color, transform: [{ translateY }] }]} />
            )}
            <View style={[sc.hitZone, { borderColor: color }]} />
          </View>
        ))}
      </View>

      <View style={sc.laneButtons}>
        {LANE_COLORS.map((color, lane) => (
          <TouchableOpacity
            key={lane}
            style={[sc.laneBtn, { backgroundColor: color + '20', borderColor: color }]}
            onPress={() => pressLane(lane)}
            activeOpacity={0.55}
          >
            <Text style={[sc.laneBtnTxt, { color }]}>{LANE_KEYS[lane]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={sc.g3Scores}>
        <Text style={sc.g3Score}>Você: <Text style={{ color: Colors.primary }}>{r3.playerScore}</Text></Text>
        <Text style={sc.g3Score}>{session.npc.name}: <Text style={{ color: Colors.orange }}>?</Text></Text>
      </View>
    </View>
  );
}

// ── Battle Result ────────────────────────────────────────────────────────────

function BattleResult() {
  const { session, endBattle } = useBattleStore();
  const { addBattleResult, addFriendship } = useCareerStore();
  const applied = useRef(false);

  useEffect(() => {
    if (!session || applied.current) return;
    applied.current = true;
    const p = (session.round1?.playerScore ?? 0) + (session.round2?.playerScore ?? 0) + (session.round3?.playerScore ?? 0);
    const n = (session.round1?.npcScore ?? 0)    + (session.round2?.npcScore ?? 0)    + (session.round3?.npcScore ?? 0);
    const won = session.winner === 'player';
    addBattleResult({ won, npcId: session.npc.id, difficulty: session.npc.difficulty, playerScore: p, npcScore: n });
    addFriendship(session.npc.id, won ? 15 : 8);
  }, []);

  if (!session) return null;

  const won  = session.winner === 'player';
  const draw = session.winner === 'draw';
  const p    = (session.round1?.playerScore ?? 0) + (session.round2?.playerScore ?? 0) + (session.round3?.playerScore ?? 0);
  const n    = (session.round1?.npcScore ?? 0)    + (session.round2?.npcScore ?? 0)    + (session.round3?.npcScore ?? 0);
  const lines = won ? session.npc.lossLines : draw ? ['Empate justo...'] : session.npc.winLines;
  const line  = lines[Math.floor(Math.random() * lines.length)];

  return (
    <ScrollView contentContainerStyle={sc.resultWrap}>
      <Text style={[sc.resultTitle, { color: won ? Colors.neon : draw ? Colors.primary : Colors.danger }]}>
        {won ? '🏆 VITÓRIA!' : draw ? '🤝 EMPATE' : '💀 DERROTA'}
      </Text>
      <Text style={sc.resultNpcLine}>"{line}"</Text>
      <Text style={sc.resultNpcBy}>— {session.npc.name}</Text>

      <View style={sc.resultScores}>
        {[
          { label: 'Round 1',   pv: session.round1?.playerScore ?? 0, nv: session.round1?.npcScore ?? 0 },
          { label: 'Round 2',   pv: session.round2?.playerScore ?? 0, nv: session.round2?.npcScore ?? 0 },
          { label: 'Bate-volta',pv: session.round3?.playerScore ?? 0, nv: session.round3?.npcScore ?? 0 },
        ].map(row => (
          <View key={row.label} style={sc.resultRow}>
            <Text style={sc.resultRowLbl}>{row.label}</Text>
            <Text style={[sc.resultRowScore, { color: row.pv >= row.nv ? Colors.neon : Colors.muted }]}>{row.pv}</Text>
            <Text style={sc.resultRowVs}>×</Text>
            <Text style={[sc.resultRowScore, { color: row.nv > row.pv ? Colors.danger : Colors.muted }]}>{row.nv}</Text>
          </View>
        ))}
        <View style={[sc.resultRow, { borderColor: Colors.primary, marginTop: 4 }]}>
          <Text style={[sc.resultRowLbl, { color: Colors.white }]}>TOTAL</Text>
          <Text style={[sc.resultRowScore, { color: Colors.primary, fontSize: 22 }]}>{p}</Text>
          <Text style={sc.resultRowVs}>×</Text>
          <Text style={[sc.resultRowScore, { color: Colors.orange, fontSize: 22 }]}>{n}</Text>
        </View>
      </View>

      <TouchableOpacity style={sc.finishBtn} onPress={() => { endBattle(); router.replace('/menu'); }} activeOpacity={0.85}>
        <Text style={sc.finishBtnTxt}>CONTINUAR</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function BattleScreen() {
  const { session, advancePhase, playerChoose, tickTimer } = useBattleStore();
  const { attributes } = useCareerStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!session) return;
    if (session.phase === 'r1_player' || session.phase === 'r2_player') {
      timerRef.current = setInterval(tickTimer, 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session?.phase]);

  if (!session) {
    return (
      <View style={[sc.bg, { alignItems: 'center', justifyContent: 'center', gap: 20 }]}>
        <WallBg intensity="medium" />
        <Text style={{ color: Colors.muted, fontSize: 14 }}>Nenhuma batalha em curso.</Text>
        <TouchableOpacity style={sc.finishBtn} onPress={() => router.replace('/menu')}>
          <Text style={sc.finishBtnTxt}>VOLTAR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { npc, beat, phase } = session;
  const isIntro   = phase === 'intro';
  const isR1P     = phase === 'r1_player';
  const isR2P     = phase === 'r2_player';
  const isNpcTurn = phase === 'r1_npc' || phase === 'r2_npc';
  const isRndRes  = phase === 'r1_result' || phase === 'r2_result';
  const isGuitar  = phase === 'r3_guitar';
  const isFinal   = phase === 'battle_result';

  const curRound = phase.startsWith('r1') ? 1 : phase.startsWith('r2') ? 2 : 3;
  const r1won    = session.round1 ? session.round1.playerScore > session.round1.npcScore : null;
  const r2won    = session.round2 ? session.round2.playerScore > session.round2.npcScore : null;

  const totP = (session.round1?.playerScore ?? 0) + (session.round2?.playerScore ?? 0);
  const totN = (session.round1?.npcScore    ?? 0) + (session.round2?.npcScore    ?? 0);

  const curRndData = curRound === 1 ? session.round1 : session.round2;

  if (isFinal) return <View style={sc.bg}><WallBg intensity="medium" /><BattleResult /></View>;

  return (
    <View style={sc.bg}>
      <WallBg intensity="light" />
      {/* Top bar */}
      <View style={sc.topBar}>
        <View style={sc.npcChip}>
          <Text style={sc.npcEmoji}>{npc.emoji}</Text>
          <View>
            <Text style={sc.npcName}>{npc.name}</Text>
            <Text style={sc.npcNick}>{npc.nickname}</Text>
          </View>
        </View>
        <View style={sc.roundDots}>
          <RoundBadge n={1} active={curRound === 1} won={r1won} />
          <RoundBadge n={2} active={curRound === 2} won={r2won} />
          <RoundBadge n={3} active={curRound === 3} won={null} />
        </View>
        <View style={sc.beatChip}>
          <Text style={sc.beatEmoji}>{beat.emoji}</Text>
          <Text style={sc.beatName}>{beat.name}</Text>
        </View>
      </View>

      {/* Score */}
      <View style={sc.scoreStrip}>
        <ScoreBar label="VOCÊ" score={totP} color={Colors.primary} />
        <Text style={sc.vs}>VS</Text>
        <ScoreBar label={npc.name.toUpperCase()} score={totN} color={Colors.orange} />
      </View>

      <ScrollView contentContainerStyle={sc.content} showsVerticalScrollIndicator={false}>

        {/* Intro */}
        {isIntro && (
          <View style={sc.introWrap}>
            <Text style={sc.introBeat}>{beat.emoji} {beat.name.toUpperCase()}</Text>
            <View style={sc.speechBubble}>
              <Text style={sc.speechTxt}>"{npc.greetings[Math.floor(Math.random() * npc.greetings.length)]}"</Text>
            </View>
            <Text style={sc.speechBy}>— {npc.name}, {npc.nickname}</Text>
            <TouchableOpacity style={sc.startBtn} onPress={advancePhase} activeOpacity={0.85}>
              <Text style={sc.startBtnTxt}>⚔️ COMEÇAR BATALHA</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Player turn */}
        {(isR1P || isR2P) && (
          <>
            <View style={sc.roundHeader}>
              <Text style={sc.roundLabel}>ROUND {curRound}</Text>
              <TimerRing seconds={session.timer} total={TIMER_SECONDS} />
            </View>
            <Text style={sc.chooseLabel}>ESCOLHA SUA RIMA:</Text>
            {session.currentOptions.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[sc.rhymeCard, { borderColor: QUALITY_COLOR[opt.quality] + '60' }]}
                onPress={() => playerChoose(opt.id, attributes as any)}
                activeOpacity={0.75}
              >
                <View style={[sc.qTag, { backgroundColor: QUALITY_COLOR[opt.quality] + '22' }]}>
                  <Text style={[sc.qTagTxt, { color: QUALITY_COLOR[opt.quality] }]}>{QUALITY_LABEL[opt.quality]}</Text>
                </View>
                <Text style={sc.rhymeTxt}>{opt.text}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* NPC turn / round result */}
        {(isNpcTurn || isRndRes) && curRndData && (
          <>
            <View style={sc.roundHeader}>
              <Text style={sc.roundLabel}>ROUND {curRound}</Text>
              {isNpcTurn && <Text style={sc.npcThinking}>{npc.name} responde...</Text>}
              {isRndRes && (
                <Text style={[sc.roundWinnerTxt, { color: curRndData.playerScore >= curRndData.npcScore ? Colors.neon : Colors.danger }]}>
                  {curRndData.playerScore >= curRndData.npcScore ? 'VOCÊ GANHOU!' : 'NPC GANHOU!'}
                </Text>
              )}
            </View>

            <View style={sc.compRow}>
              <View style={[sc.compCard, { borderColor: Colors.primary + '40' }]}>
                <Text style={sc.compName}>Você</Text>
                <View style={[sc.qTag, { backgroundColor: QUALITY_COLOR[curRndData.playerQuality ?? 'ok'] + '22' }]}>
                  <Text style={[sc.qTagTxt, { color: QUALITY_COLOR[curRndData.playerQuality ?? 'ok'] }]}>
                    {QUALITY_LABEL[curRndData.playerQuality ?? 'ok']}
                  </Text>
                </View>
                <Text style={[sc.compScore, { color: Colors.primary }]}>{curRndData.playerScore} pts</Text>
              </View>
              <View style={[sc.compCard, { borderColor: Colors.orange + '40' }]}>
                <Text style={sc.compName}>{npc.name}</Text>
                <View style={[sc.qTag, { backgroundColor: Colors.orange + '22' }]}>
                  <Text style={[sc.qTagTxt, { color: Colors.orange }]}>
                    {QUALITY_LABEL[curRndData.npcQuality ?? 'ok']}
                  </Text>
                </View>
                <Text style={[sc.compScore, { color: Colors.orange }]}>{curRndData.npcScore} pts</Text>
              </View>
            </View>

            {isRndRes && (
              <TouchableOpacity style={sc.nextBtn} onPress={advancePhase} activeOpacity={0.85}>
                <Text style={sc.nextBtnTxt}>{curRound === 2 ? '🎸 BATE-VOLTA!' : 'PRÓXIMO ROUND →'}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Guitar Hero */}
        {isGuitar && <GuitarHeroRound />}

      </ScrollView>
    </View>
  );
}

const sc = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.bg },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface,
  },
  npcChip:  { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  npcEmoji: { fontSize: 28 },
  npcName:  { fontFamily: GRAFFITI, color: Colors.white, fontSize: 18, letterSpacing: 2 },
  npcNick:  { fontFamily: GRAFFITI, color: Colors.muted, fontSize: 13 },
  roundDots:   { flexDirection: 'row', gap: 6 },
  roundDot:    { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roundDotTxt: { fontFamily: GRAFFITI, color: Colors.bg, fontSize: 14 },
  beatChip:  { flex: 1, alignItems: 'flex-end' },
  beatEmoji: { fontSize: 18 },
  beatName:  { fontFamily: GRAFFITI, color: Colors.muted, fontSize: 14, letterSpacing: 2 },

  scoreStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  scoreWrap:  { alignItems: 'center' },
  scoreLabel: { fontFamily: GRAFFITI, fontSize: 14, letterSpacing: 3 },
  scoreNum:   { fontFamily: GRAFFITI, fontSize: 30 },
  vs: { fontFamily: GRAFFITI, color: Colors.muted, fontSize: 18, letterSpacing: 3 },

  content: { padding: 20, gap: 14, paddingBottom: 60 },

  introWrap:   { alignItems: 'center', paddingTop: 20, gap: 16 },
  introBeat:   { fontFamily: GRAFFITI, color: Colors.primary, fontSize: 28, letterSpacing: 5 },
  speechBubble:{ backgroundColor: Colors.card, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, padding: 16, maxWidth: 320 },
  speechTxt:   { color: Colors.white, fontSize: 14, fontStyle: 'italic', lineHeight: 20, textAlign: 'center' },
  speechBy:    { color: Colors.muted, fontSize: 11 },
  startBtn:    { backgroundColor: Colors.primary, borderRadius: 4, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 },
  startBtnTxt: { fontFamily: GRAFFITI, color: Colors.bg, fontSize: 24, letterSpacing: 6 },

  roundHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundLabel:  { fontFamily: GRAFFITI, color: Colors.primary, fontSize: 24, letterSpacing: 5 },
  roundWinnerTxt: { fontFamily: GRAFFITI, fontSize: 18, letterSpacing: 2 },
  npcThinking: { color: Colors.muted, fontSize: 12, fontStyle: 'italic' },

  timerRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  timerNum:  { fontFamily: GRAFFITI, fontSize: 22 },

  chooseLabel: { fontFamily: GRAFFITI, color: Colors.muted, fontSize: 16, letterSpacing: 3 },
  rhymeCard:   { backgroundColor: Colors.card, borderRadius: 6, borderWidth: 1.5, padding: 14, gap: 8 },
  qTag:        { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  qTagTxt:     { fontFamily: GRAFFITI, fontSize: 15, letterSpacing: 3 },
  rhymeTxt:    { color: Colors.white, fontSize: 13, lineHeight: 18 },

  compRow:   { flexDirection: 'row', gap: 10 },
  compCard:  { flex: 1, backgroundColor: Colors.card, borderRadius: 6, borderWidth: 1.5, padding: 14, gap: 8, alignItems: 'center' },
  compName:  { fontFamily: GRAFFITI, color: Colors.muted, fontSize: 15, letterSpacing: 2 },
  compScore: { fontFamily: GRAFFITI, fontSize: 28 },

  nextBtn:    { backgroundColor: Colors.primary, borderRadius: 4, paddingVertical: 14, alignItems: 'center' },
  nextBtnTxt: { fontFamily: GRAFFITI, color: Colors.bg, fontSize: 22, letterSpacing: 5 },

  guitarWrap:   { alignItems: 'center', gap: 14 },
  guitarTitle:  { fontFamily: GRAFFITI, color: Colors.primary, fontSize: 32, letterSpacing: 6 },
  guitarSub:    { fontFamily: GRAFFITI, color: Colors.muted, fontSize: 16, letterSpacing: 2 },
  streakRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakTxt:    { fontFamily: GRAFFITI, color: Colors.white, fontSize: 20, letterSpacing: 3 },
  multBadge:    { borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  multTxt:      { fontFamily: GRAFFITI, fontSize: 18, letterSpacing: 3 },
  track:        { flexDirection: 'row', height: 160, gap: 4, width: '100%', maxWidth: 320 },
  lane:         { flex: 1, borderWidth: 1, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  note:         { position: 'absolute', top: 0, left: 4, right: 4, height: 28, borderRadius: 6 },
  hitZone:      { position: 'absolute', bottom: 0, left: 0, right: 0, height: 26, borderTopWidth: 2 },
  laneButtons:  { flexDirection: 'row', gap: 4, width: '100%', maxWidth: 320 },
  laneBtn:      { flex: 1, height: 52, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  laneBtnTxt:   { fontFamily: GRAFFITI, fontSize: 26 },
  g3Scores:     { flexDirection: 'row', gap: 24 },
  g3Score:      { color: Colors.muted, fontSize: 13 },

  resultWrap:      { padding: 24, gap: 16, alignItems: 'center', paddingBottom: 60 },
  resultTitle:     { fontFamily: GRAFFITI, fontSize: 48, letterSpacing: 8 },
  resultNpcLine:   { color: Colors.white, fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
  resultNpcBy:     { color: Colors.muted, fontSize: 11 },
  resultScores:    { width: '100%', maxWidth: 360, gap: 4 },
  resultRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 4, padding: 12, borderWidth: 1, borderColor: Colors.border },
  resultRowLbl:    { color: Colors.muted, fontSize: 11, fontWeight: '700', flex: 1 },
  resultRowScore:  { fontFamily: GRAFFITI, fontSize: 22 },
  resultRowVs:     { color: Colors.muted, fontSize: 12 },
  finishBtn:       { backgroundColor: Colors.primary, borderRadius: 4, paddingVertical: 14, paddingHorizontal: 48 },
  finishBtnTxt:    { fontFamily: GRAFFITI, color: Colors.bg, fontSize: 24, letterSpacing: 6 },
});
