import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, buttonHeight } from '../theme/colors';
import { getFitnessAIContext, sendFitnessChatMessage } from '../services/fitnessAiService';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface AIFitnessAssistantProps {
  visible: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  'How was my last workout?',
  'How many steps today?',
  'What should I track next?',
  'Am I on track today?',
];

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={styles.bubbleRow}>
      <View style={styles.aiAvatar}>
        <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
      </View>
      <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    </View>
  );
}

function SuggestionChip({ text, onPress }: { text: string; onPress: (t: string) => void }) {
  return (
    <TouchableOpacity style={styles.chip} onPress={() => onPress(text)} activeOpacity={0.7}>
      <Text style={styles.chipText} numberOfLines={2}>{text}</Text>
    </TouchableOpacity>
  );
}

export default function AIFitnessAssistant({ visible, onClose }: AIFitnessAssistantProps) {
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      setInputText('');
      setMessages([
        {
          id: 'welcome',
          role: 'ai',
          text: 'Hi! I am FitAI — your personal fitness assistant. Ask anything about workouts, calories, steps, water, nutrition, rest, and progress.',
        },
      ]);
    }
  }, [visible]);

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride || inputText).trim();
    if (!text || isLoading) return;

    Keyboard.dismiss();
    setInputText('');

    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const result = await sendFitnessChatMessage(text, getFitnessAIContext());

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: result.success
          ? (result.reply || 'No response.')
          : (result.error || 'AI assistant is not available right now. Please try again later.'),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: 'AI assistant is not available right now. Please try again later.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const showSuggestions = messages.length <= 1 && !isLoading;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>FitAI</Text>
            <Text style={styles.headerSubtitle}>Smart workout assistant</Text>
          </View>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.safetyBanner}>
          <MaterialIcons name="info-outline" size={14} color={colors.warning} />
          <Text style={styles.safetyText}>
            General fitness tips only — not medical advice. See a professional for health concerns.
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isLoading ? (
              <TypingIndicator />
            ) : showSuggestions ? (
              <View style={styles.suggestionsSection}>
                <Text style={styles.suggestionsLabel}>Suggested prompts</Text>
                <View style={styles.suggestionsRow}>
                  {SUGGESTIONS.map((s) => (
                    <SuggestionChip key={s} text={s} onPress={handleSend} />
                  ))}
                </View>
              </View>
            ) : null
          }
        />

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask FitAI anything..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              maxLength={500}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              blurOnSubmit
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
              onPress={() => handleSend()}
              activeOpacity={0.8}
              disabled={!inputText.trim() || isLoading}
            >
              <MaterialIcons
                name="send"
                size={20}
                color={!inputText.trim() || isLoading ? colors.textMuted : '#fff'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerSide: { width: 44 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  safetyBanner: {
    flexDirection: 'row',
    backgroundColor: colors.warning + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  safetyText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAI: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.xs,
  },
  bubbleAI: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { fontSize: fontSize.md, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextAI: { color: colors.text },
  typingBubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  suggestionsSection: { marginTop: spacing.md, marginBottom: spacing.lg },
  suggestionsLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
    maxWidth: 200,
  },
  inputContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  textInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.cardElevated },
});
