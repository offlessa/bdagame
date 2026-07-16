import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,
  ImageBackground, Image, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useCharacterStore, DEFAULT_LOOK } from '../store/characterStore';
import { Colors } from '../theme/colors';
import { GRAFFITI } from '../theme/fonts';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
const GOLD   = '#FFAA00';
const PURPLE = '#9D00FF';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [remember,   setRemember]   = useState(true);
  const [loading,    setLoading]    = useState(false);
  const setAuth                    = useAuthStore(s => s.setAuth);
  const { loadCharacter, setCharacter } = useCharacterStore();

  async function login() {
    if (!identifier || !password) { Alert.alert('Preencha tudo'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json() as { token: string; userId: string; username: string; error?: string };
      if (!res.ok) { Alert.alert(data.error ?? 'Erro ao entrar'); return; }
      await setAuth(data.token, data.userId, data.username, remember);
      await loadCharacter(data.userId);
      const { character } = useCharacterStore.getState();
      router.replace(character ? '/menu' : '/character-creation');
    } catch { Alert.alert('Erro de conexão'); }
    finally { setLoading(false); }
  }

  async function enterAsGuest() {
    await setAuth('guest-token', 'guest', 'Visitante', false);
    await setCharacter({
      battleName: 'MC VISITANTE',
      archetype: 'MC INICIANTE',
      archetypeIcon: '⚡',
      archetypeColor: '#FFAA00',
      look: DEFAULT_LOOK,
    }, 'guest');
    router.replace('/menu');
  }

  const { width } = useWindowDimensions();
  const compact = width < 400;

  const BG   = Platform.OS === 'web'
    ? { uri: '/bg-wall.png' }
    : require('../../public/bg-wall.png');
  const LOGO = Platform.OS === 'web'
    ? { uri: '/logo-rap-battle.png' }
    : require('../../public/logo-rap-battle.png');

  return (
    <ImageBackground source={BG} style={s.root} resizeMode="cover">
      {/* overlay escuro para melhorar legibilidade */}
      <View style={s.overlay} />

      {/* ── Graffiti lateral esquerdo ── */}
      <View style={s.leftDeco} pointerEvents="none">
        <Text style={s.decoGray}>3</Text>
        <Text style={s.decoGray}>2</Text>
        <Text style={s.decoGray}>1</Text>
      </View>

      {/* ── Graffiti lateral direito ── */}
      <View style={s.rightDeco} pointerEvents="none">
        <Text style={s.decoPurple}>R</Text>
        <Text style={s.decoPurple}>A</Text>
        <Text style={s.decoPurple}>P</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.kav}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ══════════ LOGO ══════════ */}
          <Image source={LOGO} style={[s.logo, compact && s.logoCompact]} resizeMode="contain" />

          {/* ══════════ CARD ══════════ */}
          <View style={s.card}>
            {/* Cantos dourados */}
            <View style={[s.corner, s.cTL]} />
            <View style={[s.corner, s.cTR]} />
            <View style={[s.corner, s.cBL]} />
            <View style={[s.corner, s.cBR]} />

            {/* Título LOGIN */}
            <View style={s.titleRow}>
              <View style={s.titleLine} />
              <Text style={s.titleTxt}>LOGIN</Text>
              <View style={s.titleLine} />
            </View>

            {/* Campo: usuário */}
            <View style={s.field}>
              <View style={s.iconBox}>
                <Ionicons name="person" size={20} color={Colors.bg} />
              </View>
              <TextInput
                style={s.input}
                placeholder="USUÁRIO OU E-MAIL"
                placeholderTextColor="#3A3A3A"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
              />
            </View>

            {/* Campo: senha */}
            <View style={[s.field, { marginTop: 10 }]}>
              <View style={s.iconBox}>
                <Ionicons name="lock-closed" size={20} color={Colors.bg} />
              </View>
              <TextInput
                style={s.input}
                placeholder="SENHA"
                placeholderTextColor="#3A3A3A"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eye}>
                <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color="#555" />
              </TouchableOpacity>
            </View>

            {/* Lembrar + Esqueci */}
            <View style={s.optRow}>
              <TouchableOpacity onPress={() => setRemember(v => !v)} style={s.remRow}>
                <View style={[s.chk, remember && s.chkOn]}>
                  {remember && <Ionicons name="checkmark" size={11} color={Colors.bg} />}
                </View>
                <Text style={s.remTxt}>LEMBRAR DE MIM</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                <Text style={s.forgotTxt}>ESQUECI MINHA SENHA</Text>
              </TouchableOpacity>
            </View>

            {/* Botão principal */}
            <TouchableOpacity
              onPress={login}
              disabled={loading}
              style={[s.mainBtn, loading && { opacity: 0.6 }]}
              activeOpacity={0.8}
            >
              <Text style={s.mainBtnTxt}>
                {loading ? 'ENTRANDO...' : 'ENTRAR'}
              </Text>
            </TouchableOpacity>

            {/* Divisor social */}
            <View style={s.socialDiv}>
              <View style={s.socialLine} />
              <Text style={s.socialDivTxt}>OU ENTRE COM</Text>
              <View style={s.socialLine} />
            </View>

            {/* Botões sociais */}
            <View style={s.socialRow}>
              <TouchableOpacity style={s.socialBtn} onPress={() => Alert.alert('Em breve')}>
                <Text style={[s.socialLetter, { color: '#EA4335' }]}>G</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.socialBtn} onPress={() => Alert.alert('Em breve')}>
                <Text style={[s.socialLetter, { color: '#1877F2' }]}>f</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.socialBtn} onPress={() => Alert.alert('Em breve')}>
                <Ionicons name="logo-apple" size={22} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════ RODAPÉ ══════════ */}
          <View style={s.footer}>
            <Text style={s.footerTxt}>AINDA NÃO TEM CONTA?</Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={s.createTxt}>CRIAR CONTA</Text>
            </TouchableOpacity>
          </View>

          {/* ══════════ VISITANTE ══════════ */}
          <TouchableOpacity onPress={enterAsGuest} style={s.guestBtn} activeOpacity={0.7}>
            <Text style={s.guestTxt}>▶  ENTRAR SEM CONTA</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080808' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  kav:  { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 40,
    flexGrow: 1, justifyContent: 'center',
  },

  // ── Decos laterais ──
  leftDeco: {
    position: 'absolute', left: -22, top: '12%',
    opacity: 0.10, zIndex: 0,
  },
  decoGray: {
    fontFamily: GRAFFITI, fontSize: 88, color: '#AAAAAA', lineHeight: 76,
    transform: [{ rotate: '-8deg' }],
  },
  rightDeco: {
    position: 'absolute', right: -18, top: '8%',
    opacity: 0.14, zIndex: 0, alignItems: 'flex-end',
  },
  decoPurple: {
    fontFamily: GRAFFITI, fontSize: 88, color: PURPLE, lineHeight: 76,
    transform: [{ rotate: '6deg' }],
  },

  // ── Logo ──
  logo: {
    width: '100%',
    height: 420,
    marginBottom: -100,
  },
  logoCompact: {
    height: 280,
    marginBottom: -60,
  },

  // ── Card ──
  card: {
    width: '100%', maxWidth: 390,
    backgroundColor: 'rgba(8,8,8,0.82)',
    borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,170,0,0.25)',
    padding: 22, paddingTop: 26,
    position: 'relative',
    marginTop: 18,
  },
  corner: {
    position: 'absolute', width: 22, height: 22, borderColor: GOLD,
  },
  cTL: { top: -2,  left: -2,  borderTopWidth: 3,    borderLeftWidth: 3,   borderTopLeftRadius: 6 },
  cTR: { top: -2,  right: -2, borderTopWidth: 3,    borderRightWidth: 3,  borderTopRightRadius: 6 },
  cBL: { bottom: -2, left: -2,  borderBottomWidth: 3, borderLeftWidth: 3,   borderBottomLeftRadius: 6 },
  cBR: { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3,  borderBottomRightRadius: 6 },

  // Título
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  titleLine: { flex: 1, height: 1.5, backgroundColor: GOLD + '55' },
  titleTxt: { fontFamily: GRAFFITI, fontSize: 28, letterSpacing: 10, color: GOLD },

  // Campos
  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0C0C0C',
    borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: '#262626',
  },
  iconBox: {
    width: 50, height: 50,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, color: Colors.white,
    fontFamily: GRAFFITI, fontSize: 15, letterSpacing: 2,
    paddingHorizontal: 14,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  eye: { paddingHorizontal: 14 },

  // Opções
  optRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16, marginBottom: 20,
  },
  remRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chk: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 2, borderColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  chkOn: { backgroundColor: GOLD, borderColor: GOLD },
  remTxt: { fontFamily: GRAFFITI, color: Colors.white, fontSize: 14, letterSpacing: 1 },
  forgotTxt: { fontFamily: GRAFFITI, color: PURPLE, fontSize: 14, letterSpacing: 1 },

  // Botão principal
  mainBtn: {
    backgroundColor: GOLD,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 22,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  mainBtnTxt: {
    fontFamily: GRAFFITI, fontSize: 20, letterSpacing: 6,
    color: '#0A0A0A',
  },

  // Social
  socialDiv: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  socialLine: { flex: 1, height: 1, backgroundColor: '#2A2A2A' },
  socialDivTxt: { fontFamily: GRAFFITI, color: '#444', fontSize: 13, letterSpacing: 4 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  socialBtn: {
    width: 60, height: 60, borderRadius: 14,
    backgroundColor: '#1A1A1A',
    borderWidth: 1, borderColor: '#2C2C2C',
    alignItems: 'center', justifyContent: 'center',
  },
  socialLetter: { fontFamily: GRAFFITI, fontSize: 28 },

  // Footer
  footer: { alignItems: 'center', marginTop: 22, gap: 4 },
  footerTxt: { fontFamily: GRAFFITI, color: '#666', fontSize: 14, letterSpacing: 3 },
  createTxt: {
    fontFamily: GRAFFITI, color: PURPLE,
    fontSize: 20, letterSpacing: 4,
    textDecorationLine: 'underline',
  },

  guestBtn: {
    marginTop: 18, paddingVertical: 10, paddingHorizontal: 24,
    borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  guestTxt: {
    fontFamily: GRAFFITI, color: '#444', fontSize: 14, letterSpacing: 3,
  },
});
