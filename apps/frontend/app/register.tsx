import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
  ScrollView, ImageBackground, Image, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../src/theme/colors';
import { GRAFFITI } from '../src/theme/fonts';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
const GOLD   = '#FFAA00';
const PURPLE = '#9D00FF';

const BG   = Platform.OS === 'web' ? { uri: '/bg-wall.png' }        : require('../public/bg-wall.png');
const LOGO = Platform.OS === 'web' ? { uri: '/logo-rap-battle.png' } : require('../public/logo-rap-battle.png');

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 400;

  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleRegister() {
    if (!username || !email || !password || !confirm) {
      Alert.alert('Preencha todos os campos'); return;
    }
    if (password !== confirm) {
      Alert.alert('As senhas não coincidem'); return;
    }
    if (password.length < 6) {
      Alert.alert('Senha muito curta', 'Mínimo 6 caracteres'); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { Alert.alert(data.error ?? 'Erro ao cadastrar'); return; }
      Alert.alert('Conta criada! 🔥', 'Faça login para entrar.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } catch {
      Alert.alert('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground source={BG} style={s.root} resizeMode="cover">
      <View style={s.overlay} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.kav}>
        <ScrollView
          contentContainerStyle={[s.scroll, compact && s.scrollCompact]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Logo ── */}
          <Image source={LOGO} style={[s.logo, compact && s.logoCompact]} resizeMode="contain" />

          {/* ── Título da seção ── */}
          <View style={s.titleRow}>
            <View style={s.titleLine} />
            <Text style={[s.titleTxt, compact && { fontSize: 14 }]}>CRIAR CONTA</Text>
            <View style={s.titleLine} />
          </View>

          {/* ── Card ── */}
          <View style={s.card}>
            <View style={[s.corner, s.cTL]} /><View style={[s.corner, s.cTR]} />
            <View style={[s.corner, s.cBL]} /><View style={[s.corner, s.cBR]} />

            <Field
              icon="person"
              placeholder="NOME DE USUÁRIO"
              value={username}
              onChange={setUsername}
            />
            <Div />
            <Field
              icon="mail"
              placeholder="EMAIL"
              value={email}
              onChange={setEmail}
              type="email"
            />
            <Div />
            <View style={s.field}>
              <View style={s.iconBox}>
                <Ionicons name="lock-closed" size={18} color={Colors.bg} />
              </View>
              <TextInput
                style={s.input}
                placeholder="SENHA"
                placeholderTextColor="#3A3A3A"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eye}>
                <Ionicons name={showPass ? 'eye-off' : 'eye'} size={18} color="#555" />
              </TouchableOpacity>
            </View>
            <Div />
            <Field
              icon="lock-closed"
              placeholder="CONFIRMAR SENHA"
              value={confirm}
              onChange={setConfirm}
              secure
            />

            {/* Botão */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              style={[s.btn, loading && { opacity: 0.55 }]}
              activeOpacity={0.8}
            >
              <Text style={[s.btnTxt, compact && { fontSize: 16 }]}>
                {loading ? 'CRIANDO...' : 'CRIAR CONTA'}
              </Text>
            </TouchableOpacity>

            {/* Link login */}
            <View style={s.linkRow}>
              <Text style={s.linkTxt}>Já tem conta?  </Text>
              <TouchableOpacity onPress={() => router.replace('/')}>
                <Text style={s.linkBold}>ENTRAR</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

function Field({ icon, placeholder, value, onChange, type, secure }: {
  icon: any; placeholder: string; value: string; onChange: (v: string) => void;
  type?: string; secure?: boolean;
}) {
  return (
    <View style={s.field}>
      <View style={s.iconBox}>
        <Ionicons name={icon} size={18} color={Colors.bg} />
      </View>
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor="#3A3A3A"
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        keyboardType={type === 'email' ? 'email-address' : 'default'}
        secureTextEntry={!!secure}
        underlineColorAndroid="transparent"
      />
    </View>
  );
}

function Div() { return <View style={s.div} />; }

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#080808' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.52)' },
  kav:     { flex: 1 },

  scroll: {
    alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 36, paddingBottom: 48,
    flexGrow: 1, justifyContent: 'center',
  },
  scrollCompact: { paddingTop: 20, paddingHorizontal: 14 },

  // Logo
  logo:        { width: '100%', height: 420, marginBottom: -100 },
  logoCompact: { height: 280, marginBottom: -60 },

  // Título seção
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', maxWidth: 400, marginBottom: 14 },
  titleLine: { flex: 1, height: 1.5, backgroundColor: 'rgba(255,170,0,0.3)' },
  titleTxt:  { fontFamily: GRAFFITI, color: GOLD, fontSize: 18, letterSpacing: 8 },

  // Card
  card: {
    width: '100%', maxWidth: 400,
    backgroundColor: 'rgba(8,8,8,0.85)',
    borderRadius: 4,
    borderWidth: 1, borderColor: 'rgba(255,170,0,0.2)',
    padding: 20,
    position: 'relative',
  },
  corner: { position: 'absolute', width: 16, height: 16, borderColor: GOLD },
  cTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  cTR: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
  cBL: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
  cBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },

  // Campos
  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0C0C0C',
    borderRadius: 6, overflow: 'hidden',
    borderWidth: 1, borderColor: '#262626',
  },
  iconBox: {
    width: 46, height: 46,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, color: Colors.white,
    fontFamily: GRAFFITI, fontSize: 14, letterSpacing: 2,
    paddingHorizontal: 12,
    // remove underline nativo e outline web
    ...({ underlineColorAndroid: 'transparent' } as any),
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  eye:  { paddingHorizontal: 12 },
  div:  { height: 8 },

  // Botão
  btn: {
    marginTop: 20,
    backgroundColor: GOLD,
    borderRadius: 6, paddingVertical: 13,
    alignItems: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  btnTxt: { fontFamily: GRAFFITI, color: '#0A0A0A', fontSize: 20, letterSpacing: 6 },

  // Link
  linkRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  linkTxt:  { color: Colors.muted, fontSize: 13 },
  linkBold: { fontFamily: GRAFFITI, color: PURPLE, fontSize: 16, letterSpacing: 2, textDecorationLine: 'underline' },
});
