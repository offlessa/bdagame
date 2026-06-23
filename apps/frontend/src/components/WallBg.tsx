import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Rect, Circle, Line, Path, Polygon } from 'react-native-svg';

// Gerador pseudo-aleatório com seed para resultados consistentes
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function r(rand: () => number, min: number, max: number) {
  return min + rand() * (max - min);
}

// Gera um path de polígono irregular (manchas de tinta antiga)
function irregularPatch(rand: () => number, cx: number, cy: number, w: number, h: number): string {
  const jitter = () => r(rand, -0.25, 0.25);
  const x0 = cx - w / 2, x1 = cx + w / 2;
  const y0 = cy - h / 2, y1 = cy + h / 2;

  return [
    `M ${x0 + w * jitter()} ${y0 + h * jitter()}`,
    `L ${(x0 + x1) / 2 + w * jitter()} ${y0 + h * jitter()}`,
    `L ${x1 + w * jitter()} ${y0 + h * jitter()}`,
    `L ${x1 + w * jitter()} ${(y0 + y1) / 2 + h * jitter()}`,
    `L ${x1 + w * jitter()} ${y1 + h * jitter()}`,
    `L ${(x0 + x1) / 2 + w * jitter()} ${y1 + h * jitter()}`,
    `L ${x0 + w * jitter()} ${y1 + h * jitter()}`,
    `L ${x0 + w * jitter()} ${(y0 + y1) / 2 + h * jitter()}`,
    'Z',
  ].join(' ');
}

// Gera um pincelada larga diagonal
function brushStroke(rand: () => number, x1: number, y1: number, x2: number, y2: number, width: number): string {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len, ny = dx / len; // normal
  const w2 = width / 2;

  const jit = () => r(rand, 0.8, 1.2);

  const p1x = x1 + nx * w2 * jit(), p1y = y1 + ny * w2 * jit();
  const p2x = x1 - nx * w2 * jit(), p2y = y1 - ny * w2 * jit();
  const p3x = x2 - nx * w2 * jit(), p3y = y2 - ny * w2 * jit();
  const p4x = x2 + nx * w2 * jit(), p4y = y2 + ny * w2 * jit();

  const mx1 = (p1x + p4x) / 2 + r(rand, -20, 20);
  const my1 = (p1y + p4y) / 2 + r(rand, -20, 20);
  const mx2 = (p2x + p3x) / 2 + r(rand, -20, 20);
  const my2 = (p2y + p3y) / 2 + r(rand, -20, 20);

  return `M ${p1x} ${p1y} Q ${mx1} ${my1} ${p4x} ${p4y} L ${p3x} ${p3y} Q ${mx2} ${my2} ${p2x} ${p2y} Z`;
}

interface Props {
  intensity?: 'light' | 'medium' | 'heavy';
}

export default function WallBg({ intensity = 'medium' }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const rand = rng(42);

  // Tons de cinza escuro para as camadas (igual à foto)
  const DARKS = ['#111', '#141414', '#161616', '#181818', '#1A1A1A', '#1C1C1C'];
  const pickDark = () => DARKS[Math.floor(r(rand, 0, DARKS.length))];

  return (
    <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">

      {/* ── Fundo base de concreto: linhas horizontais muito sutis ── */}
      {Array.from({ length: Math.ceil(H / 3) }).map((_, i) => (
        <Line
          key={`h${i}`}
          x1={0} y1={i * 3} x2={W} y2={i * 3}
          stroke="#0D0D0D"
          strokeWidth={r(rand, 0.3, 0.9)}
          strokeOpacity={r(rand, 0.2, 0.6)}
        />
      ))}

      {/* ── Manchas grandes de tinta velha (como paredes repintadas) ── */}
      {Array.from({ length: 14 }).map((_, i) => {
        const cx = r(rand, -W * 0.1, W * 1.1);
        const cy = r(rand, -H * 0.1, H * 1.1);
        const w  = r(rand, W * 0.25, W * 0.75);
        const h  = r(rand, H * 0.1,  H * 0.45);
        const col = pickDark();
        const op  = r(rand, 0.4, 0.85);
        return (
          <Path
            key={`patch${i}`}
            d={irregularPatch(rand, cx, cy, w, h)}
            fill={col}
            fillOpacity={op}
          />
        );
      })}

      {/* ── Pinceladas largas diagonais (como o da foto) ── */}
      {Array.from({ length: 8 }).map((_, i) => {
        const x1  = r(rand, -W * 0.3, W * 0.5);
        const y1  = r(rand, -H * 0.2, H * 0.4);
        const x2  = x1 + r(rand, W * 0.3, W * 0.9);
        const y2  = y1 + r(rand, H * 0.1, H * 0.7);
        const sw  = r(rand, 30, 120);
        const op  = r(rand, 0.25, 0.60);
        const col = pickDark();
        return (
          <Path
            key={`brush${i}`}
            d={brushStroke(rand, x1, y1, x2, y2, sw)}
            fill={col}
            fillOpacity={op}
          />
        );
      })}

      {/* ── Pinceladas finas (marcas de rolo/broxa) ── */}
      {Array.from({ length: 12 }).map((_, i) => {
        const x1 = r(rand, 0, W);
        const y1 = r(rand, 0, H * 0.8);
        const x2 = x1 + r(rand, -W * 0.4, W * 0.4);
        const y2 = y1 + r(rand, H * 0.05, H * 0.5);
        const sw = r(rand, 4, 18);
        return (
          <Path
            key={`thin${i}`}
            d={brushStroke(rand, x1, y1, x2, y2, sw)}
            fill="#1E1E1E"
            fillOpacity={r(rand, 0.2, 0.5)}
          />
        );
      })}

      {/* ── Escorrimentos verticais de tinta (igual à foto) ── */}
      {Array.from({ length: 22 }).map((_, i) => {
        const x      = r(rand, 0, W);
        const yStart = r(rand, 0, H * 0.5);
        const yEnd   = yStart + r(rand, 40, H * 0.7);
        const thick  = r(rand, 1, 7);
        const op     = r(rand, 0.15, 0.55);
        // Pequena curva lateral no escorrimento
        const cx     = x + r(rand, -15, 15);
        return (
          <Path
            key={`drip${i}`}
            d={`M ${x} ${yStart} Q ${cx} ${(yStart + yEnd) / 2} ${x + r(rand, -5, 5)} ${yEnd}`}
            stroke="#1F1F1F"
            strokeWidth={thick}
            strokeOpacity={op}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}

      {/* ── Arranhões e riscos (dano na parede) ── */}
      {Array.from({ length: 30 }).map((_, i) => {
        const x1 = r(rand, 0, W);
        const y1 = r(rand, 0, H);
        const x2 = x1 + r(rand, -80, 80);
        const y2 = y1 + r(rand, -30, 30);
        return (
          <Line
            key={`scratch${i}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#252525"
            strokeWidth={r(rand, 0.5, 2.5)}
            strokeOpacity={r(rand, 0.15, 0.45)}
          />
        );
      })}

      {/* ── Grãos de textura de concreto (pontilhado) ── */}
      {Array.from({ length: 120 }).map((_, i) => (
        <Circle
          key={`grain${i}`}
          cx={r(rand, 0, W)}
          cy={r(rand, 0, H)}
          r={r(rand, 0.5, 3)}
          fill="#202020"
          fillOpacity={r(rand, 0.1, 0.4)}
        />
      ))}

      {/* ── Manchas circulares de tinta (spray antigo) ── */}
      {Array.from({ length: 10 }).map((_, i) => {
        const cx = r(rand, 0, W);
        const cy = r(rand, 0, H);
        const rad = r(rand, 15, 80);
        return (
          <Circle
            key={`blob${i}`}
            cx={cx} cy={cy} r={rad}
            fill="#171717"
            fillOpacity={r(rand, 0.2, 0.5)}
          />
        );
      })}

      {/* ── Bordas mais escuras (vinheta) ── */}
      <Rect x={0} y={0} width={W} height={H * 0.12} fill="#060606" fillOpacity={0.7} />
      <Rect x={0} y={H * 0.88} width={W} height={H * 0.12} fill="#060606" fillOpacity={0.7} />
      <Rect x={0} y={0} width={W * 0.06} height={H} fill="#060606" fillOpacity={0.5} />
      <Rect x={W * 0.94} y={0} width={W * 0.06} height={H} fill="#060606" fillOpacity={0.5} />

    </Svg>
  );
}
