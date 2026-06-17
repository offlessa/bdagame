import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSoloStore } from '../store/soloStore';
import { MCCardView } from '../components/cards/MCCardView';
import { Colors } from '../theme/colors';

export default function SoloDraftScreen() {
  const { selectedMCIds, toggleMC, confirmDraft } = useSoloStore();
  const { availableMCs } = useMCs();

  function confirm() {
    if (selectedMCIds.length !== 3) return;
    confirmDraft();
    router.replace('/solo-battle');
  }

  return (
    <LinearGradient colors={[Colors.bg, '#3D1500']} style={styles.bg}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ESCOLHA SEU TIME</Text>
        <Text style={styles.sub}>Selecione 3 MCs · A ordem importa</Text>
      </View>

      {selectedMCIds.length > 0 && (
        <View style={styles.selectedBar}>
          <Text style={styles.selectedLabel}>Selecionados ({selectedMCIds.length}/3):</Text>
          <View style={styles.selectedList}>
            {selectedMCIds.map((id, i) => {
              const mc = availableMCs.find((m) => m.id === id);
              return (
                <TouchableOpacity key={id} onPress={() => toggleMC(id)} style={styles.chip}>
                  <Text style={styles.chipText}>{i + 1}. {mc?.name}</Text>
                  <Text style={styles.chipRemove}>✕</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.grid}>
        {availableMCs.map((mc) => (
          <MCCardView
            key={mc.id}
            mc={mc}
            selected={selectedMCIds.includes(mc.id)}
            onPress={() => toggleMC(mc.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, selectedMCIds.length !== 3 && styles.confirmBtnDisabled]}
          onPress={confirm}
          disabled={selectedMCIds.length !== 3}
        >
          <Text style={styles.confirmText}>
            {selectedMCIds.length !== 3 ? `${selectedMCIds.length}/3 MCs selecionados` : 'CONFIRMAR TIME — JOGAR'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function useMCs() {
  const { MC_CARDS } = require('@batalha/game-engine');
  return { availableMCs: MC_CARDS as import('@batalha/game-engine').MCCard[] };
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: { padding: 16, paddingTop: 50, alignItems: 'center' },
  back: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: Colors.gold, fontSize: 14 },
  title: { color: Colors.mcOrange, fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  sub: { color: Colors.gold, fontSize: 12, marginTop: 4 },
  selectedBar: { backgroundColor: Colors.offWhite + '10', padding: 12, marginHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  selectedLabel: { color: Colors.gold, fontSize: 11, marginBottom: 6 },
  selectedList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.mcOrange + '30', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, gap: 6 },
  chipText: { color: Colors.white, fontSize: 12 },
  chipRemove: { color: Colors.mcOrange, fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 8 },
  footer: { padding: 16 },
  confirmBtn: { backgroundColor: Colors.mcOrange, borderRadius: 12, padding: 16, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: Colors.textLight, opacity: 0.5 },
  confirmText: { color: Colors.white, fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});
