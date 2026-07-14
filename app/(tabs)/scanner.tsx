import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  ScanLine,
  Camera,
  Image as ImageIcon,
  Sparkles,
  FileText,
  Send,
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme-context';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { generateHomeworkHelp } from '@/lib/ai-engine';

// Simulated OCR output — stands in for a real camera/library capture.
const SAMPLE_SCANNED_TEXT = `Photosynthesis

Photosynthesis is the process by which green plants, algae, and some bacteria
convert light energy into chemical energy stored in glucose.

The general equation is:
  6CO₂ + 6H₂O  --(light, chlorophyll)-->  C₆H₁₂O₆ + 6O₂

Key stages:
1. Light-dependent reactions (thylakoid membranes):
   - Chlorophyll absorbs light, splitting water into oxygen, H+ ions, and electrons.
   - Electrons move through the electron transport chain, producing ATP and NADPH.

2. Calvin cycle (stroma):
   - CO₂ is fixed by the enzyme RuBisCO into a 3-carbon compound.
   - ATP and NADPH from the light reactions drive the synthesis of glucose.

Factors affecting the rate of photosynthesis:
   - Light intensity
   - Carbon dioxide concentration
   - Temperature
   - Water availability`;

export default function ScannerScreen() {
  const { colors } = useTheme();
  const [scannedText, setScannedText] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = () => {
    // Simulated OCR — in production this would launch the camera or image picker
    // and run an OCR pass over the captured frame.
    setScannedText(SAMPLE_SCANNED_TEXT);
    setAnswer('');
  };

  const handleClear = () => {
    setScannedText('');
    setAnswer('');
    setQuestion('');
  };

  const handleAskAI = () => {
    const trimmed = question.trim();
    if (!trimmed || !scannedText || loading) return;

    setLoading(true);
    // Combine the student's question with the scanned text as context so the
    // homework helper can ground its answer in what was actually captured.
    const contextualized = `${trimmed}\n\nContext from scanned text:\n${scannedText}`;
    const result = generateHomeworkHelp(contextualized);
    setAnswer(result);
    setLoading(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View
          style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}
        >
          <ScanLine size={24} color={colors.primary} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          OCR Scanner
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: colors.textSecondary }]}
        >
          Scan textbooks and notes, then ask AI questions
        </Text>
      </View>

      {/* Web platform note */}
      {Platform.OS === 'web' && (
        <View
          style={[
            styles.platformNote,
            {
              backgroundColor: colors.warningLight,
              borderColor: colors.warning,
            },
          ]}
        >
          <Text
            style={[styles.platformNoteText, { color: colors.text }]}
          >
            Camera capture isn't available on web. A sample scan is used to
            demonstrate the OCR → AI workflow.
          </Text>
        </View>
      )}

      {/* Scan action buttons */}
      <View style={styles.scanButtons}>
        <TouchableOpacity
          style={[
            styles.scanButton,
            styles.scanButtonPrimary,
            { backgroundColor: colors.primary },
          ]}
          onPress={handleScan}
          activeOpacity={0.85}
        >
          <Camera size={22} color="#FFFFFF" />
          <Text style={styles.scanButtonTextPrimary}>Scan with Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.scanButton,
            styles.scanButtonOutline,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primary,
            },
          ]}
          onPress={handleScan}
          activeOpacity={0.85}
        >
          <ImageIcon size={22} color={colors.primary} />
          <Text style={[styles.scanButtonTextOutline, { color: colors.primary }]}>
            Upload Image
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scanned text card */}
      {scannedText ? (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <FileText size={18} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Scanned Text
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              activeOpacity={0.6}
            >
              <Text style={[styles.clearButtonText, { color: colors.error }]}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.scannedTextWrap,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.scannedText, { color: colors.text }]}>
              {scannedText}
            </Text>
          </View>
        </Card>
      ) : (
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}
          >
            <ScanLine size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No scan yet
          </Text>
          <Text
            style={[styles.emptySubtitle, { color: colors.textSecondary }]}
          >
            Use a button above to scan a page from your textbook or notes.
          </Text>
        </View>
      )}

      {/* Ask AI section */}
      {scannedText && (
        <Card style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View
              style={[
                styles.sectionIcon,
                { backgroundColor: colors.secondaryLight },
              ]}
            >
              <Sparkles size={18} color={colors.secondary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Ask AI
            </Text>
          </View>
          <TextInput
            style={[
              styles.questionInput,
              {
                backgroundColor: colors.surfaceSecondary,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask a question about the scanned content"
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={500}
            editable={!loading}
          />
          <Button
            onPress={handleAskAI}
            variant="primary"
            size="medium"
            disabled={!question.trim() || loading}
            loading={loading}
            style={styles.askButton}
          >
            <View style={styles.askButtonContent}>
              {loading ? null : <Sparkles size={18} color="#FFFFFF" />}
              <Text style={styles.askButtonText}>
                {loading ? 'Thinking…' : 'Ask AI'}
              </Text>
            </View>
          </Button>
        </Card>
      )}

      {/* AI answer card */}
      {answer ? (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: colors.secondaryLight },
                ]}
              >
                <Sparkles size={18} color={colors.secondary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                AI Answer
              </Text>
            </View>
          </View>
          <Text style={[styles.answerText, { color: colors.text }]}>
            {answer}
          </Text>
        </Card>
      ) : null}

      {/* Bottom padding */}
      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  platformNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  platformNoteText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    flex: 1,
  },
  scanButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  scanButtonPrimary: {
    // backgroundColor set inline
  },
  scanButtonOutline: {
    borderWidth: 2,
  },
  scanButtonTextPrimary: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scanButtonTextOutline: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  scannedTextWrap: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  scannedText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  questionInput: {
    minHeight: 80,
    maxHeight: 160,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  askButton: {
    alignSelf: 'stretch',
  },
  askButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  askButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  answerText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 40,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    height: 16,
  },
});
