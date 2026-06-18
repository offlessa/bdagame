import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useCharacterStore, DEFAULT_LOOK } from '../src/store/characterStore';
import { Colors } from '../src/theme/colors';

const ARCHETYPES = [
  { id: 'lyricista',     name: 'Lyricista',     icon: '🎵', desc: 'Mestre das rimas',       color: Colors.beatPurple },
  { id: 'improvisador',  name: 'Improvisador',  icon: '⚡', desc: 'Velocidade e improviso',  color: Colors.mcOrange },
  { id: 'conhecimento',  name: 'Conhecimento',  icon: '🧠', desc: 'Cultura e profundidade',  color: Colors.inteligencia },
  { id: 'tecnico',       name: 'Técnico',       icon: '🎯', desc: 'Precisão e flow',         color: Colors.flow },
  { id: 'veterano',      name: 'Veterano',      icon: '👑', desc: 'Experiência e autoridade',color: Colors.gold },
  { id: 'freestyle',     name: 'Freestyle',     icon: '🌊', desc: 'Fluidez e adaptação',     color: Colors.frieza },
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
    <LinearGradient colors={['#2A0E00', '#1A0A00', '#0D0400']} locations={[0, 0.5, 1]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoRow}>
          <Ionicons name="leaf" size={18} color={Colors.mcOrange} />
          <Text style={styles.logoText}>BATALHA DA ALDEIA</Text>
        </View>

        <Text style={styles.title}>{isEditing ? 'EDITAR PERSONAGEM' : 'CRIE SEU PERSONAGEM'}</Text>
        <Text style={styles.subtitle}>Defina seu estilo antes de entrar na Aldeia</Text>

        {/* Battle name */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>NOME DE BATALHA</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mic-outline" size={15} color={Colors.gold} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              placeholder="Como te chamam no palco?"
              placeholderTextColor={Colors.textLight}
              value={battleName}
              onChangeText={setBattleName}
              maxLength={20}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Archetype grid */}
        <Text style={styles.fieldLabel}>SEU ESTILO</Text>
        <View style={styles.grid}>
          {ARCHETYPES.map((arch) => {
            const selected = selectedId === arch.id;
            return (
              <TouchableOpacity
                key={arch.id}
                style={[
                  styles.archetypeCard,
                  { borderColor: selected ? arch.color : arch.color + '30' },
                  selected && { backgroundColor: arch.color + '18' },
                ]}
                onPress={() => setSelectedId(arch.id)}
                activeOpacity={0.7}
              >
                {selected && <View style={[styles.selectedDot, { backgroundColor: arch.color }]} />}
                <Text style={styles.archetypeIcon}>{arch.icon}</Text>
                <Text style={[styles.archetypeName, { color: selected ? arch.color : Colors.white }]}>
                  {arch.name}
                </Text>
                <Text style={styles.archetypeDesc}>{arch.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA */}
        <TouchableOpacity onPress={handleConfirm} activeOpacity={0.8} style={styles.btnOuter}>
          <LinearGradient
            colors={[Colors.mcOrangeLight, Colors.mcOrange]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>
              {isEditing ? 'SALVAR ALTERAÇÕES' : 'ENTRAR NA ALDEIA'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelRow}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    alignItems: 'center',
  },

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  logoText: { color: Colors.mcOrange, fontWeight: '900', fontSize: 12, letterSpacing: 3 },

  title: { fontSize: 22, fontWeight: '900', color: Colors.white, letterSpacing: 3, textAlign: 'center' },
  subtitle: { fontSize: 13, color: Colors.textLight, marginTop: 6, marginBottom: 28, textAlign: 'center' },

  card: {
    width: '100%', maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, borderWidth: 1, borderColor: Colors.gold + '30',
    paddingHorizontal: 18, paddingVertical: 14, marginBottom: 28,
  },
  fieldLabel: {
    color: Colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 3,
    marginBottom: 10, alignSelf: 'flex-start', width: '100%', maxWidth: 400,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1, color: Colors.white, fontSize: 15, paddingVertical: 4,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    width: '100%', maxWidth: 400, marginBottom: 28,
  },
  archetypeCard: {
    width: '47%', borderRadius: 12, borderWidth: 1.5,
    padding: 14, alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    position: 'relative',
  },
  selectedDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
  },
  archetypeIcon: { fontSize: 28, marginBottom: 2 },
  archetypeName: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  archetypeDesc: { fontSize: 11, color: Colors.textLight, textAlign: 'center' },

  btnOuter: { width: '100%', maxWidth: 400, borderRadius: 10, overflow: 'hidden' },
  btn: { paddingVertical: 14, alignItems: 'center' },
  btnText: { color: Colors.white, fontWeight: '900', fontSize: 15, letterSpacing: 3 },

  cancelRow: { marginTop: 16 },
  cancelText: { color: Colors.textLight, fontSize: 13 },
});
