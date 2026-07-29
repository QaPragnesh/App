import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const ONBOARDING_KEY = '@onboarding_complete';

const PAGES = [
  {
    icon: 'wallet' as const,
    iconLib: 'ionicons' as const,
    color: '#F59E0B',
    title: 'Set Monthly Budget',
    description:
      'Set a monthly budget for your workspace and track spending in real time. Add expenses with categories, view history, and stay on top of your finances every month.',
    bullets: ['Set budget on the Budget tab', 'Add expenses quickly', 'See spending on Dashboard'],
  },
  {
    icon: 'people' as const,
    iconLib: 'ionicons' as const,
    color: '#10B981',
    title: 'Add Members',
    description:
      'Invite family or team members to your workspace. The owner can add members from Profile — everyone shares the same budget and expenses together.',
    bullets: ['Owner adds members in Profile', 'Share workspace name & login details', 'Track team spending together'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/welcome');
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const handleNext = () => {
    if (page < PAGES.length - 1) {
      setPage(page + 1);
    } else {
      finishOnboarding();
    }
  };

  const current = PAGES[page];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.iconCircle, { borderColor: current.color }]}>
          <Ionicons name={current.icon} size={48} color={current.color} />
        </View>

        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.description}>{current.description}</Text>

        <View style={styles.bulletCard}>
          {current.bullets.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <MaterialIcons name="check-circle" size={20} color={current.color} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>
            {page === PAGES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3A3A3A',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#F59E0B',
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    color: '#A3A3A3',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 32,
    borderWidth: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: '#A3A3A3',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  bulletCard: {
    backgroundColor: '#262626',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    gap: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  nextBtn: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
