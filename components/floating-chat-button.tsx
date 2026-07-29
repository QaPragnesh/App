import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TeamChatModal } from './team-chat-modal';

export function FloatingChatButton() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <View style={styles.wrap} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setChatOpen(true)}
          activeOpacity={0.85}
          accessibilityLabel="Open team chat"
        >
          <MaterialIcons name="chat" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <TeamChatModal visible={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 20,
    bottom: 88,
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#059669',
  },
});
