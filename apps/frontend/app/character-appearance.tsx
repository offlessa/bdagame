import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useCharacterStore, CharacterLook, DEFAULT_LOOK } from '../src/store/characterStore';
import { Colors } from '../src/theme/colors';

// ─── Dados de customização ────────────────────────────────────────────────────

const EXPRESSIONS = [
  { id: 'confiante',  label: 'Confiante',  icon: '😊' },
  { id: 'desafiador', label: 'Desafiador', icon: '😤' },
  { id: 'focado',     label: 'Focado',     icon: '😐' },
  { id: 'rindo',      label: 'Rindo',      icon: '😄' },
  { id: 'surpreso',   label: 'Surpreso',   icon: '😮' },
];

const HATS = [
  { id: 'bone-preto',    label: 'Boné Preto',    icon: '🧢', color: '#111111' },
  { id: 'bone-ouro',     label: 'Boné Ouro',     icon: '🧢', color: '#C9A84C' },
  { id: 'bone-azul',     label: 'Boné Azul',     icon: '🧢', color: '#1565C0' },
  { id: 'bone-vermelho', label: 'Boné Vermelho',  icon: '🧢', color: '#C62828' },
  { id: 'bandana',       label: 'Bandana',        icon: '🎀', color: '#C62828' },
  { id: 'touca',         label: 'Touca',          icon: '🎩', color: '#333333' },
  { id: 'sem',           label: 'Sem chapéu',     icon: '—',  color: 'transparent' },
];

const HOODIES = [
  { id: 'preto',    label: 'Preto',    color: '#111111' },
  { id: 'cinza',    label: 'Cinza',    color: '#555555' },
  { id: 'azul',     label: 'Azul',     color: '#1565C0' },
  { id: 'vermelho', label: 'Vermelho', color: '#B71C1C' },
  { id: 'verde',    label: 'Verde',    color: '#2E7D32' },
  { id: 'laranja',  label: 'Laranja',  color: '#E85E00' },
  { id: 'roxo',     label: 'Roxo',     color: '#5B2D8E' },
  { id: 'branco',   label: 'Branco',   color: '#d8d8d8' },
];

const PANTS = [
  { id: 'cargo-verde', label: 'Cargo Verde', color: '#4a5240' },
  { id: 'jeans',       label: 'Jeans',       color: '#1e3a6e' },
  { id: 'cargo-preto', label: 'Cargo Preto', color: '#111111' },
  { id: 'camuflado',   label: 'Camuflado',   color: '#3d4a2e' },
  { id: 'branco',      label: 'Branco',      color: '#d0d0d0' },
  { id: 'vinho',       label: 'Vinho',       color: '#6a1428' },
];

const SHOES = [
  { id: 'tenis',   label: 'Tênis',   icon: '👟' },
  { id: 'bota',    label: 'Bota',    icon: '👢' },
  { id: 'casual',  label: 'Casual',  icon: '👞' },
  { id: 'chinelo', label: 'Chinelo', icon: '🩴' },
];

const ACCESSORIES = [
  { id: 'corrente',  label: 'Corrente',  icon: '⛓️' },
  { id: 'relogio',   label: 'Relógio',   icon: '⌚' },
  { id: 'oculos',    label: 'Óculos',    icon: '🕶️' },
  { id: 'microfone', label: 'Microfone', icon: '🎤' },
  { id: 'sem',       label: 'Nenhum',    icon: '—' },
];

type Category = 'expressao' | 'bone' | 'roupa' | 'calca' | 'tenis' | 'acessorio';

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'expressao', label: 'Expressão', icon: '😊' },
  { id: 'bone',      label: 'Boné',      icon: '🧢' },
  { id: 'roupa',     label: 'Roupa',     icon: '👕' },
  { id: 'calca',     label: 'Calça',     icon: '👖' },
  { id: 'tenis',     label: 'Tênis',     icon: '👟' },
  { id: 'acessorio', label: 'Acessório', icon: '⛓️' },
];

// ─── Preview do personagem ────────────────────────────────────────────────────

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function CharacterAppearanceScreen() {
  const { userId } = useAuthStore();
  const { character, updateLook } = useCharacterStore();

  const [look, setLook] = useState<CharacterLook>(character?.look ?? DEFAULT_LOOK);
  const [category, setCategory] = useState<Category>('expressao');

  function select(field: keyof CharacterLook, value: string) {
    setLook(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    await updateLook(look, userId!);
    router.back();
  }

  const categoryItems = {
    expressao: EXPRESSIONS.map(e => ({ id: e.id, label: e.label, icon: e.icon })),
    bone:      HATS.map(h => ({ id: h.id, label: h.label, icon: h.icon, color: h.color })),
    roupa:     HOODIES.map(h => ({ id: h.id, label: h.label, color: h.color })),
    calca:     PANTS.map(p => ({ id: p.id, label: p.label, color: p.color })),
    tenis:     SHOES.map(s => ({ id: s.id, label: s.label, icon: s.icon })),
    acessorio: ACCESSORIES.map(a => ({ id: a.id, label: a.label, icon: a.icon })),
  };

  const fieldMap: Record<Category, keyof CharacterLook> = {
    expressao: 'expression',
    bone:      'hat',
    roupa:     'hoodie',
    calca:     'pants',
    tenis:     'shoes',
    acessorio: 'accessory',
  };

  const currentValue = look[fieldMap[category]];
  const isColor = category === 'roupa' || category === 'calca';

  return (
    <LinearGradient colors={['#1F0A00', '#1A0A00', '#0D0400']} style={styles.bg}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.gold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PERSONAGEM</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>SALVAR</Text>
        </TouchableOpacity>
      </View>

      {/* Preview */}
      <View style={styles.previewArea}>
        <LinearGradient
          colors={['#2A1000', '#1A0A00']}
          style={styles.previewCard}
        >
          {/* Decoração de fundo */}
          <View style={[styles.previewGlow, { backgroundColor: (character?.archetypeColor ?? Colors.gold) + '18' }]} />

          <Image
            source={{ uri: '/character-base.jpg' }}
            style={{ width: 160, height: 220 }}
            resizeMode="contain"
          />

          <View style={styles.previewInfo}>
            <Text style={styles.previewName}>{character?.battleName ?? 'MC'}</Text>
            <Text style={[styles.previewArch, { color: character?.archetypeColor ?? Colors.gold }]}>
              {character?.archetype ?? ''}
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.tab, category === cat.id && styles.tabActive]}
            onPress={() => setCategory(cat.id)}
          >
            <Text style={styles.tabIcon}>{cat.icon}</Text>
            <Text style={[styles.tabLabel, category === cat.id && styles.tabLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items */}
      <ScrollView contentContainerStyle={styles.itemsGrid} showsVerticalScrollIndicator={false}>
        {categoryItems[category].map((item) => {
          const selected = item.id === currentValue;
          if (isColor && 'color' in item) {
            // Color swatch
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.colorItem, selected && styles.colorItemSelected]}
                onPress={() => select(fieldMap[category], item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.colorSwatch, { backgroundColor: item.color as string }]}>
                  {selected && <Ionicons name="checkmark" size={18} color="#fff" />}
                </View>
                <Text style={[styles.itemLabel, selected && styles.itemLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }
          // Emoji item
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.emojiItem, selected && styles.emojiItemSelected]}
              onPress={() => select(fieldMap[category], item.id)}
              activeOpacity={0.7}
            >
              {'color' in item && item.color !== 'transparent' && (
                <View style={[styles.emojiColorDot, { backgroundColor: item.color as string }]} />
              )}
              <Text style={styles.emojiIcon}>{'icon' in item ? item.icon as string : ''}</Text>
              <Text style={[styles.itemLabel, selected && styles.itemLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

    </LinearGradient>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bg: { flex: 1 },

  header: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.gold + '20',
  },
  backBtn: { padding: 4 },
  headerTitle: { color: Colors.white, fontWeight: '900', fontSize: 14, letterSpacing: 3 },
  saveBtn: {
    backgroundColor: Colors.mcOrange, borderRadius: 7,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  saveBtnText: { color: Colors.white, fontWeight: '900', fontSize: 12, letterSpacing: 2 },

  // Preview
  previewArea: { alignItems: 'center', paddingVertical: 16 },
  previewCard: {
    width: 200, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.gold + '30',
    paddingTop: 14, paddingBottom: 14, alignItems: 'center',
    overflow: 'hidden',
  },
  previewGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  previewInfo: { alignItems: 'center', marginTop: 12 },
  previewName: { color: Colors.white, fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  previewArch: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 2 },

  // Tabs
  tabsScroll: { maxHeight: 60, flexGrow: 0 },
  tabsContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.gold + '25',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tabActive: { backgroundColor: Colors.mcOrange + '20', borderColor: Colors.mcOrange + '70' },
  tabIcon: { fontSize: 14 },
  tabLabel: { color: Colors.textLight, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.mcOrange, fontWeight: '900' },

  // Items grid
  itemsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 10,
  },

  // Color item
  colorItem: {
    alignItems: 'center', gap: 6, padding: 6,
    borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent',
    width: '22%',
  },
  colorItemSelected: { borderColor: Colors.mcOrange },
  colorSwatch: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },

  // Emoji item
  emojiItem: {
    alignItems: 'center', gap: 4, padding: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.gold + '20',
    backgroundColor: 'rgba(255,255,255,0.04)',
    width: '22%', position: 'relative',
  },
  emojiItemSelected: { borderColor: Colors.mcOrange, backgroundColor: Colors.mcOrange + '12' },
  emojiColorDot: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4,
  },
  emojiIcon: { fontSize: 28 },

  // Shared label
  itemLabel: { color: Colors.textLight, fontSize: 10, textAlign: 'center' },
  itemLabelActive: { color: Colors.mcOrange, fontWeight: '700' },
});
