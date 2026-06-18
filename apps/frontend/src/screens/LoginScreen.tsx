import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useCharacterStore } from '../store/characterStore';
import { Colors } from '../theme/colors';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const { loadCharacter } = useCharacterStore();

  async function login() {
    if (!identifier || !password) { Alert.alert('Preencha todos os campos'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json() as { token: string; userId: string; username: string; error?: string };
      if (!res.ok) { Alert.alert(data.error ?? 'Erro ao entrar'); return; }
      await setAuth(data.token, data.userId, data.username, rememberMe);
      await loadCharacter(data.userId);
      const { character } = useCharacterStore.getState();
      router.replace(character ? '/menu' : '/character-creation');
    } catch {
      Alert.alert('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#2A0E00', '#1A0A00', '#0D0400']} locations={[0, 0.5, 1]} style={styles.bg}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>

        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.leafRow}>
            <Ionicons name="leaf" size={22} color={Colors.gold + 'A0'} style={{ transform: [{ rotate: '-40deg' }] }} />
            <Ionicons name="leaf" size={32} color={Colors.gold + 'C0'} style={{ transform: [{ rotate: '-20deg' }] }} />
            <Ionicons name="leaf" size={48} color={Colors.mcOrange} />
            <Ionicons name="leaf" size={32} color={Colors.gold + 'C0'} style={{ transform: [{ rotate: '20deg' }, { scaleX: -1 }] }} />
            <Ionicons name="leaf" size={22} color={Colors.gold + 'A0'} style={{ transform: [{ rotate: '40deg' }, { scaleX: -1 }] }} />
          </View>
          <Text style={styles.titleOrange}>BATALHA DA</Text>
          <Text style={styles.titleWhite}>ALDEIA</Text>
          <View style={styles.subtitleRow}>
            <View style={styles.subtitleLine} />
            <Text style={styles.subtitle}>CARD GAME</Text>
            <View style={styles.subtitleLine} />
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Identifier */}
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={15} color={Colors.gold} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email ou usuário"
              placeholderTextColor={Colors.textLight}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.sep} />

          {/* Password */}
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={15} color={Colors.gold} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={Colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={Colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Remember me + Forgot password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity onPress={() => setRememberMe((v) => !v)} style={styles.rememberRow}>
              <Ionicons
                name={rememberMe ? 'checkbox' : 'square-outline'}
                size={16}
                color={rememberMe ? Colors.mcOrange : Colors.textLight}
              />
              <Text style={styles.rememberText}>Lembrar de mim</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/forgot-password')}>
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </View>

          {/* Button */}
          <TouchableOpacity
            onPress={login}
            disabled={loading}
            activeOpacity={0.8}
            style={[styles.btnOuter, loading && { opacity: 0.55 }]}
          >
            <LinearGradient colors={[Colors.mcOrangeLight, Colors.mcOrange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
              <Text style={styles.btnText}>{loading ? 'Entrando...' : 'ENTRAR'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkRow}>
            <Text style={styles.linkText}>Não tem conta? </Text>
            <Text style={styles.linkBold}>Cadastrar</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 28 },
  leafRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, gap: 2 },
  titleOrange: { fontSize: 28, fontWeight: '900', color: Colors.mcOrange, letterSpacing: 5, lineHeight: 32 },
  titleWhite: { fontSize: 42, fontWeight: '900', color: Colors.white, letterSpacing: 10, lineHeight: 46 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  subtitleLine: { flex: 1, maxWidth: 40, height: 1, backgroundColor: Colors.gold + '60' },
  subtitle: { fontSize: 10, color: Colors.gold, letterSpacing: 5 },

  // Card
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gold + '35',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  icon: { marginRight: 10, width: 18 },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
    paddingVertical: 6,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  sep: { height: 1, backgroundColor: Colors.gold + '25', marginVertical: 2 },

  // Options row
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rememberText: { color: Colors.textLight, fontSize: 12 },
  forgotText: { color: Colors.gold, fontSize: 12 },

  // Button
  btnOuter: { marginTop: 18, borderRadius: 9, overflow: 'hidden' },
  btn: { paddingVertical: 12, alignItems: 'center' },
  btnText: { color: Colors.white, fontWeight: '900', fontSize: 15, letterSpacing: 3 },

  // Link
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  linkText: { color: Colors.textLight, fontSize: 13 },
  linkBold: { color: Colors.gold, fontSize: 13, fontWeight: '700' },
});
