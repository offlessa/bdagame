import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { Colors } from '../src/theme/colors';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  async function register() {
    if (!username || !email || !password) { Alert.alert('Preencha todos os campos'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json() as { token: string; userId: string; username: string; error?: string };
      if (!res.ok) { Alert.alert(data.error ?? 'Erro ao cadastrar'); return; }
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
        <Text style={styles.title}>CRIAR CONTA</Text>

        <TextInput style={styles.input} placeholder="Nome de usuário" placeholderTextColor={Colors.textLight} value={username} onChangeText={setUsername} />
        <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor={Colors.textLight} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Senha" placeholderTextColor={Colors.textLight} value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={register} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Cadastrando...' : 'CADASTRAR'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Já tem conta? Entrar</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.mcOrange, letterSpacing: 2, marginBottom: 32 },
  input: { width: '100%', backgroundColor: Colors.offWhite + '15', borderWidth: 1, borderColor: Colors.gold + '60', borderRadius: 10, color: Colors.white, padding: 14, marginBottom: 14, fontSize: 16 },
  btn: { width: '100%', backgroundColor: Colors.mcOrange, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontWeight: '900', fontSize: 18, letterSpacing: 2 },
  link: { color: Colors.gold, marginTop: 20, fontSize: 14 },
});
