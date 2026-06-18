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
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useRive, useStateMachineInput, Fit, Alignment, Layout } from '@rive-app/react-canvas';
import { CharacterLook } from '../store/characterStore';
import { Colors } from '../theme/colors';

// ← Mude para true quando colocar o character.riv em apps/frontend/public/
const RIVE_READY = false;

const STATE_MACHINE = 'Customize';

const HAT_IDX: Record<string, number> = {
  'bone-preto': 0, 'bone-ouro': 1, 'bone-azul': 2, 'bone-vermelho': 3,
  bandana: 4, touca: 5, sem: 6,
};
const HOODIE_IDX: Record<string, number> = {
  preto: 0, cinza: 1, azul: 2, vermelho: 3, verde: 4, laranja: 5, roxo: 6, branco: 7,
};
const PANTS_IDX: Record<string, number> = {
  'cargo-verde': 0, jeans: 1, 'cargo-preto': 2, camuflado: 3, branco: 4, vinho: 5,
};
const SHOES_IDX: Record<string, number> = { tenis: 0, bota: 1, casual: 2, chinelo: 3 };
const ACC_IDX: Record<string, number> = { corrente: 0, relogio: 1, oculos: 2, microfone: 3, sem: 4 };
const EXPR_IDX: Record<string, number> = {
  confiante: 0, desafiador: 1, focado: 2, rindo: 3, surpreso: 4,
};

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

function RiveCharacter({ look, size }: Props) {
  const height = Math.round(size * 1.7);

  const { rive, RiveComponent } = useRive({
    src: '/character.riv',
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });

  const hatInput       = useStateMachineInput(rive, STATE_MACHINE, 'hat');
  const hoodieInput    = useStateMachineInput(rive, STATE_MACHINE, 'hoodie');
  const pantsInput     = useStateMachineInput(rive, STATE_MACHINE, 'pants');
  const shoesInput     = useStateMachineInput(rive, STATE_MACHINE, 'shoes');
  const accInput       = useStateMachineInput(rive, STATE_MACHINE, 'accessory');
  const exprInput      = useStateMachineInput(rive, STATE_MACHINE, 'expression');

  useEffect(() => { if (hatInput)    hatInput.value    = HAT_IDX[look.hat]         ?? 0; }, [look.hat,        hatInput]);
  useEffect(() => { if (hoodieInput) hoodieInput.value = HOODIE_IDX[look.hoodie]   ?? 0; }, [look.hoodie,     hoodieInput]);
  useEffect(() => { if (pantsInput)  pantsInput.value  = PANTS_IDX[look.pants]     ?? 0; }, [look.pants,      pantsInput]);
  useEffect(() => { if (shoesInput)  shoesInput.value  = SHOES_IDX[look.shoes]     ?? 0; }, [look.shoes,      shoesInput]);
  useEffect(() => { if (accInput)    accInput.value    = ACC_IDX[look.accessory]   ?? 4; }, [look.accessory,  accInput]);
  useEffect(() => { if (exprInput)   exprInput.value   = EXPR_IDX[look.expression] ?? 0; }, [look.expression, exprInput]);

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
