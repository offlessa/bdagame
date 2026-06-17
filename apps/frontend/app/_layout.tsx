import { useEffect } from 'react';
import { Stack, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/authStore';
import { router } from 'expo-router';

const PUBLIC_ROUTES = ['index', 'register'];

export default function RootLayout() {
  const { loadFromStorage } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    loadFromStorage().then(() => {
      const currentRoute = segments[0] ?? 'index';
      const isPublic = PUBLIC_ROUTES.includes(currentRoute);
      if (!isPublic && !useAuthStore.getState().token) {
        router.replace('/');
      }
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
