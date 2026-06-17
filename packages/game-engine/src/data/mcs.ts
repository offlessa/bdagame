import { MCCard } from '../types';

export const MC_CARDS: MCCard[] = [
  {
    id: 'jotape',
    name: 'Jotape',
    country: 'BR',
    state: 'SP',
    archetype: 'ATACANTE',
    hype: 3,
    isMVP: true,
    attributes: { flow: 7, tecnica: 6, frieza: 5, inteligencia: 6, presenca: 8, punchline: 9 },
    fatality: {
      cost: 3,
      triggers: [
        { type: 'attacking', boost: { punchline: 3 } },
        { type: 'defending', boost: { frieza: 3 } },
      ],
      extra: { type: 'add_barra', value: 1 },
    },
  },
  {
    id: 'prado',
    name: 'Prado',
    country: 'BR',
    state: 'SP',
    archetype: 'ATACANTE',
    hype: 2,
    attributes: { flow: 6, tecnica: 5, frieza: 6, inteligencia: 6, presenca: 8, punchline: 8 },
    fatality: {
      cost: 3,
      triggers: [
        { type: 'if_attribute_chosen', attribute: 'presenca', boost: { presenca: 2, punchline: 2 } },
      ],
      extra: { type: 'add_barra', value: 1 },
    },
  },
  {
    id: 'magrao',
    name: 'Magrão',
    country: 'BR',
    state: 'SP',
    archetype: 'DOMINANTE',
    hype: 2,
    attributes: { flow: 6, tecnica: 5, frieza: 7, inteligencia: 6, presenca: 8, punchline: 6 },
    fatality: {
      cost: 3,
      triggers: [
        { type: 'choose_declared_attr', boost: 2 },
      ],
      extra: { type: 'add_barra_per_won_attr' },
    },
  },
  {
    id: 'xamuel',
    name: 'Xamuel',
    country: 'BR',
    state: 'RS',
    archetype: 'DINAMICO',
    hype: 3,
    attributes: { flow: 8, tecnica: 6, frieza: 5, inteligencia: 5, presenca: 8, punchline: 6 },
    fatality: {
      cost: 3,
      triggers: [
        { type: 'attacking', boost: { flow: 3 } },
        { type: 'defending', boost: { presenca: 2 } },
      ],
      extra: { type: 'add_hype', value: 1 },
    },
  },
  {
    id: 'big-mike',
    name: 'Big Mike',
    country: 'BR',
    state: 'SP',
    archetype: 'DOMINANTE',
    hype: 3,
    attributes: { flow: 5, tecnica: 6, frieza: 6, inteligencia: 7, presenca: 9, punchline: 8 },
    fatality: {
      cost: 3,
      triggers: [
        { type: 'responding', boost: { tecnica: 3 } },
      ],
      extra: { type: 'add_barra', value: 1 },
    },
  },
  {
    id: 'apollo',
    name: 'Apollo',
    country: 'BR',
    state: 'SP',
    archetype: 'TECNICO',
    hype: 3,
    isMVP: true,
    attributes: { flow: 6, tecnica: 9, frieza: 7, inteligencia: 6, presenca: 6, punchline: 7 },
    fatality: {
      cost: 3,
      triggers: [
        { type: 'after_opponent_declares', penalize_opponent_attr: true, penalty: 2 },
      ],
      extra: { type: 'draw_beats', value: 2 },
    },
  },
  {
    id: 'neo',
    name: 'Neo',
    country: 'BR',
    state: 'MG',
    archetype: 'CONTROLADOR',
    hype: 3,
    isMVP: true,
    attributes: { flow: 6, tecnica: 6, frieza: 9, inteligencia: 7, presenca: 6, punchline: 7 },
    fatality: {
      cost: 3,
      triggers: [
        { type: 'flat', boost: { presenca: 2, flow: 2 } },
      ],
      extra: { type: 'add_barra_if_win_by', threshold: 2, value: 1 },
    },
  },
];
