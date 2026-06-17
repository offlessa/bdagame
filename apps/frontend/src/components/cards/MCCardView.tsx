import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MCCard, AttributeKey } from '@batalha/game-engine';
import { Colors } from '../../theme/colors';

const ATTR_LABELS: Record<AttributeKey, string> = {
  flow: 'Flow', tecnica: 'Técnica', frieza: 'Frieza',
  inteligencia: 'Inteligência', presenca: 'Presença', punchline: 'Punchline',
};

const ATTR_COLORS: Record<AttributeKey, string> = {
  flow: Colors.flow, tecnica: Colors.tecnica, frieza: Colors.frieza,
  inteligencia: Colors.inteligencia, presenca: Colors.presenca, punchline: Colors.punchline,
};

interface Props {
  mc: MCCard;
  selected?: boolean;
  faceDown?: boolean;
  onPress?: () => void;
  highlightAttrs?: AttributeKey[];
}

export function MCCardView({ mc, selected, faceDown, onPress, highlightAttrs = [] }: Props) {
  if (faceDown) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.card}>
        <LinearGradient colors={[Colors.mcOrange, '#7A2E00']} style={styles.faceDown}>
          <Text style={styles.faceDownText}>MC</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, selected && styles.selected]}>
      <LinearGradient colors={[Colors.offWhite, '#E8D9B5']} style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{mc.name.toUpperCase()}</Text>
          <Text style={styles.archetype}>{mc.archetype}</Text>
        </View>

        {/* Hype stars */}
        <Text style={styles.hype}>{'★'.repeat(mc.hype)}{'☆'.repeat(3 - mc.hype)}</Text>

        {/* State */}
        <Text style={styles.state}>{mc.country} · {mc.state}</Text>

        {/* Image placeholder */}
        {mc.imageUrl ? (
          <Image source={{ uri: mc.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}

        {/* Attributes */}
        <View style={styles.attrs}>
          {(Object.keys(ATTR_LABELS) as AttributeKey[]).map((key) => (
            <View key={key} style={[styles.attrRow, highlightAttrs.includes(key) && styles.attrHighlight]}>
              <Text style={[styles.attrLabel, { color: ATTR_COLORS[key] }]}>{ATTR_LABELS[key]}</Text>
              <Text style={styles.attrValue}>{mc.attributes[key]}</Text>
            </View>
          ))}
        </View>

        {/* Fatality */}
        <View style={styles.fatality}>
          <Text style={styles.fatalityTitle}>Fatality</Text>
          <Text style={styles.fatalityText} numberOfLines={3}>
            {mc.fatality.triggers.map((t) => triggerText(t)).join(' ')}
          </Text>
          <Text style={styles.fatalityCost}>Custo: {mc.fatality.cost} barras</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function triggerText(trigger: MCCard['fatality']['triggers'][0]): string {
  switch (trigger.type) {
    case 'attacking': return `Atacando: +${Object.values(trigger.boost)[0]} em ${Object.keys(trigger.boost)[0]}.`;
    case 'defending': return `Defendendo: +${Object.values(trigger.boost)[0]} em ${Object.keys(trigger.boost)[0]}.`;
    case 'responding': return `Respondendo: +${Object.values(trigger.boost)[0]} em ${Object.keys(trigger.boost)[0]}.`;
    case 'flat': return Object.entries(trigger.boost).map(([k, v]) => `+${v} em ${k}`).join(', ') + '.';
    default: return '';
  }
}

const styles = StyleSheet.create({
  card: { width: 180, borderRadius: 12, overflow: 'hidden', margin: 6, elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6 },
  selected: { borderWidth: 3, borderColor: Colors.gold },
  faceDown: { height: 260, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  faceDownText: { color: Colors.white, fontSize: 28, fontWeight: 'bold' },
  inner: { padding: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 13, fontWeight: 'bold', color: Colors.text, letterSpacing: 1 },
  archetype: { fontSize: 9, color: Colors.mcOrange, fontWeight: '700' },
  hype: { color: Colors.gold, fontSize: 14, marginTop: 2 },
  state: { fontSize: 10, color: Colors.textLight, marginBottom: 4 },
  image: { width: '100%', height: 120, borderRadius: 8, marginVertical: 4 },
  imagePlaceholder: { width: '100%', height: 100, borderRadius: 8, backgroundColor: '#D4C4A0', marginVertical: 4 },
  attrs: { marginTop: 4 },
  attrRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1 },
  attrHighlight: { backgroundColor: Colors.goldLight + '40', borderRadius: 4 },
  attrLabel: { fontSize: 11, fontWeight: '600' },
  attrValue: { fontSize: 11, fontWeight: 'bold', color: Colors.text },
  fatality: { marginTop: 6, borderTopWidth: 1, borderTopColor: Colors.gold + '60', paddingTop: 4 },
  fatalityTitle: { fontSize: 11, fontWeight: 'bold', color: Colors.text, marginBottom: 2 },
  fatalityText: { fontSize: 9, color: Colors.textLight },
  fatalityCost: { fontSize: 9, color: Colors.danger, marginTop: 2 },
});
