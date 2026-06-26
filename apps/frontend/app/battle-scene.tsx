import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useCharacterStore } from '../src/store/characterStore';
import { sendToUnity, parseUnityMessage, UnityToRNMessage } from '../src/modules/UnityBattle';

// UnityView só existe após instalar @azesmway/react-native-unity
// e rodar expo prebuild. Em dev web mostra placeholder.
let UnityView: any = null;
try {
  UnityView = require('@azesmway/react-native-unity').default;
} catch {
  // pacote não instalado ainda
}

export default function BattleScene() {
  const { track = 'default', difficulty = 'medium', opponentName = 'Rival' } =
    useLocalSearchParams<{ track: string; difficulty: string; opponentName: string }>();

  const unityRef = useRef<any>(null);
  const { userId } = useAuthStore();
  const { character } = useCharacterStore();

  const handleUnityReady = useCallback(() => {
    if (!character) return;
    sendToUnity(unityRef, {
      type: 'START_BATTLE',
      payload: {
        playerLook: character.look,
        playerName: character.battleName,
        opponentName,
        track,
        difficulty: difficulty as any,
      },
    });
  }, [character, track, difficulty, opponentName]);

  const handleUnityMessage = useCallback((event: any) => {
    const msg = parseUnityMessage(event.nativeEvent?.message ?? event);
    if (!msg) return;
    onUnityMessage(msg);
  }, []);

  function onUnityMessage(msg: UnityToRNMessage) {
    switch (msg.type) {
      case 'READY':
        handleUnityReady();
        break;

      case 'BATTLE_RESULT':
        router.replace({
          pathname: '/battle-result',
          params: {
            winner: msg.payload.winner,
            scoreFlow: String(msg.payload.scores.flow),
            scorePunchline: String(msg.payload.scores.punchline),
            scorePresenca: String(msg.payload.scores.presenca),
            crowd: String(msg.payload.crowd),
            combo: String(msg.payload.combo),
          },
        });
        break;

      case 'PLAYER_QUIT':
        router.back();
        break;
    }
  }

  function handleQuit() {
    Alert.alert('Sair da batalha?', '', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          sendToUnity(unityRef, { type: 'QUIT' });
          router.back();
        },
      },
    ]);
  }

  // Placeholder em dev / web
  if (!UnityView || Platform.OS === 'web') {
    return (
      <View style={s.placeholder}>
        <Text style={s.placeholderText}>⚡ BATTLE SCENE</Text>
        <Text style={s.placeholderSub}>Unity não instalado ainda</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backTxt}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <UnityView
        ref={unityRef}
        style={StyleSheet.absoluteFill}
        onUnityMessage={handleUnityMessage}
      />
      <TouchableOpacity style={s.quitBtn} onPress={handleQuit}>
        <Text style={s.quitTxt}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  quitBtn: {
    position: 'absolute', top: 48, right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  quitTxt: { color: '#fff', fontSize: 16 },

  placeholder: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', gap: 12 },
  placeholderText: { color: '#FFAA00', fontSize: 32, fontWeight: 'bold' },
  placeholderSub: { color: '#555', fontSize: 14 },
  backBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#222', borderRadius: 8 },
  backTxt: { color: '#fff' },
});
