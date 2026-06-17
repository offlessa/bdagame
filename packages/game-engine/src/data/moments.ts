import { MomentCard } from '../types';

export const MOMENT_CARDS: MomentCard[] = [
  {
    id: 'plateia-em-peso',
    name: 'Plateia em Peso',
    description: 'A plateia está fazendo muito barulho! MCs com 2 ou menos estrelas de hype ganham +2 em Presença.',
    effect: {
      target: 'low_hype',
      attribute: 'presenca',
      modifier: 2,
      description: 'MCs com hype ≤ 2 ganham +2 em Presença',
    },
  },
  {
    id: 'microfone-falhou',
    name: 'Microfone Falhou',
    description: 'O microfone deu pane! O atacante perde -2 em Flow neste round.',
    effect: {
      target: 'attacker',
      attribute: 'flow',
      modifier: -2,
      description: 'Atacante perde -2 em Flow',
    },
  },
  {
    id: 'torcida-organizada',
    name: 'Torcida Organizada',
    description: 'Uma torcida ensandecida apoia o defensor: +2 em Frieza.',
    effect: {
      target: 'defender',
      attribute: 'frieza',
      modifier: 2,
      description: 'Defensor ganha +2 em Frieza',
    },
  },
  {
    id: 'freestyle-surpresa',
    name: 'Freestyle Surpresa',
    description: 'Ambos ganham +1 em Punchline — quem estiver mais afiado domina.',
    effect: {
      target: 'both',
      attribute: 'punchline',
      modifier: 1,
      description: 'Ambos ganham +1 em Punchline',
    },
  },
  {
    id: 'duelo-tecnico',
    name: 'Duelo Técnico',
    description: 'Os juízes exigem técnica. Ambos ganham +1 em Técnica.',
    effect: {
      target: 'both',
      attribute: 'tecnica',
      modifier: 1,
      description: 'Ambos ganham +1 em Técnica',
    },
  },
  {
    id: 'calor-do-momento',
    name: 'Calor do Momento',
    description: 'A tensão sobe. O defensor ganha +2 em Punchline.',
    effect: {
      target: 'defender',
      attribute: 'punchline',
      modifier: 2,
      description: 'Defensor ganha +2 em Punchline',
    },
  },
  {
    id: 'silencio-total',
    name: 'Silêncio Total',
    description: 'A plateia cala. Presença não conta — ambos perdem -2 em Presença.',
    effect: {
      target: 'both',
      attribute: 'presenca',
      modifier: -2,
      description: 'Ambos perdem -2 em Presença',
    },
  },
  {
    id: 'raiz-do-rap',
    name: 'Raiz do Rap',
    description: 'MCs com hype máximo (3 estrelas) ganham +1 em Flow.',
    effect: {
      target: 'high_hype',
      attribute: 'flow',
      modifier: 1,
      description: 'MCs com hype 3 ganham +1 em Flow',
    },
  },
  {
    id: 'pressao-da-aldeia',
    name: 'Pressão da Aldeia',
    description: 'O atacante sente a pressão e ganha +3 em Inteligência.',
    effect: {
      target: 'attacker',
      attribute: 'inteligencia',
      modifier: 3,
      description: 'Atacante ganha +3 em Inteligência',
    },
  },
  {
    id: 'momento-zero',
    name: 'Momento Zero',
    description: 'Nenhum efeito neste round. As cartas falam por si mesmas.',
    effect: {
      target: 'both',
      modifier: 0,
      description: 'Sem efeito',
    },
  },
];
