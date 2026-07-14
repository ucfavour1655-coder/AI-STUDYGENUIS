import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  PenLine,
  Sparkles,
  FileText,
  List,
  BookMarked,
  Copy,
  Check,
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme-context';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import {
  improveWriting,
  summarizeText,
  generateOutline,
  generateStudyGuide,
} from '@/lib/ai-engine';

type Tool = 'improve' | 'summarize' | 'outline' | 'guide';
type ViewMode = 'menu' | Tool;

interface ToolConfig {
  key: Tool;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  inputLabel: string;
  placeholder: string;
}

export default function WritingScreen() {
  const { colors } = useTheme();
  const [view, setView] = useState<ViewMode>('menu');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const toolConfigs: Record<Tool, ToolConfig> = {
    improve: {
      key: 'improve',
      label: 'Improve Writing',
      description: 'Fix grammar and polish your text',
      icon: <PenLine size={24} color="#FFFFFF" />,
      color: colors.primary,
      bgColor: colors.primaryLight,
      inputLabel: 'Enter your text:',
      placeholder: 'Paste or type the text you want to improve...',
    },
    summarize: {
      key: 'summarize',
      label: 'Summarize Text',
      description: 'Get key points from long text',
      icon: <FileText size={24} color="#FFFFFF" />,
      color: colors.secondary,
      bgColor: colors.secondaryLight,
      inputLabel: 'Enter your text:',
      placeholder: 'Paste the text you want to summarize...',
    },
    outline: {
      key: 'outline',
      label: 'Generate Outline',
      description: 'Create structured outlines',
      icon: <List size={24} color="#FFFFFF" />,
      color: colors.accent,
      bgColor: colors.warningLight,
      inputLabel: 'Enter a topic:',
      placeholder: 'e.g. The French Revolution, Climate Change...',
    },
    guide: {
      key: 'guide',
      label: 'Create Study Guide',
      description: 'Generate study guides for topics',
      icon: <BookMarked size={24} color="#FFFFFF" />,
      color: '#8B5CF6',
      bgColor: '#EDE9FE',
      inputLabel: 'Enter a topic:',
      placeholder: 'e.g. Photosynthesis, World War II...',
    },
  };

  const menuItems: ToolConfig[] = [
    toolConfigs.improve,
    toolConfigs.summarize,
    toolConfigs.outline,
    toolConfigs.guide,
  ];

  const handleGenerate = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    setOutput('');
    setCopied(false);

    // Simulate brief processing for UX
    setTimeout(() => {
      let result = '';
      switch (view) {
        case 'improve':
          result = improveWriting(trimmed);
          break;
        case 'summarize':
          result = summarizeText(trimmed);
          break;
        case 'outline':
          result = generateOutline(trimmed);
          break;
        case 'guide':
          result = generateStudyGuide(trimmed);
          break;
      }
      setOutput(result);
      setLoading(false);
    }, 400);
  };

  const handleCopy = () => {
    if (!output) return;
    // Clipboard copy would go here; for now just toggle the check state
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectTool = (tool: Tool) => {
    setView(tool);
    setInput('');
    setOutput('');
    setCopied(false);
  };

  const goBack = () => {
    setView('menu');
    setInput('');
    setOutput('');
    setCopied(false);
  };

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      {/* Header */}
      <View style={styles.menuHeader}>
        <View
          style={[
            styles.menuHeaderIcon,
            { backgroundColor: colors.primaryLight },
          ]}
        >
          <PenLine size={32} color={colors.primary} />
        </View>
        <Text style={[styles.menuTitle, { color: colors.text }]}>
          Writing Assistant
        </Text>
        <Text
          style={[styles.menuSubtitle, { color: colors.textSecondary }]}
        >
          AI-powered tools to improve your writing
        </Text>
      </View>

      {/* Tool cards */}
      <View style={styles.toolList}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.7}
            onPress={() => selectTool(item.key)}
          >
            <Card style={styles.toolCard}>
              <View style={styles.toolCardContent}>
                <View
                  style={[
                    styles.toolIconWrap,
                    { backgroundColor: item.color },
                  ]}
                >
                  {item.icon}
                </View>
                <View style={styles.toolInfo}>
                  <Text
                    style={[styles.toolLabel, { color: colors.text }]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.toolDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.description}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderToolView = () => {
    const config = toolConfigs[view as Tool];
    if (!config) return null;

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.toolScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Tool header */}
          <View style={styles.toolHeaderRow}>
            <View
              style={[
                styles.toolHeaderIcon,
                { backgroundColor: config.color },
              ]}
            >
              {config.icon}
            </View>
            <View style={styles.toolHeaderText}>
              <Text
                style={[styles.toolHeaderLabel, { color: colors.text }]}
              >
                {config.label}
              </Text>
              <Text
                style={[
                  styles.toolHeaderDesc,
                  { color: colors.textSecondary },
                ]}
              >
                {config.description}
              </Text>
            </View>
          </View>

          {/* Input */}
          <View style={styles.inputSection}>
            <Text
              style={[styles.inputLabel, { color: colors.text }]}
            >
              {config.inputLabel}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                  minHeight: 140,
                },
              ]}
              value={input}
              onChangeText={setInput}
              placeholder={config.placeholder}
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Generate button */}
          <Button
            onPress={handleGenerate}
            disabled={!input.trim() || loading}
            loading={loading}
            style={styles.generateButton}
          >
            <View style={styles.generateButtonContent}>
              {loading ? null : (
                <Sparkles size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.generateButtonText}>
                {loading ? 'Generating...' : 'Generate'}
              </Text>
            </View>
          </Button>

          {/* Output */}
          {(loading || output) && (
            <View style={styles.outputSection}>
              <View style={styles.outputHeader}>
                <Text
                  style={[styles.outputTitle, { color: colors.text }]}
                >
                  Result
                </Text>
                {output ? (
                  <TouchableOpacity
                    onPress={handleCopy}
                    activeOpacity={0.7}
                    style={[
                      styles.copyButton,
                      { borderColor: colors.border },
                    ]}
                  >
                    {copied ? (
                      <Check size={16} color={colors.secondary} />
                    ) : (
                      <Copy size={16} color={colors.textSecondary} />
                    )}
                    <Text
                      style={[
                        styles.copyText,
                        {
                          color: copied ? colors.secondary : colors.textSecondary,
                        },
                      ]}
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {loading ? (
                <Card style={styles.outputCard}>
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text
                      style={[
                        styles.loadingText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Analyzing your input...
                    </Text>
                  </View>
                </Card>
              ) : (
                <Card style={styles.outputCard}>
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    <Text
                      style={[styles.outputText, { color: colors.text }]}
                    >
                      {output}
                    </Text>
                  </ScrollView>
                </Card>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {view !== 'menu' ? (
          <TouchableOpacity
            onPress={goBack}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>
              ‹ Back
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <Text style={[styles.topBarTitle, { color: colors.text }]}>
          {view === 'menu' ? 'Writing Assistant' : toolConfigs[view as Tool]?.label}
        </Text>
        <View style={styles.backButton} />
      </View>

      {view === 'menu' ? renderMenu() : renderToolView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  backButton: {
    minWidth: 60,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  menuContainer: {
    flex: 1,
  },
  menuHeader: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  menuHeaderIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  menuSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  toolList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  toolCard: {
    padding: 16,
  },
  toolCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toolIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  toolScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  toolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  toolHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolHeaderText: {
    flex: 1,
  },
  toolHeaderLabel: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    marginBottom: 2,
  },
  toolHeaderDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  generateButton: {
    marginBottom: 24,
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  outputSection: {
    marginBottom: 16,
  },
  outputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  outputTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  copyText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  outputCard: {
    padding: 16,
    minHeight: 80,
  },
  outputText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
