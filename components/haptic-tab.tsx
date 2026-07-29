import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Determine if this tab is the currently selected one
  const isSelected = props.accessibilityState?.selected;

  useEffect(() => {
    // Animate to slightly larger when selected, normal when not
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.15 : 1,
      useNativeDriver: true,
      friction: 5,
      tension: 80,
    }).start();
  }, [isSelected]);

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios' || process.env.EXPO_OS === 'android') {
          // Add a soft haptic feedback when pressing down on the tabs
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        // Bounce down effect on press
        Animated.spring(scaleAnim, {
           toValue: 0.85,
           useNativeDriver: true,
           friction: 5,
           tension: 100
        }).start();

        props.onPressIn?.(ev);
      }}
      onPressOut={(ev) => {
        // Bounce back up based on whether it is selected or not
        Animated.spring(scaleAnim, {
           toValue: isSelected ? 1.15 : 1,
           useNativeDriver: true,
           friction: 5,
           tension: 80
        }).start();
        props.onPressOut?.(ev);
      }}
      style={[
        props.style,
        {
          justifyContent: 'center',
          alignItems: 'center',
        }
      ]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', justifyContent: 'center' }}>
        {props.children}
      </Animated.View>
    </PlatformPressable>
  );
}
