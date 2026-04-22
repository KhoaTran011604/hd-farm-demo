import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { getToken } from '../lib/auth';
import { queryClient } from '../lib/query-client';
import { setUnauthorizedHandler } from '../lib/api';

export default function RootLayout() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.clear();
      router.replace('/(auth)/login');
    });

    getToken().then((token) => {
      if (token) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
      setChecked(true);
    });
  }, [router]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        {!checked ? (
          <View style={styles.loading}>
            <ActivityIndicator color="#1a7f37" size="large" />
          </View>
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="animals/[id]" options={{ headerShown: true, title: 'Animal Detail' }} />
          </Stack>
        )}
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});
