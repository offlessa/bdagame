// Fonte principal hip-hop/graffiti do jogo
export const GRAFFITI = 'BebasNeue_400Regular';

// Helper para estilo de texto com a fonte graffiti
export function graffiti(size: number, letterSpacing = 2): object {
  return {
    fontFamily: GRAFFITI,
    fontSize: size,
    letterSpacing,
  };
}
