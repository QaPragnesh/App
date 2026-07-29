import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ONBOARDING_KEY = '@onboarding_complete';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PAGES = [
  {
    icon: 'wallet' as const,
    iconLib: 'ionicons' as const,
    color: '#10B981',
    title: 'Set Monthly Budget',
    description:
      'Set a monthly budget for your workspace and track spending in real time. Add expenses with categories, view history, and stay on top of your finances every month.',
    bullets: [
      'Set budget on the Budget tab',
      'Add expenses quickly',
      'See spending on Dashboard',
    ],
  },
  {
    icon: 'people' as const,
    iconLib: 'ionicons' as const,
    color: '#10B981',
    title: 'Add Members & Chat',
    description:
      'Invite family or team members to your workspace. Share a budget, track expenses together, and communicate instantly with the built-in team chat.',
    bullets: [
      'Owner adds members in Profile',
      'Share workspace name & login details',
      'Track team spending together',
      'Chat with your team in real time',
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  // Animated values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (direction: 'left' | 'right', callback: () => void) => {
    const toValue = direction === 'left' ? -SCREEN_WIDTH * 0.15 : SCREEN_WIDTH * 0.15;
    // Slide out + fade out + scale down
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.93,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      // Reset from opposite side
      slideAnim.setValue(-toValue * 0.6);
      // Slide in + fade in + scale up
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 120,
          friction: 9,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 9,
        }),
      ]).start();
    });
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/welcome');
  };

  const handleSkip = () => finishOnboarding();

  const handleNext = () => {
    if (page < PAGES.length - 1) {
      animateTransition('left', () => setPage((p) => p + 1));
    } else {
      finishOnboarding();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 20 && Math.abs(gs.dy) < 30,
      onPanResponderMove: (_, gs) => {
        // Prevent swiping right on first page and left on last page
        if ((gs.dx > 0 && page === 0) || (gs.dx < 0 && page === PAGES.length - 1)) {
          slideAnim.setValue(gs.dx * 0.2); // resistance effect
        } else {
          slideAnim.setValue(gs.dx);
          opacityAnim.setValue(1 - Math.abs(gs.dx) / (SCREEN_WIDTH * 1.5));
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -50 && page < PAGES.length - 1) {
          // Swipe left -> Next page
          Animated.parallel([
            Animated.timing(slideAnim, { toValue: -SCREEN_WIDTH * 0.5, duration: 150, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          ]).start(() => {
            setPage((p) => p + 1);
            slideAnim.setValue(SCREEN_WIDTH * 0.5);
            Animated.parallel([
              Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 9 }),
              Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true })
            ]).start();
          });
        } else if (gs.dx > 50 && page > 0) {
          // Swipe right -> Prev page
          Animated.parallel([
            Animated.timing(slideAnim, { toValue: SCREEN_WIDTH * 0.5, duration: 150, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          ]).start(() => {
            setPage((p) => p - 1);
            slideAnim.setValue(-SCREEN_WIDTH * 0.5);
            Animated.parallel([
              Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 9 }),
              Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true })
            ]).start();
          });
        } else {
          // Snap back if swipe wasn't far enough, or if hitting the boundary
          Animated.parallel([
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 9 }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true })
          ]).start();
        }
      },
    })
  ).current;

  const current = PAGES[page];

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      {/* Top bar — only Skip button now */}
      <View style={styles.topBar}>
        <View />
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Animated content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
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
      </Animated.View>

      {/* Footer — dots + next button */}
      <View style={styles.footer}>
        {/* Progress dots above button */}
        <View style={styles.dotsRow}>
          {PAGES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                if (i !== page) {
                  const dir = i > page ? 'left' : 'right';
                  animateTransition(dir, () => setPage(i));
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, i === page && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

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
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
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
    paddingTop: 16,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 28,
    borderWidth: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: '#A3A3A3',
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 24,
  },
  bulletCard: {
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletText: {
    flex: 1,
    color: '#E5E5E5',
    fontSize: 14,
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3A3A3A',
  },
  dotActive: {
    width: 28,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
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
