import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/authStore';
import { router } from 'expo-router';

export default function RootLayout() {
  const { loadFromStorage, token } = useAuthStore();

  useEffect(() => {
    loadFromStorage().then(() => {
      if (!useAuthStore.getState().token) router.replace('/');
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
