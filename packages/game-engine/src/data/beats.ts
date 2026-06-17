import { BeatCard } from '../types';

export const BEAT_CARDS: BeatCard[] = [
  {
    id: 'beat-trap',
    name: 'Beat de Trap',
    description: 'Beat moderno focado em ritmo e presença de palco.',
    hype: 3,
    effects: [
      { attribute: 'flow', modifier: 2 },
      { attribute: 'presenca', modifier: 1 },
      { attribute: 'inteligencia', modifier: -1 },
    ],
  },
  {
    id: 'beat-old-school',
    name: 'Beat Old School',
    description: 'Clássico do hip-hop, valoriza técnica e inteligência.',
    hype: 2,
    effects: [
      { attribute: 'tecnica', modifier: 2 },
      { attribute: 'inteligencia', modifier: 2 },
      { attribute: 'flow', modifier: -1 },
    ],
  },
  {
    id: 'beat-freestyle',
    name: 'Beat Freestyle',
    description: 'Improvisação pura, recompensa quem tem punchline afiada.',
    hype: 2,
    effects: [
      { attribute: 'punchline', modifier: 3 },
      { attribute: 'frieza', modifier: -1 },
    ],
  },
  {
    id: 'beat-boom-bap',
    name: 'Beat Boom Bap',
    description: 'Batida pesada que favorece frieza e presença.',
    hype: 2,
    effects: [
      { attribute: 'frieza', modifier: 2 },
      { attribute: 'presenca', modifier: 1 },
      { attribute: 'punchline', modifier: -1 },
    ],
  },
  {
    id: 'beat-drill',
    name: 'Beat Drill',
    description: 'Intensidade máxima, quem mantém a frieza domina.',
    hype: 3,
    effects: [
      { attribute: 'frieza', modifier: 3 },
      { attribute: 'tecnica', modifier: -1 },
      { attribute: 'inteligencia', modifier: -1 },
    ],
  },
  {
    id: 'beat-samba-rap',
    name: 'Beat Samba Rap',
    description: 'Fusão brasileira que recompensa flow e presença.',
    hype: 1,
    effects: [
      { attribute: 'flow', modifier: 1 },
      { attribute: 'presenca', modifier: 2 },
    ],
  },
  {
    id: 'beat-instrumental',
    name: 'Beat Instrumental',
    description: 'Sem batida dominante — todo atributo vale igual.',
    hype: 1,
    effects: [],
  },
  {
    id: 'beat-conscious',
    name: 'Beat Conscious',
    description: 'Profundidade lírica acima de tudo.',
    hype: 2,
    effects: [
      { attribute: 'inteligencia', modifier: 3 },
      { attribute: 'punchline', modifier: 1 },
      { attribute: 'presenca', modifier: -2 },
    ],
  },
];
