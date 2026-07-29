import 'react-native-url-polyfill/auto';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ExpenseProvider } from '../context/ExpenseContext';
import { WorkspaceProvider, useWorkspace } from '../context/WorkspaceContext';
import { AlertProvider } from '../context/AlertContext';

const ONBOARDING_KEY = '@onboarding_complete';

export const unstable_settings = {
  anchor: 'onboarding',
};

function RootNavigation() {
  const { workspace, loading } = useWorkspace();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setOnboardingComplete(value === 'true');
      setOnboardingChecked(true);
    });
  }, []);

  useEffect(() => {
    if (loading || !onboardingChecked) return;

    const segment = segments[0];
    const isOnboarding = segment === 'onboarding';
    const isWelcome = segment === 'welcome';

    if (!onboardingComplete && !isOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (onboardingComplete && isOnboarding) {
      router.replace(workspace ? '/(tabs)' : '/welcome');
      return;
    }

    if (!workspace && !isWelcome && !isOnboarding) {
      router.replace('/welcome');
    } else if (workspace && isWelcome) {
      router.replace('/(tabs)');
    }
  }, [workspace, loading, segments, onboardingComplete, onboardingChecked]);

  return (
    <Stack>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AlertProvider>
          <WorkspaceProvider>
            <ExpenseProvider>
              <RootNavigation />
            </ExpenseProvider>
          </WorkspaceProvider>
        </AlertProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
