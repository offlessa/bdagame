import { useEffect } from 'react';
import { Stack, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/authStore';
import { useCharacterStore } from '../src/store/characterStore';
import { router } from 'expo-router';

const PUBLIC_ROUTES = ['index', 'register', 'forgot-password'];

export default function RootLayout() {
  const { loadFromStorage } = useAuthStore();
  const { loadCharacter } = useCharacterStore();
  const segments = useSegments();

  useEffect(() => {
    async function init() {
      await loadFromStorage();
      const { token, userId } = useAuthStore.getState();
      const currentRoute = (segments[0] ?? 'index') as string;

      if (!token) {
        if (!PUBLIC_ROUTES.includes(currentRoute)) router.replace('/');
        return;
      }

      // Autenticado — carrega personagem
      if (userId) await loadCharacter(userId);
      const { character } = useCharacterStore.getState();

      // Se estiver em rota pública (login/register), redireciona para o destino certo
      if (PUBLIC_ROUTES.includes(currentRoute)) {
        router.replace(character ? '/menu' : '/character-creation');
      }
    }
    init();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
