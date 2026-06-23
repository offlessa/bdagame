import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing } from 'react-native';
import { CharacterLook } from '../store/characterStore';

const ASPECT = 1350 / 1080;
const BASE = '/partes-personagem';

const CORPO_URI  = `${BASE}/Corpo/okk.png`;
const CABECA_URI = encodeURI(`${BASE}/Cabeça/okk.png`);
const OLHOS_URI  = `${BASE}/Olhos/okk.png`;
const BOCAS_URI  = `${BASE}/Bocas/okk.png`;

export function olhosUri(_n: string) { return OLHOS_URI; }
export function narizUri(_n: string) { return `${BASE}/Narizes/okk.png`; }
export function bocaUri(_n: string)  { return BOCAS_URI; }

interface Props {
  look: CharacterLook;
  size?: number;
}

export default function CharacterLayered({ size = 200 }: Props) {
  const height = Math.round(size * ASPECT);

  // Float: sobe e desce suavemente (~beat lento)
  const floatY  = useRef(new Animated.Value(0)).current;
  // Breathe: leve expansão/contração como respiração
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -6, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,  duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.025, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1,     duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const layer = { position: 'absolute' as const, top: 0, left: 0, width: size, height };

  return (
    // overflow visible para o float não ser cortado em cima
    <View style={{ width: size, height }}>
      <Animated.View
        style={{
          width: size,
          height,
          transform: [{ translateY: floatY }, { scale: breathe }],
        }}
      >
        <Image source={{ uri: CORPO_URI }}  style={layer} resizeMode="stretch" />
        <Image source={{ uri: CABECA_URI }} style={layer} resizeMode="stretch" />
        <Image source={{ uri: OLHOS_URI }}  style={layer} resizeMode="stretch" />
        <Image source={{ uri: BOCAS_URI }}  style={layer} resizeMode="stretch" />
      </Animated.View>
    </View>
  );
}
