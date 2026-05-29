import 'react-native-url-polyfill/auto';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ExpenseProvider } from '../context/ExpenseContext';
import { WorkspaceProvider, useWorkspace } from '../context/WorkspaceContext';

export const unstable_settings = {
  anchor: 'welcome',
};

function RootNavigation() {
  const { workspace, loading } = useWorkspace();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const isWelcome = segments[0] === 'welcome';
    
    if (!workspace && !isWelcome) {
      // Redirect to welcome screen if no workspace
      router.replace('/welcome');
    } else if (workspace && isWelcome) {
      // Redirect to tabs if already logged in
      router.replace('/(tabs)');
    }
  }, [workspace, loading, segments]);

  return (
    <Stack>
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
        <WorkspaceProvider>
          <ExpenseProvider>
            <RootNavigation />
          </ExpenseProvider>
        </WorkspaceProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
