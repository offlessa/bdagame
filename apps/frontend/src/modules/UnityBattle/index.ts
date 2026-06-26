import { RNToUnityMessage, UnityToRNMessage } from './types';

// GameObject name no Unity que recebe mensagens
const UNITY_GAME_OBJECT = 'ReactBridge';

export function sendToUnity(
  unityRef: React.RefObject<any>,
  message: RNToUnityMessage,
) {
  unityRef.current?.postMessage(
    UNITY_GAME_OBJECT,
    'OnReactMessage',
    JSON.stringify(message),
  );
}

export function parseUnityMessage(raw: string): UnityToRNMessage | null {
  try {
    return JSON.parse(raw) as UnityToRNMessage;
  } catch {
    return null;
  }
}

export type { RNToUnityMessage, UnityToRNMessage };
