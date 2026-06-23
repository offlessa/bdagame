import React from 'react';
import { CharacterLook } from '../store/characterStore';
import CharacterLayered from './CharacterLayered';

interface Props {
  look: CharacterLook;
  archetypeColor: string;
  size?: number;
}

export default function CharacterSVG({ look, size = 180 }: Props) {
  return <CharacterLayered look={look} size={size} />;
}
