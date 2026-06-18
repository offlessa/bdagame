import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../src/theme/colors';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    if (!email) { Alert.alert('Informe seu email'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { ok: boolean; devCode?: string };
      if (!res.ok) { Alert.alert('Erro ao enviar código'); return; }
      if (data.devCode) setCode(data.devCode);
      setStep(2);
    } catch {
      Alert.alert('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!code || !newPassword || !confirmPassword) { Alert.alert('Preencha todos os campos'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('As senhas não coincidem'); return; }
    if (newPassword.length < 6) { Alert.alert('Senha deve ter ao menos 6 caracteres'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase(), newPassword }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!res.ok) { Alert.alert(data.error ?? 'Código inválido ou expirado'); return; }
      Alert.alert('Senha redefinida!', 'Faça login com sua nova senha.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } catch {
      Alert.alert('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#2A0E00', '#1A0A00', '#0D0400']} locations={[0, 0.5, 1]} style={styles.bg}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.wrapper}>

          {/* Back button */}
          <TouchableOpacity
            onPress={() => (step === 2 ? setStep(1) : router.back())}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.gold} />
            <Text style={styles.backText}>{step === 2 ? 'Voltar' : 'Cancelar'}</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="key-outline" size={40} color={Colors.mcOrange} style={{ marginBottom: 10 }} />
            <Text style={styles.title}>RECUPERAR SENHA</Text>
            <Text style={styles.titleSub}>
              {step === 1 ? 'Informe seu email cadastrado' : 'Verifique seu email e digite o código'}
            </Text>
          </View>

          {/* Step indicators */}
          <View style={styles.stepsRow}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          </View>

          {/* Card */}
          <View style={styles.card}>
            {step === 1 ? (
              <>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={15} color={Colors.gold} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Seu email"
                    placeholderTextColor={Colors.textLight}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.hint}>
                  Enviaremos um código de 6 caracteres para redefinir sua senha.
                </Text>

                <TouchableOpacity
                  onPress={sendCode}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={[styles.btnOuter, loading && { opacity: 0.55 }]}
                >
                  <LinearGradient
                    colors={[Colors.mcOrangeLight, Colors.mcOrange]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.btn}
                  >
                    <Text style={styles.btnText}>{loading ? 'Enviando...' : 'ENVIAR CÓDIGO'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputRow}>
                  <Ionicons name="keypad-outline" size={15} color={Colors.gold} style={styles.icon} />
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="Código (ex: A3F7K2)"
                    placeholderTextColor={Colors.textLight}
                    value={code}
                    onChangeText={(v) => setCode(v.toUpperCase())}
                    autoCapitalize="characters"
                    maxLength={6}
                  />
                </View>
                <View style={styles.sep} />

                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={15} color={Colors.gold} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nova senha"
                    placeholderTextColor={Colors.textLight}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                  />
                  <TouchableOpacity onPress={() => setShowNew((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={17} color={Colors.textLight} />
                  </TouchableOpacity>
                </View>
                <View style={styles.sep} />

                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={15} color={Colors.gold} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmar nova senha"
                    placeholderTextColor={Colors.textLight}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={17} color={Colors.textLight} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={resetPassword}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={[styles.btnOuter, loading && { opacity: 0.55 }]}
                >
                  <LinearGradient
                    colors={[Colors.mcOrangeLight, Colors.mcOrange]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.btn}
                  >
                    <Text style={styles.btnText}>{loading ? 'Redefinindo...' : 'REDEFINIR SENHA'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={sendCode} style={styles.resendRow}>
                  <Text style={styles.resendText}>Não recebeu? </Text>
                  <Text style={styles.resendBold}>Reenviar código</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

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
  wrapper: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 16,
  },
  backText: { color: Colors.gold, fontSize: 14 },

  header: { alignItems: 'center', marginBottom: 20, width: '100%' },
  title: { fontSize: 22, fontWeight: '900', color: Colors.mcOrange, letterSpacing: 3 },
  titleSub: { fontSize: 12, color: Colors.textLight, letterSpacing: 1, marginTop: 4, textAlign: 'center' },

  stepsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.textLight + '60' },
  stepDotActive: { backgroundColor: Colors.mcOrange },
  stepLine: { width: 40, height: 2, backgroundColor: Colors.textLight + '40', marginHorizontal: 6 },
  stepLineActive: { backgroundColor: Colors.mcOrange + '80' },

  card: {
    width: '100%',
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
  codeInput: { letterSpacing: 4, fontWeight: '700', fontSize: 16 },
  sep: { height: 1, backgroundColor: Colors.gold + '25', marginVertical: 2 },
  hint: { color: Colors.textLight, fontSize: 12, marginTop: 10, marginBottom: 4, lineHeight: 18 },

  btnOuter: { marginTop: 20, borderRadius: 9, overflow: 'hidden' },
  btn: { paddingVertical: 12, alignItems: 'center' },
  btnText: { color: Colors.white, fontWeight: '900', fontSize: 15, letterSpacing: 3 },

  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  resendText: { color: Colors.textLight, fontSize: 13 },
  resendBold: { color: Colors.gold, fontSize: 13, fontWeight: '700' },
});
