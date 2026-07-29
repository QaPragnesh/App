import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWorkspace } from '../context/WorkspaceContext';

type Reaction = {
  emoji: string;
  sender: string;
};

type ChatMessage = {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  reactions?: Reaction[];
};

type TeamChatModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function TeamChatModal({ visible, onClose }: TeamChatModalProps) {
  const { workspace, displayName } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const chatKey = `@chat_${workspace?.id}`;

  const loadMessages = async () => {
    if (!workspace?.id) return;
    try {
      const stored = await AsyncStorage.getItem(chatKey);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.error('Error loading local chat messages:', e);
    }
  };

  useEffect(() => {
    if (visible && workspace?.id) {
      loadMessages();
    }
  }, [visible, workspace?.id]);

  const handleSend = async () => {
    if (!inputText.trim() || !workspace?.id) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: displayName,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputText('');

    try {
      await AsyncStorage.setItem(chatKey, JSON.stringify(updatedMessages));
    } catch (e) {
      console.error('Error saving message:', e);
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteMessage = async (id: string) => {
    const updatedMessages = messages.filter(m => m.id !== id);
    setMessages(updatedMessages);
    setSelectedMessage(null);
    try {
      await AsyncStorage.setItem(chatKey, JSON.stringify(updatedMessages));
    } catch (e) {
      console.error('Error deleting message:', e);
    }
  };

  const handleReaction = async (id: string, emoji: string) => {
    const updatedMessages = messages.map(m => {
      if (m.id === id) {
        const reactions: Reaction[] = (m.reactions || []).map(r => 
           typeof r === 'string' ? { emoji: r, sender: 'unknown' } : r
        );
        
        const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji && r.sender === displayName);
        
        if (existingReactionIndex >= 0) {
          reactions.splice(existingReactionIndex, 1);
        } else {
          reactions.push({ emoji, sender: displayName });
        }
        
        return { ...m, reactions };
      }
      return m;
    });
    setMessages(updatedMessages as ChatMessage[]);
    setSelectedMessage(null);
    try {
      await AsyncStorage.setItem(chatKey, JSON.stringify(updatedMessages));
    } catch (e) {
      console.error('Error adding reaction:', e);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.sender === displayName;

    const groupedReactions: { [emoji: string]: number } = {};
    if (item.reactions) {
      item.reactions.forEach(r => {
        const emoji = typeof r === 'string' ? r : r.emoji;
        groupedReactions[emoji] = (groupedReactions[emoji] || 0) + 1;
      });
    }

    const reactionKeys = Object.keys(groupedReactions);

    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperThem]}>
        {!isMe && <Text style={styles.senderName}>{item.sender}</Text>}
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => setSelectedMessage(item)}
          style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleThem]}
        >
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}>
            {item.text}
          </Text>
          <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextThem]}>
            {formatTime(item.timestamp)}
          </Text>
          {reactionKeys.length > 0 && (
            <View style={[styles.reactionsContainer, isMe ? styles.reactionsContainerMe : styles.reactionsContainerThem]}>
              {reactionKeys.map((emoji) => (
                <View key={emoji} style={styles.reactionBadge}>
                  <Text style={styles.reactionText}>{emoji}</Text>
                  {groupedReactions[emoji] > 1 && (
                    <Text style={styles.reactionCount}>{groupedReactions[emoji]}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.popup}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Team Chat</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={loadMessages}>
                <Ionicons name="refresh" size={20} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color="#A3A3A3" />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={styles.list}
            contentContainerStyle={styles.chatContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No messages yet. Say hello to your team!</Text>
            }
          />

          {showEmojiPicker && (
            <View style={styles.quickEmojiRow}>
              {['😀', '😂', '🔥', '👍', '❤️', '🎉', '😢', '😮'].map(emoji => (
                <TouchableOpacity 
                  key={emoji} 
                  style={styles.quickEmojiBtn}
                  onPress={() => setInputText(prev => prev + emoji)}
                >
                  <Text style={styles.quickEmojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.inputArea}>
            <TouchableOpacity
              style={styles.emojiToggleBtn}
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Ionicons name="happy-outline" size={24} color="#94A3B8" />
            </TouchableOpacity>
            <TextInput
              style={styles.inputBox}
              placeholder="Type a message..."
              placeholderTextColor="#64748B"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={20} color={inputText.trim() ? '#FFFFFF' : '#94A3B8'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      <Modal
        visible={!!selectedMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMessage(null)}
      >
        <TouchableOpacity style={styles.actionOverlay} activeOpacity={1} onPress={() => setSelectedMessage(null)}>
          <View style={styles.actionSheet}>
            <View style={styles.emojiRow}>
              {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
                <TouchableOpacity key={emoji} onPress={() => selectedMessage && handleReaction(selectedMessage.id, emoji)} style={styles.emojiBtn}>
                  <Text style={styles.emojiBtnText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => selectedMessage && handleDeleteMessage(selectedMessage.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteText}>Delete Message</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  popup: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  headerInfo: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
  },
  list: {
    flex: 1,
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyText: {
    color: '#737373',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  messageWrapperMe: {
    alignSelf: 'flex-end',
  },
  messageWrapperThem: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#A3A3A3',
    marginBottom: 4,
    marginLeft: 4,
    fontWeight: '600',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageBubbleMe: {
    backgroundColor: '#10B981',
    borderBottomRightRadius: 4,
  },
  messageBubbleThem: {
    backgroundColor: '#262626',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextThem: {
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeTextMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeTextThem: {
    color: '#737373',
  },
  inputArea: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: '#262626',
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
    alignItems: 'flex-end',
    gap: 12,
  },
  emojiToggleBtn: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickEmojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
  },
  quickEmojiBtn: {
    padding: 8,
  },
  quickEmojiText: {
    fontSize: 22,
  },
  inputBox: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#10B981',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#3A3A3A',
  },
  reactionsContainer: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    gap: 4,
    zIndex: 10,
  },
  reactionsContainerMe: {
    left: 10,
  },
  reactionsContainerThem: {
    right: 10,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reactionText: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 10,
    color: '#A3A3A3',
    fontWeight: 'bold',
  },
  actionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  actionSheet: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  emojiBtn: {
    padding: 8,
    backgroundColor: '#262626',
    borderRadius: 20,
  },
  emojiBtnText: {
    fontSize: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
