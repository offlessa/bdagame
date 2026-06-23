import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useCharacterStore, DEFAULT_LOOK } from '../src/store/characterStore';
import { Colors } from '../src/theme/colors';
import { GRAFFITI } from '../src/theme/fonts';
import WallBg from '../src/components/WallBg';

const ARCHETYPES = [
  { id: 'lyricista',    name: 'Lyricista',    icon: '🎵', desc: 'Mestre das rimas',        color: Colors.purple },
  { id: 'improvisador', name: 'Improvisador', icon: '⚡', desc: 'Velocidade e improviso',   color: Colors.orange },
  { id: 'conhecimento', name: 'Conhecimento', icon: '🧠', desc: 'Cultura e profundidade',   color: Colors.inteligencia },
  { id: 'tecnico',      name: 'Técnico',      icon: '🎯', desc: 'Precisão e flow perfeito', color: Colors.flow },
  { id: 'veterano',     name: 'Veterano',     icon: '👑', desc: 'Experiência e autoridade', color: Colors.gold },
  { id: 'freestyle',    name: 'Freestyle',    icon: '🌊', desc: 'Fluidez e adaptação',      color: Colors.neon },
];

export default function CharacterCreationScreen() {
  const { userId } = useAuthStore();
  const { character, setCharacter } = useCharacterStore();
  const isEditing = !!character;

  const [battleName, setBattleName] = useState(character?.battleName ?? '');
  const [selectedId, setSelectedId] = useState(
    character ? (ARCHETYPES.find(a => a.name === character.archetype)?.id ?? '') : ''
  );

  async function handleConfirm() {
    if (!battleName.trim()) { Alert.alert('Escolha um nome de batalha'); return; }
    if (!selectedId) { Alert.alert('Escolha seu estilo'); return; }
    const arch = ARCHETYPES.find(a => a.id === selectedId)!;
    await setCharacter(
      {
        battleName: battleName.trim(),
        archetype: arch.name,
        archetypeIcon: arch.icon,
        archetypeColor: arch.color,
        look: character?.look ?? DEFAULT_LOOK,
      },
      userId!,
    );
    router.replace('/menu');
  }

  return (
    <View style={s.bg}>
      <WallBg intensity="medium" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.brand}>RAP<Text style={s.brandW}> BATTLE</Text></Text>
          {isEditing && (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={22} color={Colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={s.title}>CRIE SEU MC</Text>
        <Text style={s.sub}>Defina seu estilo antes de entrar na batalha</Text>

        {/* Name */}
        <View style={s.section}>
          <Text style={s.label}>🎤 NOME DE BATALHA</Text>
          <View style={s.inputCard}>
            <TextInput
              style={s.input}
              placeholder="Como te chamam no palco?"
              placeholderTextColor={Colors.muted}
              value={battleName}
              onChangeText={setBattleName}
              maxLength={20}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Archetypes */}
        <View style={s.section}>
          <Text style={s.label}>⚔️ SEU ESTILO</Text>
          <View style={s.grid}>
            {ARCHETYPES.map(arch => {
              const sel = selectedId === arch.id;
              return (
                <TouchableOpacity
                  key={arch.id}
                  style={[s.card, { borderColor: sel ? arch.color : Colors.border }, sel && { backgroundColor: arch.color + '15' }]}
                  onPress={() => setSelectedId(arch.id)}
                  activeOpacity={0.7}
                >
                  {sel && <View style={[s.dot, { backgroundColor: arch.color }]} />}
                  <Text style={s.cardIcon}>{arch.icon}</Text>
                  <Text style={[s.cardName, { color: sel ? arch.color : Colors.white }]}>{arch.name}</Text>
                  <Text style={s.cardDesc}>{arch.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity onPress={handleConfirm} activeOpacity={0.85} style={s.btn}>
          <Text style={s.btnTxt}>{isEditing ? 'SALVAR' : 'ENTRAR NA BATALHA'}</Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity onPress={() => router.back()} style={s.cancel}>
            <Text style={s.cancelTxt}>Cancelar</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 52, paddingBottom: 48, alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', maxWidth: 400, marginBottom: 32,
  },
  brand: { fontFamily: GRAFFITI, fontSize: 28, color: Colors.primary, letterSpacing: 4 },
  brandW: { color: Colors.white },

  title: { fontFamily: GRAFFITI, color: Colors.white, fontSize: 38, letterSpacing: 6, textAlign: 'center' },
  sub: { color: Colors.muted, fontSize: 12, marginTop: 6, marginBottom: 32, textAlign: 'center', letterSpacing: 1 },

  section: { width: '100%', maxWidth: 400, marginBottom: 24 },
  label: { fontFamily: GRAFFITI, color: Colors.primary, fontSize: 18, letterSpacing: 4, marginBottom: 10 },

  inputCard: {
    backgroundColor: Colors.card, borderRadius: 4,
    borderWidth: 1.5, borderColor: Colors.primary + '35',
    paddingHorizontal: 16, paddingVertical: 4,
  },
  input: {
    color: Colors.white, fontSize: 15, paddingVertical: 10,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47.5%', backgroundColor: Colors.card,
    borderRadius: 4, borderWidth: 1.5,
    padding: 14, alignItems: 'center', gap: 4,
    position: 'relative',
  },
  dot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  cardIcon: { fontSize: 26, marginBottom: 2 },
  cardName: { fontFamily: GRAFFITI, fontSize: 18, letterSpacing: 2 },
  cardDesc: { fontSize: 10, color: Colors.muted, textAlign: 'center', lineHeight: 14 },

  btn: {
    width: '100%', maxWidth: 400,
    backgroundColor: Colors.primary, borderRadius: 3,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
  },
  btnTxt: { fontFamily: GRAFFITI, color: Colors.bg, fontSize: 24, letterSpacing: 6 },

  cancel: { marginTop: 16 },
  cancelTxt: { color: Colors.muted, fontSize: 13 },
});
