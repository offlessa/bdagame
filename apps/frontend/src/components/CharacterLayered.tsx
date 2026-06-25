import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing, StyleSheet, Platform } from 'react-native';
import { CharacterLook } from '../store/characterStore';

const BASE = '/partes-personagem';
const CANVAS_W = 2646;
const CANVAS_H = 1701;

// Character occupies roughly source x=870-1870, y=80-1580 in the 2646x1701 canvas
const CROP_X = 870;
const CROP_W = 1000;
const CROP_Y = 80;
const CROP_H = 1500;

// Hair color: cor_cabelo stores hue angle '0'-'359', or '' for original (black).
// sepia(1) shifts the base hue ~36° toward orange, so we subtract that offset
// so the slider position matches the actual resulting color intuitively.
export function hairFilter(hue: string): string {
  if (!hue)             return '';
  if (hue === 'white')  return 'brightness(10) saturate(0)';
  if (hue === 'yellow') return 'brightness(7) sepia(1) saturate(40) hue-rotate(39deg) brightness(0.9)';
  const adjusted = ((parseInt(hue, 10) - 36 + 360) % 360);
  return `brightness(5) sepia(1) saturate(30) hue-rotate(${adjusted}deg) brightness(0.65)`;
}

// Inject CSS animation once into document.head (web only)
let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  cssInjected = true;
  const el = document.createElement('style');
  el.textContent = `
    @keyframes char-anim {
      0%, 100% { transform: translateY(0px) scale(1); }
      50%       { transform: translateY(-5px) scale(1.02); }
    }
    .char-layered-anim { animation: char-anim 2.2s ease-in-out infinite; }
  `;
  document.head.appendChild(el);
}

interface Props {
  look: CharacterLook;
  size?: number;
}

export default function CharacterLayered({ look, size = 200 }: Props) {
  if (Platform.OS === 'web') injectCSS();

  const dispH   = Math.round(size * CROP_H / CROP_W);
  const scale   = size / CROP_W;
  const scaledW = Math.round(CANVAS_W * scale);
  const scaledH = Math.round(CANVAS_H * scale);
  const imgLeft = -Math.round(CROP_X * scale);
  const imgTop  = -Math.round(CROP_Y * scale);

  // Native animation values (unused on web)
  const floatY  = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -5, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(floatY, { toValue: 0,  duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.02, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(breathe, { toValue: 1,    duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const l = {
    cabelo:          look.cabelo          ?? '1',
    sobrancelha:     look.sobrancelha     ?? '1',
    olhos:           look.olhos           ?? '1',
    nariz:           look.nariz           ?? '1',
    boca:            look.boca            ?? '1',
    camiseta:        look.camiseta        ?? '0',
    roupa_top:       look.roupa_top       ?? '1',
    roupa_calca:     look.roupa_calca     ?? '1',
    calcado:         look.calcado         ?? '1',
    mic:             look.mic             ?? '1',
    relogio:         look.relogio         ?? '0',
    cor_cabelo:      look.cor_cabelo      ?? '',
    cor_sobrancelha: look.cor_sobrancelha ?? '',
  };

  type Layer = { url: string; flt: string };
  const layers: Layer[] = [
    { url: `${BASE}/peles/corpo.png`,              flt: '' },
    { url: `${BASE}/peles/pes.png`,                flt: '' },
    { url: `${BASE}/peles/braco_esq.png`,          flt: '' },
    { url: `${BASE}/acessorios/braco_mic.png`,     flt: '' },
    ...(l.relogio   !== '0' ? [{ url: `${BASE}/acessorios/relogio${l.relogio}.png`,  flt: '' }] : []),
    ...(l.mic === '2' ? [{ url: `${BASE}/acessorios/mic_gold.png`,                   flt: '' }] : []),
    ...(l.camiseta  !== '0' ? [{ url: `${BASE}/roupas/camiseta${l.camiseta}.png`,    flt: '' }] : []),
    ...(l.roupa_calca !== '0' ? [{ url: `${BASE}/roupas/calca${l.roupa_calca}.png`, flt: '' }] : []),
    ...(l.roupa_top   !== '0' ? [{ url: `${BASE}/roupas/top${l.roupa_top}.png`,     flt: '' }] : []),
    ...(l.calcado     !== '0' ? [{ url: `${BASE}/acessorios/tenis${l.calcado}.png`, flt: '' }] : []),
    { url: `${BASE}/cabeca/1.png`,                 flt: '' },
    ...(l.cabelo !== '0' ? [{ url: `${BASE}/cabelos/${l.cabelo}.png`, flt: hairFilter(l.cor_cabelo) }] : []),
    { url: `${BASE}/Olhos/${l.olhos}.png`,              flt: '' },
    { url: `${BASE}/sobrancelhas/${l.sobrancelha}.png`, flt: hairFilter(l.cor_sobrancelha) },
    { url: `${BASE}/Narizes/${l.nariz}.png`,            flt: '' },
    { url: `${BASE}/Bocas/${l.boca}.png`,               flt: '' },
  ];

  if (Platform.OS === 'web') {
    // Pure HTML - bypasses all RN Web overflow/clip issues.
    const Div = 'div' as any;
    const Img = 'img' as any;
    return (
      <Div style={{ position: 'relative', width: size, height: dispH, overflow: 'hidden' }}>
        <Div className="char-layered-anim" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          {layers.map(({ url, flt }, i) => (
            <Img
              key={i}
              src={url}
              style={{
                position: 'absolute',
                top: imgTop,
                left: imgLeft,
                width: scaledW,
                height: scaledH,
                ...(flt ? { filter: flt } : {}),
              }}
            />
          ))}
        </Div>
      </Div>
    );
  }

  // Native (iOS / Android)
  return (
    <View style={{ width: size, height: dispH, overflow: 'hidden' }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateY: floatY }, { scale: breathe }] },
        ]}
      >
        {layers.map(({ url }, i) => (
          <Image
            key={i}
            source={{ uri: url }}
            style={{ position: 'absolute', top: imgTop, left: imgLeft, width: scaledW, height: scaledH }}
            resizeMode="stretch"
          />
        ))}
      </Animated.View>
    </View>
  );
}
