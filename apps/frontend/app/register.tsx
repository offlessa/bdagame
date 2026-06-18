import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { Colors } from '../src/theme/colors';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      router.replace('/character-creation');
    } catch {
      Alert.alert('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#2A0E00', '#1A0A00', '#0D0400']} locations={[0, 0.5, 1]} style={styles.bg}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="person-add-outline" size={36} color={Colors.mcOrange} style={styles.headerIcon} />
          <Text style={styles.title}>CRIAR CONTA</Text>
          <Text style={styles.titleSub}>Batalha da Aldeia</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={15} color={Colors.gold} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Nome de usuário"
              placeholderTextColor={Colors.textLight}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.sep} />

          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={15} color={Colors.gold} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.sep} />

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

          <TouchableOpacity
            onPress={register}
            disabled={loading}
            activeOpacity={0.8}
            style={[styles.btnOuter, loading && { opacity: 0.55 }]}
          >
            <LinearGradient colors={[Colors.mcOrangeLight, Colors.mcOrange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
              <Text style={styles.btnText}>{loading ? 'Cadastrando...' : 'CADASTRAR'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.linkRow}>
            <Text style={styles.linkText}>Já tem conta? </Text>
            <Text style={styles.linkBold}>Entrar</Text>
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
  header: { alignItems: 'center', marginBottom: 24 },
  headerIcon: { marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.mcOrange, letterSpacing: 4 },
  titleSub: { fontSize: 12, color: Colors.gold, letterSpacing: 3, marginTop: 2 },

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

  btnOuter: { marginTop: 22, borderRadius: 9, overflow: 'hidden' },
  btn: { paddingVertical: 12, alignItems: 'center' },
  btnText: { color: Colors.white, fontWeight: '900', fontSize: 15, letterSpacing: 3 },

  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  linkText: { color: Colors.textLight, fontSize: 13 },
  linkBold: { color: Colors.gold, fontSize: 13, fontWeight: '700' },
});
