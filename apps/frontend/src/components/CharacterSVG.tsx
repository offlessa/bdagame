import React from 'react';
import Svg, {
  G, Circle, Ellipse, Path, Rect, Line,
  Text as SvgText, Defs, LinearGradient, Stop,
} from 'react-native-svg';
import { CharacterLook } from '../store/characterStore';

// ─── Paletas ──────────────────────────────────────────────────────────────────

const HAT_HEX: Record<string, string> = {
  'bone-preto': '#141414', 'bone-ouro': '#C9A84C', 'bone-azul': '#1A6FC4',
  'bone-vermelho': '#C62828', bandana: '#C02020', touca: '#222', sem: 'none',
};
const HOODIE_HEX: Record<string, string> = {
  preto: '#1e1e1e', cinza: '#5a5a5a', azul: '#1A6FC4', vermelho: '#C02020',
  verde: '#2E7D32', laranja: '#D85500', roxo: '#5B2D8E', branco: '#e0e0e0',
};
const PANTS_HEX: Record<string, string> = {
  'cargo-verde': '#5c6845', jeans: '#2a4a80', 'cargo-preto': '#1e1e1e',
  camuflado: '#4a5535', branco: '#d0d0d0', vinho: '#7a1428',
};

function dk(hex: string, amt = 32): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
  return `#${c((n >> 16) - amt)}${c(((n >> 8) & 0xff) - amt)}${c((n & 0xff) - amt)}`;
}
function lt(hex: string, amt = 24): string { return dk(hex, -amt); }

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
  look: CharacterLook;
  archetypeColor: string;
  size?: number;
}

// ─── Personagem ───────────────────────────────────────────────────────────────
/*
  ViewBox 200 × 360  (proporções próximas ao estilo cartoon do Ideogram)
  Cabeça: cx=100 cy=64 r=48  → topo y=16, base y=112
  Ouvidos: L(52,65) R(148,65)
  Pescoço: x=87 y=108 w=26 h=16
  Corpo/Moletom: trapézio y=122–234
  Braços: y=126–232, mãos em L(18,240) R(182,240)
  Pernas: y=232–320
  Tênis: y=316–336
*/
export default function CharacterSVG({ look, archetypeColor, size = 180 }: Props) {
  const skin  = '#7B4A2C';
  const skinL = '#9C6240';
  const skinD = '#562E14';

  const dreadC = '#4E2C0E';
  const dreadH = '#7A4820';

  const hatC  = HAT_HEX[look.hat]    ?? '#141414';
  const hatD  = dk(hatC);
  const hatL  = lt(hatC, 18);

  const hoodC = HOODIE_HEX[look.hoodie] ?? '#1e1e1e';
  const hoodD = dk(hoodC);
  const hoodL = lt(hoodC, 18);

  const pantsC = PANTS_HEX[look.pants] ?? '#5c6845';
  const pantsD = dk(pantsC);

  const h = Math.round(size * 1.8);

  const gid = String(size); // id único para gradients

  return (
    <Svg width={size} height={h} viewBox="0 0 200 360">
      <Defs>
        <LinearGradient id={`sk${gid}`} x1="0.3" y1="0" x2="0.7" y2="1">
          <Stop offset="0" stopColor={skinL} /><Stop offset="1" stopColor={skinD} />
        </LinearGradient>
        <LinearGradient id={`hd${gid}`} x1="0.3" y1="0" x2="0.7" y2="1">
          <Stop offset="0" stopColor={hoodL} /><Stop offset="1" stopColor={hoodD} />
        </LinearGradient>
        <LinearGradient id={`pt${gid}`} x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor={pantsC} /><Stop offset="1" stopColor={pantsD} />
        </LinearGradient>
      </Defs>

      {/* ── Sombra ── */}
      <Ellipse cx="100" cy="352" rx="52" ry="8" fill="rgba(0,0,0,0.22)" />

      {/* ── Tênis ── */}
      {shoes(look.shoes)}

      {/* ── Pernas ── */}
      <Rect x="50" y="230" width="40" height="90" rx="8" fill={`url(#pt${gid})`} />
      <Rect x="52"  y="250" width="25" height="24" rx="3" fill={pantsD} opacity="0.55" />
      <Rect x="110" y="230" width="40" height="90" rx="8" fill={`url(#pt${gid})`} />
      <Rect x="123" y="250" width="25" height="24" rx="3" fill={pantsD} opacity="0.55" />

      {/* ── Corpo / Moletom ── */}
      <Path d="M 52 122 L 148 122 L 160 234 L 40 234 Z" fill={`url(#hd${gid})`} />
      {/* Costuras de ombro */}
      <Line x1="52"  y1="122" x2="100" y2="132" stroke={hoodD} strokeWidth="1.2" opacity="0.45" />
      <Line x1="148" y1="122" x2="100" y2="132" stroke={hoodD} strokeWidth="1.2" opacity="0.45" />
      {/* Bolso canguru */}
      <Path d="M 73 184 L 127 184 L 127 228 Q 100 234 73 228 Z" fill={hoodD} opacity="0.38" />
      <Line x1="100" y1="184" x2="100" y2="230" stroke={hoodD} strokeWidth="1" opacity="0.3" />
      {/* Cordões do capuz */}
      <Line x1="88"  y1="125" x2="84" y2="152" stroke={hoodD} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="112" y1="125" x2="116" y2="152" stroke={hoodD} strokeWidth="2.2" strokeLinecap="round" />
      {/* Faixa do arquétipo */}
      <Rect x="40" y="230" width="120" height="4" fill={archetypeColor} opacity="0.55" rx="0" />

      {/* ── Mangas ── */}
      {/* Esquerda */}
      <Path d="M 52 126 L 34 134 L 8 228 L 26 236 L 48 144 Z" fill={`url(#hd${gid})`} />
      <Rect x="6"  y="226" width="24" height="10" rx="5" fill={hoodD} />
      <Circle cx="16" cy="242" r="14" fill={`url(#sk${gid})`} />
      {/* Direita */}
      <Path d="M 148 126 L 166 134 L 192 228 L 174 236 L 152 144 Z" fill={`url(#hd${gid})`} />
      <Rect x="170" y="226" width="24" height="10" rx="5" fill={hoodD} />
      <Circle cx="184" cy="242" r="14" fill={`url(#sk${gid})`} />

      {/* ── Acessórios no corpo ── */}
      {look.accessory === 'corrente'  && chain()}
      {look.accessory === 'relogio'   && watch()}
      {look.accessory === 'microfone' && mic()}

      {/* ── Pescoço ── */}
      <Rect x="87" y="108" width="26" height="18" rx="5" fill={`url(#sk${gid})`} />

      {/* ── Ouvidos ── */}
      <Ellipse cx="52"  cy="66" rx="8" ry="11" fill={skin} />
      <Ellipse cx="52"  cy="66" rx="4"  ry="7"  fill={skinD} opacity="0.45" />
      <Ellipse cx="148" cy="66" rx="8" ry="11" fill={skin} />
      <Ellipse cx="148" cy="66" rx="4"  ry="7"  fill={skinD} opacity="0.45" />
      {/* Argolas douradas */}
      <Circle cx="52"  cy="80" r="6" fill="none" stroke="#C9A84C" strokeWidth="3.5" />
      <Circle cx="148" cy="80" r="6" fill="none" stroke="#C9A84C" strokeWidth="3.5" />

      {/* ── Dreads (antes da cabeça → raízes cobertas) ── */}
      {dreads(dreadC, dreadH, look.hat)}

      {/* ── Cabeça ── */}
      <Circle cx="100" cy="64" r="48" fill={`url(#sk${gid})`} />

      {/* ── Chapéu ── */}
      {look.hat !== 'sem' && hat(look.hat, hatC, hatD, hatL)}

      {/* ── Rosto ── */}
      {face(look.expression, skinD)}

      {/* ── Óculos ── */}
      {look.accessory === 'oculos' && glasses()}
    </Svg>
  );
}

// ─── Dreads ───────────────────────────────────────────────────────────────────

function dreads(color: string, hl: string, hatId: string) {
  const side = [
    'M 56 54 C 40 72 26 98 22 118',
    'M 52 70 C 38 90 24 114 20 136',
    'M 54 88 C 42 108 30 128 26 148',
    'M 144 54 C 160 72 174 98 178 118',
    'M 148 70 C 162 90 176 114 180 136',
    'M 146 88 C 158 108 170 128 174 148',
  ];
  const top = hatId === 'sem' ? [
    'M 78 18 C 68 32 56 50 52 64',
    'M 90 16 C 84 30 76 48 70 62',
    'M 100 16 C 100 30 100 48 100 62',
    'M 110 16 C 116 30 124 48 130 62',
    'M 122 18 C 132 32 144 50 148 64',
    'M 68 20 C 60 36 54 54 52 68',
    'M 132 20 C 140 36 146 54 148 68',
  ] : [];
  const all = [...side, ...top];
  return (
    <G>
      {all.map((d, i) => <Path key={i}    d={d} stroke={color} strokeWidth="9"   fill="none" strokeLinecap="round" />)}
      {all.map((d, i) => <Path key={`h${i}`} d={d} stroke={hl}    strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.45" />)}
    </G>
  );
}

// ─── Chapéu ───────────────────────────────────────────────────────────────────
// Cabeça: cx=100 cy=64 r=48. Em y=60: x = 100 ± √(48²-4²) ≈ ±47.8 → 52.2 / 147.8

function hat(id: string, c: string, d: string, l: string) {
  if (id === 'touca') return (
    <G>
      <Path d="M 54 64 A 48 48 0 0 1 146 64 Z" fill={c} />
      <Rect x="50" y="56" width="100" height="14" rx="7" fill={d} />
      {[0,1,2,3].map(i => <Line key={i} x1={62+i*24} y1="22" x2={60+i*24} y2="64" stroke={d} strokeWidth="2" opacity="0.3" />)}
      <Circle cx="100" cy="18" r="14" fill={d} />
      <Circle cx="100" cy="18" r="10" fill={c} />
      <Circle cx="100" cy="18" r="5"  fill={d} opacity="0.5" />
    </G>
  );

  if (id === 'bandana') return (
    <G>
      <Path d="M 54 70 Q 54 42 100 40 Q 146 42 146 70 L 142 78 Q 100 72 58 78 Z" fill={c} />
      <Path d="M 58 74 Q 100 68 142 74" stroke={d} strokeWidth="1.5" fill="none" opacity="0.6" />
      <Path d="M 142 68 L 158 58 L 154 50 L 148 66 Z" fill={c} />
      <Path d="M 142 68 L 160 74 L 154 50 Z" fill={d} opacity="0.45" />
    </G>
  );

  // Snapback (padrão)
  return (
    <G>
      {/* Cúpula */}
      <Path d="M 52.2 60 A 48 48 0 0 1 147.8 60 Z" fill={c} />
      {/* Botão da coroa */}
      <Circle cx="100" cy="18" r="5.5" fill={d} />
      {/* Costuras */}
      <Line x1="100" y1="18" x2="78"  y2="60" stroke={d} strokeWidth="1.2" opacity="0.4" />
      <Line x1="100" y1="18" x2="122" y2="60" stroke={d} strokeWidth="1.2" opacity="0.4" />
      <Line x1="100" y1="18" x2="52"  y2="60" stroke={d} strokeWidth="1"   opacity="0.25" />
      <Line x1="100" y1="18" x2="148" y2="60" stroke={d} strokeWidth="1"   opacity="0.25" />
      {/* Viseira */}
      <Path d="M 38 64 Q 100 82 162 64 L 160 75 Q 100 93 40 75 Z" fill={d} />
      <Path d="M 41 73 Q 100 91 159 73" stroke={l} strokeWidth="0.8" fill="none" opacity="0.5" />
      {/* Ajuste traseiro */}
      <Rect x="82" y="62" width="36" height="8" rx="2.5" fill={d} opacity="0.5" />
    </G>
  );
}

// ─── Rosto ───────────────────────────────────────────────────────────────────

function eye(cx: number, cy: number) {
  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx="11" ry="10" fill="#fff" />
      <Circle  cx={cx+1} cy={cy+1} r="7"   fill="#150800" />
      <Circle  cx={cx+5} cy={cy-3} r="3"   fill="#fff" />
      <Circle  cx={cx+7} cy={cy-5} r="1.2" fill="#fff" />
    </G>
  );
}

function face(expr: string, skinD: string) {
  const P  = '#150800';
  const lx = 80, rx = 120, ey = 60;

  let eyes: React.ReactElement;
  let brows: React.ReactElement;
  let mouth: React.ReactElement;

  switch (expr) {
    case 'rindo':
      eyes = (
        <G>
          <Path d={`M ${lx-12} ${ey} Q ${lx} ${ey-12} ${lx+12} ${ey}`} stroke={P} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <Path d={`M ${rx-12} ${ey} Q ${rx} ${ey-12} ${rx+12} ${ey}`} stroke={P} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <Ellipse cx="60"  cy="72" rx="10" ry="6" fill="#ff8888" opacity="0.28" />
          <Ellipse cx="140" cy="72" rx="10" ry="6" fill="#ff8888" opacity="0.28" />
        </G>
      );
      brows = (
        <G>
          <Path d={`M ${lx-11} ${ey-20} Q ${lx} ${ey-27} ${lx+11} ${ey-20}`} stroke={P} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <Path d={`M ${rx-11} ${ey-20} Q ${rx} ${ey-27} ${rx+11} ${ey-20}`} stroke={P} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </G>
      );
      mouth = (
        <G>
          <Path d="M 72 82 Q 100 104 128 82 L 126 89 Q 100 112 74 89 Z" fill={P} />
          <Path d="M 74 82 L 126 82" stroke="#fff" strokeWidth="6" />
          <Line x1="100" y1="82" x2="100" y2="103" stroke={P} strokeWidth="1.2" opacity="0.4" />
        </G>
      );
      break;

    case 'desafiador':
      eyes = (
        <G>
          {eye(lx, ey)}{eye(rx, ey)}
          <Path d={`M ${lx-11} ${ey-3} Q ${lx} ${ey-12} ${lx+11} ${ey-3}`} fill={skinD} opacity="0.72" />
          <Path d={`M ${rx-11} ${ey-3} Q ${rx} ${ey-12} ${rx+11} ${ey-3}`} fill={skinD} opacity="0.72" />
        </G>
      );
      brows = (
        <G>
          <Path d={`M ${lx-11} ${ey-18} L ${lx+11} ${ey-23}`} stroke={P} strokeWidth="4.5" strokeLinecap="round" />
          <Path d={`M ${rx-11} ${ey-23} L ${rx+11} ${ey-18}`} stroke={P} strokeWidth="4.5" strokeLinecap="round" />
        </G>
      );
      mouth = <Path d="M 82 84 Q 92 90 100 85 Q 108 80 118 84" stroke={P} strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      break;

    case 'focado':
      eyes = <G>{eye(lx, ey)}{eye(rx, ey)}</G>;
      brows = (
        <G>
          <Line x1={lx-11} y1={ey-19} x2={lx+11} y2={ey-17} stroke={P} strokeWidth="4" strokeLinecap="round" />
          <Line x1={rx-11} y1={ey-17} x2={rx+11} y2={ey-19} stroke={P} strokeWidth="4" strokeLinecap="round" />
        </G>
      );
      mouth = <Line x1="84" y1="82" x2="116" y2="82" stroke={P} strokeWidth="3.5" strokeLinecap="round" />;
      break;

    case 'surpreso':
      eyes = (
        <G>
          <Circle cx={lx} cy={ey} r="13" fill="#fff" />
          <Circle cx={rx} cy={ey} r="13" fill="#fff" />
          <Circle cx={lx} cy={ey+1} r="9" fill={P} />
          <Circle cx={rx} cy={ey+1} r="9" fill={P} />
          <Circle cx={lx+5} cy={ey-4} r="4" fill="#fff" />
          <Circle cx={rx+5} cy={ey-4} r="4" fill="#fff" />
        </G>
      );
      brows = (
        <G>
          <Path d={`M ${lx-12} ${ey-26} Q ${lx} ${ey-34} ${lx+12} ${ey-26}`} stroke={P} strokeWidth="3" fill="none" strokeLinecap="round" />
          <Path d={`M ${rx-12} ${ey-26} Q ${rx} ${ey-34} ${rx+12} ${ey-26}`} stroke={P} strokeWidth="3" fill="none" strokeLinecap="round" />
        </G>
      );
      mouth = <Ellipse cx="100" cy="86" rx="12" ry="10" fill={P} />;
      break;

    default: // confiante
      eyes = <G>{eye(lx, ey)}{eye(rx, ey)}</G>;
      brows = (
        <G>
          <Path d={`M ${lx-11} ${ey-20} Q ${lx} ${ey-27} ${lx+11} ${ey-20}`} stroke={P} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <Path d={`M ${rx-11} ${ey-20} Q ${rx} ${ey-27} ${rx+11} ${ey-20}`} stroke={P} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </G>
      );
      mouth = (
        <G>
          <Path d="M 82 80 Q 100 96 118 80 L 116 87 Q 100 102 84 87 Z" fill="#B83020" />
          <Path d="M 84 80 L 116 80" stroke="#fff" strokeWidth="5.5" />
        </G>
      );
  }

  return (
    <G>
      {brows}
      {eyes}
      <Circle cx="94"  cy="73" r="2.5" fill={skinD} opacity="0.45" />
      <Circle cx="106" cy="73" r="2.5" fill={skinD} opacity="0.45" />
      {mouth}
    </G>
  );
}

// ─── Tênis ────────────────────────────────────────────────────────────────────

function shoes(id: string) {
  const cfg: Record<string, { b: string; a: string }> = {
    tenis:   { b: '#111', a: '#fff' },
    bota:    { b: '#3d2010', a: '#6a4028' },
    casual:  { b: '#2a2a2a', a: '#aaa' },
    chinelo: { b: '#1555B0', a: '#70B0FF' },
  };
  const { b, a } = cfg[id] ?? cfg.tenis;
  return (
    <G>
      {/* Esquerdo */}
      <Path d="M 26 316 Q 54 306 88 316 L 88 332 Q 54 338 24 332 Z" fill={b} />
      <Line x1="32" y1="322" x2="84" y2="322" stroke={a} strokeWidth="3.5" strokeLinecap="round" opacity="0.65" />
      <Rect x="23" y="330" width="68" height="6" rx="3" fill={a} opacity="0.8" />
      {/* Cadarços */}
      {[40,52,64,76].map(x => <Line key={x} x1={x} y1="316" x2={x} y2="325" stroke={a} strokeWidth="1.5" opacity="0.4" />)}

      {/* Direito */}
      <Path d="M 112 316 Q 146 306 174 316 L 176 332 Q 146 338 110 332 Z" fill={b} />
      <Line x1="118" y1="322" x2="172" y2="322" stroke={a} strokeWidth="3.5" strokeLinecap="round" opacity="0.65" />
      <Rect x="109" y="330" width="68" height="6" rx="3" fill={a} opacity="0.8" />
      {[126,138,150,162].map(x => <Line key={x} x1={x} y1="316" x2={x} y2="325" stroke={a} strokeWidth="1.5" opacity="0.4" />)}
    </G>
  );
}

// ─── Acessórios ───────────────────────────────────────────────────────────────

function chain() {
  return (
    <G>
      <Path d="M 84 114 Q 100 128 116 114" stroke="#C9A84C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M 80 124 Q 100 140 120 124" stroke="#C9A84C" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" />
      <Path d="M 78 136 Q 100 154 122 136" stroke="#C9A84C" strokeWidth="2"   fill="none" strokeLinecap="round" opacity="0.55" />
      <Circle cx="100" cy="156" r="6"   fill="#C9A84C" stroke="#7a5800" strokeWidth="0.8" />
      <Circle cx="100" cy="156" r="3.5" fill="#FFD700" />
    </G>
  );
}

function watch() {
  return (
    <G>
      <Rect x="4"  y="234" width="24" height="16" rx="4" fill="#111" />
      <Rect x="6"  y="236" width="20" height="12" rx="3" fill="#1565C0" opacity="0.9" />
      <Line x1="9" y1="242" x2="26"  y2="242" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
      <Line x1="17.5" y1="238" x2="17.5" y2="246" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    </G>
  );
}

function mic() {
  return (
    <G>
      <Ellipse cx="185" cy="232" rx="9" ry="12" fill="#444" stroke="#333" strokeWidth="1.5" />
      <Ellipse cx="185" cy="222" rx="8" ry="8"  fill="#222" />
      <Line x1="185" y1="244" x2="185" y2="265" stroke="#555" strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M 177 265 Q 185 270 193 265" stroke="#555" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </G>
  );
}

function glasses() {
  return (
    <G>
      <Rect x="62" y="52" width="28" height="20" rx="5" fill="rgba(0,0,0,0.72)" stroke="#aaa" strokeWidth="1.8" />
      <Rect x="110" y="52" width="28" height="20" rx="5" fill="rgba(0,0,0,0.72)" stroke="#aaa" strokeWidth="1.8" />
      <Line x1="90"  y1="62" x2="110" y2="62" stroke="#bbb" strokeWidth="1.8" />
      <Line x1="61"  y1="62" x2="44"  y2="66" stroke="#bbb" strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="138" y1="62" x2="155" y2="66" stroke="#bbb" strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="66"  y1="55" x2="83"  y2="55" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" />
      <Line x1="114" y1="55" x2="131" y2="55" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" />
    </G>
  );
}
