import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../theme/colors';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  async function login() {
    if (!email || !password) { Alert.alert('Preencha email e senha'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { token: string; userId: string; username: string; error?: string };
      if (!res.ok) { Alert.alert(data.error ?? 'Erro ao entrar'); return; }
      await setAuth(data.token, data.userId, data.username);
      router.replace('/lobby');
    } catch {
      Alert.alert('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={[Colors.bg, '#3D1500']} style={styles.bg}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Text style={styles.title}>BATALHA{'\n'}DA ALDEIA</Text>
        <Text style={styles.subtitle}>CARD GAME</Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor={Colors.textLight}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={Colors.textLight}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={login} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Entrando...' : 'ENTRAR'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.link}>Não tem conta? Cadastrar</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 42, fontWeight: '900', color: Colors.mcOrange, textAlign: 'center', letterSpacing: 3, lineHeight: 48 },
  subtitle: { fontSize: 14, color: Colors.gold, letterSpacing: 6, marginBottom: 48, marginTop: 4 },
  input: {
    width: '100%', backgroundColor: Colors.offWhite + '15', borderWidth: 1, borderColor: Colors.gold + '60',
    borderRadius: 10, color: Colors.white, padding: 14, marginBottom: 14, fontSize: 16,
  },
  btn: { width: '100%', backgroundColor: Colors.mcOrange, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontWeight: '900', fontSize: 18, letterSpacing: 2 },
  link: { color: Colors.gold, marginTop: 20, fontSize: 14 },
});
