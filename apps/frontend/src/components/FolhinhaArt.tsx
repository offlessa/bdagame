import React from 'react';
import Svg, {
  Circle, Rect, Line, Path, Ellipse, Polygon,
  Text as SvgText,
} from 'react-native-svg';

// Coordenadas internas (viewBox) — todos os arts usam 320×130
const VW = 320;
const VH = 130;

export interface ArtProps { width?: number; height?: number }

export function ArteBeco({ width = VW, height = VH }: ArtProps) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VW} ${VH}`}>
      <Rect x={0} y={0} width={VW} height={VH} fill="#1A0A00" />
      {[0,1,2,3,4,5,6,7].map(row => [0,1,2,3,4,5,6].map(col => (
        <Rect key={`${row}-${col}`}
          x={col * 48 + (row % 2) * 24 - 12} y={row * 14}
          width={44} height={12} rx={1}
          fill="none" stroke="#FF8C00" strokeWidth={0.5} strokeOpacity={0.3}
        />
      )))}
      <SvgText x={VW / 2} y={72} textAnchor="middle"
        fontSize={64} fontWeight="900" fontFamily="serif"
        fill="#FFAA00" fillOpacity={0.15}
      >BECO</SvgText>
      <SvgText x={VW / 2} y={72} textAnchor="middle"
        fontSize={64} fontWeight="900" fontFamily="serif"
        fill="none" stroke="#FFAA00" strokeWidth={1} strokeOpacity={0.6}
      >BECO</SvgText>
      <Rect x={148} y={20} width={24} height={36} rx={12} fill="#FFAA00" fillOpacity={0.9} />
      <Rect x={152} y={56} width={16} height={14}         fill="#FFAA00" fillOpacity={0.7} />
      <Rect x={144} y={70} width={32} height={3}  rx={1.5} fill="#FFAA00" fillOpacity={0.7} />
      {[...Array(12)].map((_, i) => (
        <Circle key={i} cx={20 + i * 26} cy={108} r={2 + (i % 3)} fill="#FF6600" fillOpacity={0.4} />
      ))}
      <Line x1={VW/2} y1={0} x2={VW/2 - 80} y2={VH} stroke="#FFAA00" strokeWidth={1} strokeOpacity={0.08} />
      <Line x1={VW/2} y1={0} x2={VW/2 + 80} y2={VH} stroke="#FFAA00" strokeWidth={1} strokeOpacity={0.08} />
    </Svg>
  );
}

export function ArtePedreira({ width = VW, height = VH }: ArtProps) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VW} ${VH}`}>
      <Rect x={0} y={0} width={VW} height={VH} fill="#0D0020" />
      {[0,1,2,3,4,5].map(i => (
        <Ellipse key={i} cx={VW / 2} cy={VH / 2}
          rx={30 + i * 34} ry={20 + i * 18}
          fill="none" stroke="#6A5ACD"
          strokeWidth={1.5 - i * 0.2} strokeOpacity={0.7 - i * 0.1}
          strokeDasharray="3,4"
        />
      ))}
      <SvgText x={80}  y={55} fontSize={28} fill="#9D00FF" fillOpacity={0.8}>♪</SvgText>
      <SvgText x={210} y={80} fontSize={22} fill="#6A5ACD" fillOpacity={0.7}>♫</SvgText>
      <SvgText x={50}  y={95} fontSize={16} fill="#AA88FF" fillOpacity={0.5}>♩</SvgText>
      <SvgText x={250} y={50} fontSize={18} fill="#8866DD" fillOpacity={0.6}>♬</SvgText>
      <SvgText x={VW/2} y={VH/2 + 8} textAnchor="middle"
        fontSize={36} fontWeight="900" fontFamily="serif"
        fill="#9D00FF" fillOpacity={0.9}
      >PEDREIRA</SvgText>
      <Polygon points="10,130 40,100 70,130"    fill="#3A2060" />
      <Polygon points="260,130 295,95 320,130"  fill="#2A1550" />
      <Polygon points="130,130 160,110 190,130" fill="#2D1A55" />
    </Svg>
  );
}

export function ArteComplexo({ width = VW, height = VH }: ArtProps) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VW} ${VH}`}>
      <Rect x={0} y={0} width={VW} height={VH} fill="#100500" />
      {[...Array(16)].map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        return (
          <Line key={i}
            x1={VW/2} y1={VH/2}
            x2={VW/2 + Math.cos(angle) * 180}
            y2={VH/2 + Math.sin(angle) * 120}
            stroke="#FF5500" strokeWidth={0.8}
            strokeOpacity={0.25 + (i % 3) * 0.1}
          />
        );
      })}
      <Rect x={0}   y={75} width={28} height={55} fill="#1E0A00" />
      <Rect x={25}  y={60} width={20} height={70} fill="#1A0800" />
      <Rect x={42}  y={80} width={15} height={50} fill="#1E0A00" />
      <Rect x={260} y={70} width={24} height={60} fill="#1A0800" />
      <Rect x={280} y={55} width={20} height={75} fill="#1E0A00" />
      <Rect x={298} y={82} width={22} height={48} fill="#1A0800" />
      {[[5,85],[5,100],[30,70],[30,88],[48,90]].map(([x,y], i) => (
        <Rect key={i} x={x} y={y} width={6} height={5} fill="#FF8C00" fillOpacity={0.5} />
      ))}
      <Circle cx={VW/2} cy={VH/2} r={22} fill="#FF4400" fillOpacity={0.12} />
      <Circle cx={VW/2} cy={VH/2} r={12} fill="#FF6600" fillOpacity={0.2} />
      <SvgText x={VW/2} y={VH/2 + 10} textAnchor="middle" fontSize={40} fill="#FF5500" fillOpacity={0.9}>⚡</SvgText>
      {[...Array(18)].map((_, i) => (
        <Ellipse key={i} cx={20 + i * 16} cy={128} rx={5} ry={8}
          fill="#FF4400" fillOpacity={0.25 + (i % 3) * 0.1}
        />
      ))}
    </Svg>
  );
}

export function ArteSombras({ width = VW, height = VH }: ArtProps) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VW} ${VH}`}>
      <Rect x={0} y={0} width={VW} height={VH} fill="#040010" />
      {[...Array(30)].map((_, i) => (
        <Circle key={i}
          cx={(i * 47 + 13) % VW} cy={(i * 31 + 7) % VH}
          r={0.8 + (i % 3) * 0.4}
          fill="#FFF" fillOpacity={0.3 + (i % 4) * 0.15}
        />
      ))}
      <Path d={`M ${VW/2} 0 L ${VW/2 - 50} ${VH} L ${VW/2 + 50} ${VH} Z`}
        fill="#9D00FF" fillOpacity={0.08} />
      <Line x1={VW/2} y1={0} x2={VW/2 - 50} y2={VH} stroke="#9D00FF" strokeWidth={1} strokeOpacity={0.3} />
      <Line x1={VW/2} y1={0} x2={VW/2 + 50} y2={VH} stroke="#9D00FF" strokeWidth={1} strokeOpacity={0.3} />
      <Ellipse cx={VW/2} cy={55} rx={18} ry={20} fill="#9D00FF" fillOpacity={0.7} />
      <Path d={`M ${VW/2 - 20} 72 Q ${VW/2} 95 ${VW/2 + 20} 72 L ${VW/2 + 22} 115 Q ${VW/2} 125 ${VW/2 - 22} 115 Z`}
        fill="#9D00FF" fillOpacity={0.7} />
      <Ellipse cx={VW/2} cy={128} rx={35} ry={6} fill="#9D00FF" fillOpacity={0.2} />
      <Circle cx={VW/2 - 7} cy={52} r={3} fill="#FFF" fillOpacity={0.9} />
      <Circle cx={VW/2 + 7} cy={52} r={3} fill="#FFF" fillOpacity={0.9} />
      <SvgText x={20}  y={70} fontSize={11} fill="#9D00FF" fillOpacity={0.4} letterSpacing={4}>• • • • •</SvgText>
      <SvgText x={240} y={90} fontSize={11} fill="#9D00FF" fillOpacity={0.4} letterSpacing={4}>• • • •</SvgText>
    </Svg>
  );
}

export function ArteTrono({ width = VW, height = VH }: ArtProps) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VW} ${VH}`}>
      <Rect x={0} y={0} width={VW} height={VH} fill="#0A0800" />
      {[...Array(8)].map((_, i) => (
        <Line key={`h${i}`} x1={0} y1={i * 18} x2={VW} y2={i * 18}
          stroke="#FFAA00" strokeWidth={0.3} strokeOpacity={0.1} />
      ))}
      {[...Array(10)].map((_, i) => (
        <Line key={`v${i}`} x1={i * 36} y1={0} x2={i * 36} y2={VH}
          stroke="#FFAA00" strokeWidth={0.3} strokeOpacity={0.1} />
      ))}
      <Rect x={VW/2 - 55} y={80} width={110} height={36} rx={4} fill="#FFAA00" fillOpacity={0.9} />
      <Polygon points={`${VW/2 - 55},80 ${VW/2 - 55},45 ${VW/2 - 35},68`} fill="#FFAA00" fillOpacity={0.9} />
      <Polygon points={`${VW/2},80 ${VW/2},30 ${VW/2 + 20},65 ${VW/2},80`} fill="#FFD700" fillOpacity={0.95} />
      <Polygon points={`${VW/2},80 ${VW/2},30 ${VW/2 - 20},65 ${VW/2},80`} fill="#FFAA00" fillOpacity={0.9} />
      <Polygon points={`${VW/2 + 55},80 ${VW/2 + 55},45 ${VW/2 + 35},68`} fill="#FFAA00" fillOpacity={0.9} />
      <Circle cx={VW/2}      cy={30} r={7} fill="#FF2020" fillOpacity={0.9} />
      <Circle cx={VW/2 - 55} cy={53} r={5} fill="#1E90FF" fillOpacity={0.9} />
      <Circle cx={VW/2 + 55} cy={53} r={5} fill="#39FF14" fillOpacity={0.9} />
      <Rect x={VW/2 - 52} y={82} width={104} height={8} rx={2} fill="#FFF" fillOpacity={0.15} />
      <Ellipse cx={VW/2} cy={124} rx={60} ry={6} fill="#FFAA00" fillOpacity={0.1} />
      {[...Array(14)].map((_, i) => (
        <Circle key={i} cx={20 + i * 21} cy={15 + (i % 4) * 8} r={1.5}
          fill="#FFAA00" fillOpacity={0.3 + (i % 3) * 0.2} />
      ))}
    </Svg>
  );
}

export const FOLHINHA_DATA: Record<string, {
  Art: (props: ArtProps) => React.ReactElement;
  accent: string;
  rotation: number;
}> = {
  'zé-do-beco':  { Art: ArteBeco,     accent: '#FFAA00', rotation: -1.2 },
  'luana-flow':  { Art: ArtePedreira, accent: '#9D00FF', rotation:  0.8 },
  'dread-beats': { Art: ArteComplexo, accent: '#FF5500', rotation: -0.6 },
  'fantasma':    { Art: ArteSombras,  accent: '#9D00FF', rotation:  1.4 },
  'dona-cida':   { Art: ArteTrono,    accent: '#FFAA00', rotation: -0.5 },
};
