import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Brain, Send, Sparkles, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { supabase } from '@/lib/supabase';
import { generateTutorResponse } from '@/lib/ai-engine';
import { logStudySession } from '@/lib/use-stats';
import { ChatMessage } from '@/lib/types';

const SUGGESTIONS = [
  'Explain photosynthesis',
  'What is the Pythagorean theorem?',
  'Solve 25 + 17',
  "Explain Newton's laws of motion",
];

export default function TutorScreen() {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ subject?: string }>();
  const subjectId = params.subject ?? null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const loadHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('chat_type', 'tutor')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as ChatMessage[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const persistMessage = async (
    role: 'user' | 'assistant',
    content: string
  ): Promise<ChatMessage | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('chat_history')
      .insert({
        user_id: user.id,
        chat_type: 'tutor',
        role,
        content,
        subject_id: subjectId,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error saving message:', error);
      return null;
    }
    return data as ChatMessage;
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !user || sending) return;

    setInput('');
    setSending(true);
    Keyboard.dismiss();

    // Optimistic user message
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      user_id: user.id,
      chat_type: 'tutor',
      role: 'user',
      content: trimmed,
      subject_id: subjectId,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    // Persist user message
    const savedUser = await persistMessage('user', trimmed);
    if (savedUser) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? savedUser : m))
      );
    }

    // Generate + persist assistant response
    const level = profile?.education_level || 'secondary';
    const aiText = generateTutorResponse(trimmed, level);

    const assistantOptimisticId = `temp-ai-${Date.now()}`;
    const assistantOptimistic: ChatMessage = {
      id: assistantOptimisticId,
      user_id: user.id,
      chat_type: 'tutor',
      role: 'assistant',
      content: aiText,
      subject_id: subjectId,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantOptimistic]);

    const savedAssistant = await persistMessage('assistant', aiText);
    if (savedAssistant) {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantOptimisticId ? savedAssistant : m))
      );
    }

    // Log study session for engagement tracking
    await logStudySession(user.id, subjectId, 5, 'tutor');

    setSending(false);
  };

  const clearChat = async () => {
    if (!user || messages.length === 0) return;
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', user.id)
      .eq('chat_type', 'tutor');

    if (!error) {
      setMessages([]);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowBot,
        ]}
      >
        {!isUser && (
          <View
            style={[
              styles.botAvatar,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Brain size={20} color={colors.primary} />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? [
                  styles.bubbleUser,
                  { backgroundColor: colors.primary },
                ]
              : [
                  styles.bubbleBot,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ],
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { color: isUser ? '#FFFFFF' : colors.text },
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <View
        style={[
          styles.welcomeIcon,
          { backgroundColor: colors.primaryLight },
        ]}
      >
        <Sparkles size={36} color={colors.primary} />
      </View>
      <Text style={[styles.welcomeTitle, { color: colors.text }]}>
        Hi! I'm your AI Tutor
      </Text>
      <Text
        style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}
      >
        Ask me anything about your studies. I can explain concepts, solve math
        problems, and help you understand any topic.
      </Text>
    </View>
  );

  const renderSuggestions = () => (
    <View style={styles.suggestionsContainer}>
      <Text
        style={[styles.suggestionsLabel, { color: colors.textSecondary }]}
      >
        Try asking:
      </Text>
      <View style={styles.suggestionsWrap}>
        {SUGGESTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.suggestionChip,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => sendMessage(s)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.suggestionText, { color: colors.primary }]}
              numberOfLines={1}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const showWelcome = messages.length === 0 && !loading;
  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerTitle}>
          <View
            style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}
          >
            <Brain size={22} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerText, { color: colors.text }]}>
              AI Tutor
            </Text>
            <Text
              style={[styles.headerSubtext, { color: colors.textSecondary }]}
            >
              Your personal study assistant
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={clearChat}
          style={styles.clearButton}
          disabled={messages.length === 0}
          activeOpacity={0.6}
        >
          <Trash2
            size={22}
            color={messages.length === 0 ? colors.textTertiary : colors.error}
          />
        </TouchableOpacity>
      </View>

      {/* Chat list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        ListHeaderComponent={
          <>
            {showWelcome && renderWelcome()}
            {showSuggestions && renderSuggestions()}
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : null
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceSecondary,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your tutor anything..."
            placeholderTextColor={colors.textTertiary}
            multiline
              maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: input.trim() ? colors.primary : colors.border,
              },
            ]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  headerSubtext: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  clearButton: {
    padding: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 14,
    maxWidth: '100%',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '78%',
  },
  bubbleUser: {
    borderBottomRightRadius: 6,
  },
  bubbleBot: {
    borderWidth: 1,
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  welcomeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionsContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  suggestionsLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    marginBottom: 10,
    marginLeft: 4,
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
