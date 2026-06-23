/**
 * CharacterRive — Renderiza o personagem MC via arquivo Rive (.riv)
 *
 * ─── COMO CONFIGURAR O ARQUIVO RIVE ────────────────────────────────────────
 *
 * 1. Acesse https://rive.app e crie uma conta gratuita
 * 2. Crie um novo arquivo ou faça fork de um template:
 *    → https://rive.app/community/files/11572-22126-character-creator/
 * 3. No editor, crie uma State Machine chamada exatamente: "Customize"
 * 4. Adicione estes inputs de tipo Number na State Machine:
 *
 *    hat        → 0=bone-preto  1=bone-ouro  2=bone-azul  3=bone-vermelho  4=bandana  5=touca  6=sem
 *    hoodie     → 0=preto  1=cinza  2=azul  3=vermelho  4=verde  5=laranja  6=roxo  7=branco
 *    pants      → 0=cargo-verde  1=jeans  2=cargo-preto  3=camuflado  4=branco  5=vinho
 *    shoes      → 0=tenis  1=bota  2=casual  3=chinelo
 *    accessory  → 0=corrente  1=relogio  2=oculos  3=microfone  4=sem
 *    expression → 0=confiante  1=desafiador  2=focado  3=rindo  4=surpreso
 *
 * 5. Cada input controla quais layers ficam visíveis (use condições na State Machine)
 * 6. Exporte: File → Export → For Runtime → salve como "character.riv"
 * 7. Coloque o arquivo em: apps/frontend/public/character.riv
 * 8. Mude RIVE_READY para true neste arquivo
 *
 * ───────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { useRive, useStateMachineInput, Fit, Alignment, Layout } from '@rive-app/react-canvas';
import { CharacterLook } from '../store/characterStore';
import { Colors } from '../theme/colors';

// ← Mude para true quando colocar o character.riv em apps/frontend/public/
const RIVE_READY = false;

const STATE_MACHINE = 'Customize';

const OLHOS_IDX: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4 };
const NARIZ_IDX: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4 };
const BOCA_IDX:  Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4 };

interface Props {
  look: CharacterLook;
  archetypeColor: string;
  size?: number;
}

export default function CharacterRive({ look, archetypeColor, size = 180 }: Props) {
  if (!RIVE_READY) {
    return <RivePlaceholder size={size} />;
  }
  return <RiveCharacter look={look} archetypeColor={archetypeColor} size={size} />;
}

// ─── Rive real (ativo quando RIVE_READY = true) ────────────────────────────

function RiveCharacter({ look, size = 180 }: Props) {
  const height = Math.round(size * 1.7);

  const { rive, RiveComponent } = useRive({
    src: '/character.riv',
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });

  const olhosInput = useStateMachineInput(rive, STATE_MACHINE, 'olhos');
  const narizInput = useStateMachineInput(rive, STATE_MACHINE, 'nariz');
  const bocaInput  = useStateMachineInput(rive, STATE_MACHINE, 'boca');

  useEffect(() => { if (olhosInput) olhosInput.value = OLHOS_IDX[look.olhos] ?? 0; }, [look.olhos, olhosInput]);
  useEffect(() => { if (narizInput) narizInput.value = NARIZ_IDX[look.nariz] ?? 0; }, [look.nariz, narizInput]);
  useEffect(() => { if (bocaInput)  bocaInput.value  = BOCA_IDX[look.boca]   ?? 0; }, [look.boca,  bocaInput]);

  return (
    <View style={{ width: size, height }}>
      <RiveComponent />
    </View>
  );
}

// ─── Placeholder (enquanto .riv não está pronto) ───────────────────────────

function RivePlaceholder({ size }: { size: number }) {
  return (
    <View style={[ph.root, { width: size, height: Math.round(size * 1.7) }]}>
      <Text style={ph.icon}>🎨</Text>
      <Text style={ph.title}>Rive não configurado</Text>
      <Text style={ph.body}>
        Crie o personagem em{'\n'}
        <Text style={ph.link} onPress={() => Linking.openURL('https://rive.app')}>
          rive.app
        </Text>
        {'\n'}e siga as instruções em{'\n'}
        CharacterRive.tsx
      </Text>
    </View>
  );
}

const ph = StyleSheet.create({
  root: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, borderWidth: 1,
    borderColor: Colors.gold + '30',
    borderStyle: 'dashed',
    gap: 8, padding: 16,
  },
  icon: { fontSize: 36 },
  title: { color: Colors.gold, fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  body: { color: Colors.textLight, fontSize: 11, textAlign: 'center', lineHeight: 18 },
  link: { color: Colors.mcOrange, fontWeight: '700' },
});
