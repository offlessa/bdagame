import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { getSocket } from '../hooks/useSocket';
import { MCCardView } from '../components/cards/MCCardView';
import { BeatCardView } from '../components/cards/BeatCardView';
import { Colors } from '../theme/colors';
import { AttributeKey, MOMENT_CARDS, BEAT_CARDS } from '@batalha/game-engine';

const ALL_ATTRS: AttributeKey[] = ['flow', 'tecnica', 'frieza', 'inteligencia', 'presenca', 'punchline'];

export default function BattleScreen() {
  const { battle, myId, roomId, lastBeat, lastMoment, phase } = useGameStore();
  const userId = useAuthStore((s) => s.userId);
  const [chosenAttrs, setChosenAttrs] = useState<AttributeKey[]>([]);
  const [fatalityPending, setFatalityPending] = useState(false);

  useEffect(() => {
    if (phase === 'result') router.replace('/result');
  }, [phase]);

  if (!battle || !battle.currentRound) {
    return (
      <LinearGradient colors={[Colors.bg, '#3D1500']} style={styles.bg}>
        <Text style={styles.waiting}>Aguardando batalha...</Text>
      </LinearGradient>
    );
  }

  const round = battle.currentRound;
  const myPlayer = battle.players.find((p) => p.id === userId);
  const opponent = battle.players.find((p) => p.id !== userId);
  const myMC = myPlayer?.hand[myPlayer.usedMCIndex];
  const isAttacker = round.attackerId === userId;

  const roundScores = battle.players.map((p) => `${p.id === userId ? 'Eu' : 'Oponente'}: ${p.roundsWon} round(s)`).join(' | ');

  function toggleAttr(attr: AttributeKey) {
    if (chosenAttrs.includes(attr)) {
      setChosenAttrs(chosenAttrs.filter((a) => a !== attr));
    } else if (chosenAttrs.length < (round.roundNumber === 3 ? 1 : 2)) {
      setChosenAttrs([...chosenAttrs, attr]);
    }
  }

  function drawBeat() {
    const randomBeat = BEAT_CARDS[Math.floor(Math.random() * BEAT_CARDS.length)];
    getSocket()?.emit('round:draw_beat', { roomId, beatId: randomBeat.id });
  }

  function submitAttrs() {
    if (chosenAttrs.length !== (round.roundNumber === 3 ? 1 : 2)) {
      Alert.alert(`Escolha ${round.roundNumber === 3 ? '1 atributo' : '2 atributos'}`);
      return;
    }
    getSocket()?.emit('round:choose_attrs', { roomId, attrs: chosenAttrs });
    setChosenAttrs([]);
  }

  function activateFatality() {
    if ((myPlayer?.barras ?? 0) < 3) { Alert.alert('Barras insuficientes (precisa de 3)'); return; }
    getSocket()?.emit('round:fatality', { roomId });
    setFatalityPending(false);
  }

  function skipFatality() {
    getSocket()?.emit('round:fatality_done', { roomId });
  }

  function revealMoment() {
    const randomMoment = MOMENT_CARDS[Math.floor(Math.random() * MOMENT_CARDS.length)];
    getSocket()?.emit('round:reveal_moment', { roomId, momentId: randomMoment.id });
  }

  function calculateRound() {
    getSocket()?.emit('round:calculate', { roomId });
  }

  return (
    <LinearGradient colors={[Colors.bg, '#3D1500']} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.roundLabel}>ROUND {round.roundNumber}</Text>
          <Text style={styles.scores}>{roundScores}</Text>
          <Text style={styles.role}>{isAttacker ? '⚔ VOCÊ ATACA' : '🛡 VOCÊ RESPONDE'}</Text>
        </View>

        {/* Barras */}
        <View style={styles.barrasRow}>
          <Text style={styles.barrasText}>Suas Barras: {'▮'.repeat(myPlayer?.barras ?? 0)}{'▯'.repeat(3 - (myPlayer?.barras ?? 0))}</Text>
          <Text style={styles.barrasText}>Oponente: {'▮'.repeat(opponent?.barras ?? 0)}{'▯'.repeat(3 - (opponent?.barras ?? 0))}</Text>
        </View>

        {/* Beat */}
        {!lastBeat && isAttacker && round.phase === 'waiting_beat' && (
          <TouchableOpacity style={styles.actionBtn} onPress={drawBeat}>
            <Text style={styles.actionBtnText}>COMPRAR BEAT</Text>
          </TouchableOpacity>
        )}
        {lastBeat && <BeatCardView beat={lastBeat} />}

        {/* Attr selection */}
        {(round.phase === 'attacker_choose_attrs' && isAttacker) ||
          (round.phase === 'defender_choose_attrs' && !isAttacker) ? (
          <View style={styles.attrSection}>
            <Text style={styles.attrTitle}>
              Escolha {round.roundNumber === 3 ? '1 atributo' : '2 atributos'}:
            </Text>
            <View style={styles.attrGrid}>
              {ALL_ATTRS.map((attr) => (
                <TouchableOpacity
                  key={attr}
                  style={[styles.attrBtn, chosenAttrs.includes(attr) && styles.attrBtnSelected]}
                  onPress={() => toggleAttr(attr)}
                >
                  <Text style={[styles.attrBtnText, chosenAttrs.includes(attr) && styles.attrBtnTextSelected]}>
                    {attr.charAt(0).toUpperCase() + attr.slice(1)}
                  </Text>
                  <Text style={styles.attrBtnValue}>{myMC?.attributes[attr]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={submitAttrs}>
              <Text style={styles.actionBtnText}>CONFIRMAR</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Fatality window */}
        {round.phase === 'fatality_window' && (
          <View style={styles.fatalitySection}>
            <Text style={styles.sectionTitle}>JANELA DE FATALITY</Text>
            {myMC && <MCCardView mc={myMC} />}
            <View style={styles.fatalityBtns}>
              <TouchableOpacity style={[styles.actionBtn, styles.fatalityBtn]} onPress={activateFatality}>
                <Text style={styles.actionBtnText}>ATIVAR FATALITY (3 barras)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipBtn} onPress={skipFatality}>
                <Text style={styles.skipText}>Pular</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Moment reveal */}
        {round.phase === 'calculating' && !isAttacker && !lastMoment && (
          <TouchableOpacity style={styles.actionBtn} onPress={revealMoment}>
            <Text style={styles.actionBtnText}>REVELAR MOMENT</Text>
          </TouchableOpacity>
        )}
        {lastMoment && (
          <View style={styles.momentCard}>
            <Text style={styles.momentName}>{lastMoment.name}</Text>
            <Text style={styles.momentDesc}>{lastMoment.description}</Text>
          </View>
        )}

        {/* Calculate */}
        {round.phase === 'calculating' && isAttacker && lastMoment && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={calculateRound}>
            <Text style={styles.actionBtnText}>CALCULAR RESULTADO</Text>
          </TouchableOpacity>
        )}

        {/* My MC */}
        {myMC && (
          <View style={styles.myMCSection}>
            <Text style={styles.sectionTitle}>SEU MC ATIVO</Text>
            <MCCardView mc={myMC} highlightAttrs={chosenAttrs} />
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { padding: 16, paddingTop: 50 },
  header: { alignItems: 'center', marginBottom: 12 },
  roundLabel: { color: Colors.mcOrange, fontSize: 28, fontWeight: '900', letterSpacing: 3 },
  scores: { color: Colors.gold, fontSize: 12, marginTop: 2 },
  role: { color: Colors.white, fontSize: 14, fontWeight: '700', marginTop: 4 },
  barrasRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.offWhite + '10', borderRadius: 8, padding: 10, marginBottom: 16 },
  barrasText: { color: Colors.gold, fontSize: 13 },
  actionBtn: { backgroundColor: Colors.mcOrange, borderRadius: 10, padding: 16, alignItems: 'center', marginVertical: 10 },
  actionBtnText: { color: Colors.white, fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  attrSection: { marginVertical: 8 },
  attrTitle: { color: Colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  attrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attrBtn: { borderRadius: 8, borderWidth: 1, borderColor: Colors.gold + '60', padding: 10, minWidth: 90, alignItems: 'center', backgroundColor: Colors.offWhite + '10' },
  attrBtnSelected: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  attrBtnText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
  attrBtnTextSelected: { color: Colors.text },
  attrBtnValue: { color: Colors.mcOrange, fontSize: 18, fontWeight: '900', marginTop: 2 },
  fatalitySection: { alignItems: 'center', padding: 12, backgroundColor: Colors.danger + '20', borderRadius: 12, marginVertical: 8 },
  sectionTitle: { color: Colors.gold, fontSize: 13, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  fatalityBtns: { width: '100%' },
  fatalityBtn: { backgroundColor: Colors.danger },
  skipBtn: { alignItems: 'center', padding: 10 },
  skipText: { color: Colors.textLight, fontSize: 13 },
  momentCard: { backgroundColor: Colors.momentGreen + '30', borderRadius: 12, padding: 14, marginVertical: 8 },
  momentName: { color: Colors.momentGreenLight, fontSize: 16, fontWeight: '900' },
  momentDesc: { color: Colors.white, fontSize: 12, marginTop: 4 },
  myMCSection: { marginTop: 16, alignItems: 'center' },
  waiting: { color: Colors.gold, fontSize: 18, textAlign: 'center', marginTop: 200 },
});
