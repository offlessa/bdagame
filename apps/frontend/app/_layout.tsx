import { useEffect } from 'react';
import { Stack, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/authStore';
import { useCharacterStore } from '../src/store/characterStore';
import { router } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  BebasNeue_400Regular,
} from '@expo-google-fonts/bebas-neue';

const PUBLIC_ROUTES = ['index', 'register', 'forgot-password'];

export default function RootLayout() {
  const { loadFromStorage } = useAuthStore();
  const { loadCharacter }   = useCharacterStore();
  const segments            = useSegments();

  const [fontsLoaded] = useFonts({ BebasNeue_400Regular });

  useEffect(() => {
    if (!fontsLoaded) return;

    async function init() {
      await loadFromStorage();
      const { token, userId } = useAuthStore.getState();
      const currentRoute = (segments[0] ?? 'index') as string;

      if (!token) {
        if (!PUBLIC_ROUTES.includes(currentRoute)) router.replace('/');
        return;
      }

      if (userId) await loadCharacter(userId);
      const { character } = useCharacterStore.getState();

      if (PUBLIC_ROUTES.includes(currentRoute)) {
        router.replace(character ? '/menu' : '/character-creation');
      }
    }
    init();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
