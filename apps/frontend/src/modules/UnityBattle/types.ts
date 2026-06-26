import { CharacterLook } from '../../store/characterStore';

// React Native → Unity
export type RNToUnityMessage =
  | {
      type: 'START_BATTLE';
      payload: {
        playerLook: CharacterLook;
        playerName: string;
        opponentName: string;
        track: string;      // nome da música/beat
        difficulty: 'easy' | 'medium' | 'hard';
      };
    }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'QUIT' };

// Unity → React Native
export type UnityToRNMessage =
  | { type: 'READY' }
  | { type: 'BATTLE_START' }
  | {
      type: 'BATTLE_RESULT';
      payload: {
        winner: 'player' | 'opponent';
        scores: {
          flow: number;       // 0-10
          punchline: number;  // 0-10
          presenca: number;   // 0-10
        };
        crowd: number;        // 0-100
        combo: number;
        perfect: number;
      };
    }
  | { type: 'PLAYER_QUIT' };
