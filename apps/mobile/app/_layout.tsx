import '@/i18n/config'; // side-effect: initializes i18next before any screen mounts
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getToken } from '../lib/auth';
import { queryClient } from '../lib/query-client';
import { setUnauthorizedHandler } from '../lib/api';
import { I18nProvider } from '@/i18n/i18n-context';

const GREEN = '#1a7f37';

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
    <I18nProvider>
    <View style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: GREEN },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700', fontSize: 18 },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="animals/[id]"
            options={({ navigation }) => ({
              headerShown: true,
              title: 'Animal Detail',
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
                    size={26}
                    color="#fff"
                  />
                </TouchableOpacity>
              ),
            })}
          />
        </Stack>
        {!checked && (
          <View style={[StyleSheet.absoluteFill, styles.loading]}>
            <ActivityIndicator color="#1a7f37" size="large" />
          </View>
        )}
      </QueryClientProvider>
      <StatusBar style="light" backgroundColor={GREEN} />
    </View>
    </I18nProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  backBtn: { marginLeft: Platform.OS === 'ios' ? 0 : 4, padding: 2 },
});
