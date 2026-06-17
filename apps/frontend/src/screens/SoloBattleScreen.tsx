import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSoloStore, PLAYER_ID, AI_ID } from '../store/soloStore';
import { Colors } from '../theme/colors';
import { AttributeKey, getAvailableAttrsForRound3 } from '@batalha/game-engine';

const ALL_ATTRS: AttributeKey[] = ['flow', 'tecnica', 'frieza', 'inteligencia', 'presenca', 'punchline'];

const ATTR_COLORS: Record<AttributeKey, string> = {
  flow: Colors.flow,
  tecnica: Colors.tecnica,
  frieza: Colors.frieza,
  inteligencia: Colors.inteligencia,
  presenca: Colors.presenca,
  punchline: Colors.punchline,
};

export default function SoloBattleScreen() {
  const store = useSoloStore();
  const { battle, soloPhase, winner, lastBeat, lastMoment, aiMessage, awaitingAI, aiTrigger, lastRoundResult } = store;
  const [chosenAttrs, setChosenAttrs] = useState<AttributeKey[]>([]);
  const [fatalityDecided, setFatalityDecided] = useState(false);
  const { width } = useWindowDimensions();

  // aiTrigger sempre incrementa quando IA precisa agir — garante re-execução mesmo com React batching
  useEffect(() => {
    if (aiTrigger === 0) return;
    const timer = setTimeout(() => store.runAI(), 1000);
    return () => clearTimeout(timer);
  }, [aiTrigger]);

  // Reset local state on new round
  useEffect(() => {
    setChosenAttrs([]);
    setFatalityDecided(false);
  }, [battle?.currentRound?.roundNumber]);

  if (soloPhase === 'result') {
    const playerWon = winner === PLAYER_ID;
    return (
      <LinearGradient colors={[Colors.bg, '#3D1500']} style={styles.bg}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>{playerWon ? '🏆 VOCÊ VENCEU!' : '💀 IA VENCEU'}</Text>
          <Text style={styles.resultSub}>{playerWon ? 'Aldeia reconhece o talento!' : 'A IA dominou esse round!'}</Text>
          <TouchableOpacity style={styles.resultBtn} onPress={() => { store.reset(); router.replace('/lobby'); }}>
            <Text style={styles.resultBtnText}>VOLTAR AO LOBBY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.resultBtn, { backgroundColor: Colors.beatPurple }]}
            onPress={() => { store.reset(); store.startDraft(); router.replace('/solo-draft'); }}>
            <Text style={styles.resultBtnText}>JOGAR NOVAMENTE</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (!battle?.currentRound) {
    return (
      <LinearGradient colors={[Colors.bg, '#3D1500']} style={styles.bg}>
        <Text style={styles.waiting}>Carregando batalha...</Text>
      </LinearGradient>
    );
  }

  const round = battle.currentRound;
  const player = battle.players.find((p) => p.id === PLAYER_ID)!;
  const ai = battle.players.find((p) => p.id === AI_ID)!;
  const playerMC = player.hand[player.usedMCIndex];
  const aiMC = ai.hand[ai.usedMCIndex];
  const playerAttacks = round.attackerId === PLAYER_ID;
  const playerDefends = round.defenderId === PLAYER_ID;
  const attrCount = round.roundNumber === 3 ? 1 : 2;

  const availableAttrs = round.roundNumber === 3
    ? getAvailableAttrsForRound3(battle, PLAYER_ID)
    : ALL_ATTRS;

  function toggleAttr(attr: AttributeKey) {
    if (chosenAttrs.includes(attr)) {
      setChosenAttrs(chosenAttrs.filter((a) => a !== attr));
    } else if (chosenAttrs.length < attrCount) {
      setChosenAttrs([...chosenAttrs, attr]);
    }
  }

  function submitAttrs() {
    store.playerChooseAttrs(chosenAttrs);
    setChosenAttrs([]);
  }

  const isPlayerTurn =
    (playerAttacks && round.phase === 'waiting_beat') ||
    (playerAttacks && round.phase === 'attacker_choose_attrs') ||
    (playerDefends && round.phase === 'defender_choose_attrs') ||
    (round.phase === 'fatality_window' && !fatalityDecided && !awaitingAI) ||
    (playerDefends && round.phase === 'calculating' && !lastMoment) ||
    (playerAttacks && round.phase === 'calculating' && !!lastMoment);

  return (
    <LinearGradient colors={[Colors.bg, '#200800']} style={styles.bg}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.roundLabel}>ROUND {round.roundNumber}/3</Text>
        <View style={styles.scores}>
          <Text style={styles.scoreText}>Você {player.roundsWon}</Text>
          <Text style={styles.scoreSep}>✦</Text>
          <Text style={styles.scoreText}>{ai.roundsWon} IA</Text>
        </View>
        <Text style={styles.role}>{playerAttacks ? '⚔ Você ataca' : '🛡 Você defende'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Players side by side */}
        <View style={[styles.playersRow, width < 600 && styles.playersCol]}>
          {/* Player card */}
          <View style={styles.playerPanel}>
            <Text style={styles.panelTitle}>VOCÊ — {playerMC?.name}</Text>
            <View style={styles.barrasRow}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.barra, i < player.barras && styles.barraFilled]} />
              ))}
              <Text style={styles.barraLabel}> barras</Text>
            </View>
            <View style={styles.attrsGrid}>
              {ALL_ATTRS.map((attr) => (
                <View key={attr} style={[styles.attrBox, { borderColor: ATTR_COLORS[attr] + '80' }]}>
                  <Text style={[styles.attrName, { color: ATTR_COLORS[attr] }]}>{attr}</Text>
                  <Text style={styles.attrVal}>{playerMC?.attributes[attr]}</Text>
                </View>
              ))}
            </View>
            <View style={styles.archBadge}>
              <Text style={styles.archText}>{playerMC?.archetype} · Hype {'⭐'.repeat(playerMC?.hype ?? 1)}</Text>
            </View>
          </View>

          <Text style={styles.vsText}>VS</Text>

          {/* AI card */}
          <View style={[styles.playerPanel, styles.aiPanel]}>
            <Text style={[styles.panelTitle, { color: Colors.beatPurpleLight }]}>IA — {aiMC?.name}</Text>
            <View style={styles.barrasRow}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.barra, styles.barraAI, i < ai.barras && styles.barraAIFilled]} />
              ))}
              <Text style={styles.barraLabel}> barras</Text>
            </View>
            <View style={styles.attrsGrid}>
              {ALL_ATTRS.map((attr) => (
                <View key={attr} style={[styles.attrBox, { borderColor: ATTR_COLORS[attr] + '60' }]}>
                  <Text style={[styles.attrName, { color: ATTR_COLORS[attr] + 'AA' }]}>{attr}</Text>
                  <Text style={[styles.attrVal, { color: Colors.textLight }]}>{aiMC?.attributes[attr]}</Text>
                </View>
              ))}
            </View>
            <View style={styles.archBadge}>
              <Text style={[styles.archText, { color: Colors.textLight }]}>{aiMC?.archetype} · Hype {'⭐'.repeat(aiMC?.hype ?? 1)}</Text>
            </View>
          </View>
        </View>

        {/* Beat & Moment */}
        {lastBeat && (
          <View style={styles.beatCard}>
            <Text style={styles.beatLabel}>BEAT ATIVO</Text>
            <Text style={styles.beatName}>{lastBeat.name}</Text>
            <Text style={styles.beatDesc}>{lastBeat.description}</Text>
            <Text style={styles.beatEffects}>
              {lastBeat.effects.map((e) => `${e.attribute} ${e.modifier > 0 ? '+' : ''}${e.modifier}`).join(' · ')}
            </Text>
          </View>
        )}
        {lastMoment && (
          <View style={styles.momentCard}>
            <Text style={styles.momentLabel}>MOMENT</Text>
            <Text style={styles.momentName}>{lastMoment.name}</Text>
            <Text style={styles.momentDesc}>{lastMoment.description}</Text>
          </View>
        )}

        {/* Last round result */}
        {lastRoundResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultBoxTitle}>Resultado do round anterior</Text>
            <Text style={styles.resultBoxScore}>
              Ataque: {lastRoundResult.attackerScore} × Defesa: {lastRoundResult.defenderScore}
            </Text>
            {lastRoundResult.tiebreaker && (
              <Text style={styles.resultBoxTie}>Desempate: {lastRoundResult.tiebreaker}</Text>
            )}
          </View>
        )}

        {/* AI message */}
        {(aiMessage || awaitingAI) && (
          <View style={styles.aiMsgBox}>
            <Text style={styles.aiMsgText}>{awaitingAI ? '🤖 IA está pensando...' : `🤖 ${aiMessage}`}</Text>
          </View>
        )}

        {/* ── Player actions ─────────────────────────────────────── */}

        {/* Draw beat */}
        {playerAttacks && round.phase === 'waiting_beat' && (
          <TouchableOpacity style={styles.actionBtn} onPress={store.playerDrawBeat}>
            <Text style={styles.actionBtnText}>🎵 COMPRAR BEAT</Text>
            <Text style={styles.actionSub}>Você ataca — escolha o beat aleatório</Text>
          </TouchableOpacity>
        )}

        {/* Choose attrs */}
        {((playerAttacks && round.phase === 'attacker_choose_attrs') ||
          (playerDefends && round.phase === 'defender_choose_attrs')) && (
          <View style={styles.attrSection}>
            <Text style={styles.attrSectionTitle}>
              {playerAttacks ? 'ESCOLHA ' : 'RESPONDA COM '}
              {attrCount} ATRIBUTO{attrCount > 1 ? 'S' : ''}
              {round.roundNumber === 3 ? ' (não usados)' : ''}
            </Text>
            <View style={styles.attrBtnGrid}>
              {availableAttrs.map((attr) => {
                const disabled = !chosenAttrs.includes(attr) && chosenAttrs.length >= attrCount;
                return (
                  <TouchableOpacity
                    key={attr}
                    style={[
                      styles.attrSelectBtn,
                      chosenAttrs.includes(attr) && { backgroundColor: ATTR_COLORS[attr], borderColor: ATTR_COLORS[attr] },
                      disabled && styles.attrSelectDisabled,
                    ]}
                    onPress={() => toggleAttr(attr)}
                    disabled={disabled}
                  >
                    <Text style={[styles.attrSelectName, chosenAttrs.includes(attr) && { color: Colors.white }]}>{attr}</Text>
                    <Text style={[styles.attrSelectVal, chosenAttrs.includes(attr) && { color: Colors.white }]}>
                      {playerMC?.attributes[attr]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, chosenAttrs.length !== attrCount && styles.actionBtnDisabled]}
              onPress={submitAttrs}
              disabled={chosenAttrs.length !== attrCount}
            >
              <Text style={styles.actionBtnText}>CONFIRMAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Fatality window */}
        {round.phase === 'fatality_window' && !fatalityDecided && !awaitingAI && (
          <View style={styles.fatalityBox}>
            <Text style={styles.fatalityTitle}>⚡ JANELA DE FATALITY</Text>
            <Text style={styles.fatalitySub}>Suas barras: {player.barras}/3</Text>
            <View style={styles.fatalityBtns}>
              {player.barras >= 3 && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.danger }]}
                  onPress={() => { store.playerFatalityActivate(); setFatalityDecided(true); }}>
                  <Text style={styles.actionBtnText}>ATIVAR FATALITY</Text>
                  <Text style={styles.actionSub}>Gasta 3 barras · potencializa o MC</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.textLight }]}
                onPress={() => { store.playerFatalitySkip(); setFatalityDecided(true); }}>
                <Text style={styles.actionBtnText}>PASSAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Reveal moment */}
        {playerDefends && round.phase === 'calculating' && !lastMoment && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.momentGreen }]}
            onPress={store.playerRevealMoment}>
            <Text style={styles.actionBtnText}>🃏 REVELAR MOMENT</Text>
            <Text style={styles.actionSub}>Você defende — escolha o event</Text>
          </TouchableOpacity>
        )}

        {/* Calculate */}
        {playerAttacks && round.phase === 'calculating' && !!lastMoment && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]}
            onPress={store.playerCalculate}>
            <Text style={styles.actionBtnText}>⚖ CALCULAR RESULTADO</Text>
          </TouchableOpacity>
        )}

        {/* Phase hint */}
        <View style={styles.phaseHint}>
          <Text style={styles.phaseHintText}>Fase: {round.phase}</Text>
          {!isPlayerTurn && !awaitingAI && <Text style={styles.phaseHintText}>Aguardando...</Text>}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gold + '20' },
  roundLabel: { color: Colors.mcOrange, fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  scores: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  scoreText: { color: Colors.gold, fontSize: 16, fontWeight: '700' },
  scoreSep: { color: Colors.textLight },
  role: { color: Colors.white, fontSize: 13, marginTop: 4 },
  scroll: { padding: 16, paddingBottom: 40 },
  playersRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  playersCol: { flexDirection: 'column' },
  playerPanel: { flex: 1, backgroundColor: Colors.offWhite + '08', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.mcOrange + '30' },
  aiPanel: { borderColor: Colors.beatPurple + '30' },
  panelTitle: { color: Colors.mcOrange, fontSize: 13, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  barrasRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 4 },
  barra: { width: 16, height: 16, borderRadius: 3, borderWidth: 1, borderColor: Colors.mcOrange + '60' },
  barraFilled: { backgroundColor: Colors.mcOrange },
  barraAI: { borderColor: Colors.beatPurple + '60' },
  barraAIFilled: { backgroundColor: Colors.beatPurple },
  barraLabel: { color: Colors.textLight, fontSize: 11 },
  attrsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  attrBox: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, minWidth: 70, alignItems: 'center' },
  attrName: { fontSize: 10, fontWeight: '700' },
  attrVal: { color: Colors.white, fontSize: 18, fontWeight: '900' },
  archBadge: { marginTop: 4 },
  archText: { color: Colors.gold, fontSize: 11 },
  vsText: { color: Colors.gold, fontSize: 22, fontWeight: '900', alignSelf: 'center', paddingHorizontal: 8 },
  beatCard: { backgroundColor: Colors.beatPurple + '20', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.beatPurple + '50' },
  beatLabel: { color: Colors.beatPurpleLight, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  beatName: { color: Colors.white, fontSize: 16, fontWeight: '900', marginTop: 2 },
  beatDesc: { color: Colors.textLight, fontSize: 12, marginTop: 2 },
  beatEffects: { color: Colors.beatPurpleLight, fontSize: 12, marginTop: 4 },
  momentCard: { backgroundColor: Colors.momentGreen + '20', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.momentGreen + '50' },
  momentLabel: { color: Colors.momentGreenLight, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  momentName: { color: Colors.white, fontSize: 16, fontWeight: '900', marginTop: 2 },
  momentDesc: { color: Colors.textLight, fontSize: 12, marginTop: 2 },
  resultBox: { backgroundColor: Colors.gold + '15', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.gold + '40' },
  resultBoxTitle: { color: Colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  resultBoxScore: { color: Colors.white, fontSize: 14, fontWeight: '700', marginTop: 4 },
  resultBoxTie: { color: Colors.textLight, fontSize: 12, marginTop: 2 },
  aiMsgBox: { backgroundColor: Colors.offWhite + '10', borderRadius: 10, padding: 12, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: Colors.beatPurple },
  aiMsgText: { color: Colors.beatPurpleLight, fontSize: 13 },
  actionBtn: { backgroundColor: Colors.mcOrange, borderRadius: 12, padding: 16, alignItems: 'center', marginVertical: 6, gap: 4 },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: { color: Colors.white, fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  actionSub: { color: Colors.white + 'AA', fontSize: 11 },
  attrSection: { marginVertical: 8 },
  attrSectionTitle: { color: Colors.gold, fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  attrBtnGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  attrSelectBtn: { borderRadius: 10, borderWidth: 1, borderColor: Colors.gold + '50', paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', minWidth: 80, backgroundColor: Colors.offWhite + '08' },
  attrSelectDisabled: { opacity: 0.35 },
  attrSelectName: { color: Colors.textLight, fontSize: 11, fontWeight: '600' },
  attrSelectVal: { color: Colors.white, fontSize: 22, fontWeight: '900', marginTop: 2 },
  fatalityBox: { backgroundColor: Colors.danger + '15', borderRadius: 12, padding: 16, marginVertical: 8, borderWidth: 1, borderColor: Colors.danger + '40' },
  fatalityTitle: { color: Colors.danger, fontSize: 16, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  fatalitySub: { color: Colors.textLight, fontSize: 13, marginBottom: 12 },
  fatalityBtns: { gap: 8 },
  phaseHint: { marginTop: 20, alignItems: 'center' },
  phaseHintText: { color: Colors.textLight + '80', fontSize: 11 },
  waiting: { color: Colors.gold, fontSize: 18, textAlign: 'center', marginTop: 200 },
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  resultTitle: { color: Colors.mcOrange, fontSize: 36, fontWeight: '900', textAlign: 'center' },
  resultSub: { color: Colors.gold, fontSize: 16, textAlign: 'center' },
  resultBtn: { backgroundColor: Colors.mcOrange, borderRadius: 12, padding: 16, alignItems: 'center', width: '100%' },
  resultBtnText: { color: Colors.white, fontWeight: '900', fontSize: 16, letterSpacing: 2 },
});
