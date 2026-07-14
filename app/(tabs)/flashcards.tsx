import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Layers,
  Plus,
  X,
  Check,
  AlertCircle,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useSubjects } from '@/lib/use-subjects';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Flashcard } from '@/lib/types';
import { generateFlashcards } from '@/lib/ai-engine';

type Mode = 'list' | 'review' | 'create';

const MAX_INTERVAL = 30;

export default function FlashcardsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { subjects } = useSubjects();

  const [mode, setMode] = useState<Mode>('list');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiSubjectId, setAiSubjectId] = useState<string | null>(null);

  // Review state
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Create state
  const [createFront, setCreateFront] = useState('');
  const [createBack, setCreateBack] = useState('');
  const [createSubjectId, setCreateSubjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCards = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('flashcards')
      .select('*, subject:subjects(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCards(data as unknown as Flashcard[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Derived: due cards
  const todayStr = new Date().toISOString().slice(0, 10);
  const dueCards = cards.filter(
    (c) => c.next_review_date && c.next_review_date.slice(0, 10) <= todayStr
  );
  const dueCount = dueCards.length;

  const startReview = () => {
    if (dueCount === 0) return;
    setReviewQueue(dueCards);
    setReviewIndex(0);
    setShowAnswer(false);
    setMode('review');
  };

  const exitReview = () => {
    setMode('list');
    setReviewQueue([]);
    setReviewIndex(0);
    setShowAnswer(false);
  };

  const updateCardReview = async (
    card: Flashcard,
    gotIt: boolean
  ) => {
    if (!user) return;
    const newInterval = gotIt
      ? Math.min(Math.max(card.interval_days * 2, 1), MAX_INTERVAL)
      : 1;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newInterval);
    const nextReviewDate = nextDate.toISOString().slice(0, 10);

    const updates = {
      interval_days: newInterval,
      next_review_date: nextReviewDate,
      review_count: card.review_count + 1,
      is_difficult: !gotIt,
    };

    // Optimistic update
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, ...updates } : c))
    );

    await supabase.from('flashcards').update(updates).eq('id', card.id);

    // Advance
    const nextIndex = reviewIndex + 1;
    if (nextIndex >= reviewQueue.length) {
      Alert.alert(
        'Review Complete! 🎉',
        `You reviewed all ${reviewQueue.length} card${reviewQueue.length === 1 ? '' : 's'}. Keep up the great work!`,
        [{ text: 'Done', onPress: exitReview }]
      );
    } else {
      setReviewIndex(nextIndex);
      setShowAnswer(false);
    }
  };

  const handleDelete = (card: Flashcard) => {
    Alert.alert(
      'Delete Flashcard',
      'Are you sure you want to delete this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setCards((prev) => prev.filter((c) => c.id !== card.id));
            await supabase.from('flashcards').delete().eq('id', card.id);
          },
        },
      ]
    );
  };

  const handleGenerate = async () => {
    if (!user || !aiSubjectId) return;
    const subject = subjects.find((s) => s.id === aiSubjectId);
    if (!subject) return;

    setGenerating(true);
    try {
      const generated = generateFlashcards(subject.name);
      const rows = generated.map((g) => ({
        user_id: user.id,
        subject_id: aiSubjectId,
        front: g.front,
        back: g.back,
        difficulty: 'medium',
        interval_days: 1,
        next_review_date: todayStr,
        review_count: 0,
        is_difficult: false,
      }));

      const { data, error } = await supabase
        .from('flashcards')
        .insert(rows)
        .select('*, subject:subjects(*)');

      if (!error && data) {
        setCards((prev) => [...(data as unknown as Flashcard[]), ...prev]);
        Alert.alert(
          'Flashcards Generated! ✨',
          `${generated.length} new flashcards added for ${subject.name}.`
        );
      } else {
        Alert.alert('Error', 'Failed to generate flashcards. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    setGenerating(false);
  };

  const openCreate = () => {
    setCreateFront('');
    setCreateBack('');
    setCreateSubjectId(null);
    setMode('create');
  };

  const handleCreateSave = async () => {
    if (!user) return;
    if (!createFront.trim() || !createBack.trim()) return;

    setSaving(true);
    const row = {
      user_id: user.id,
      subject_id: createSubjectId,
      front: createFront.trim(),
      back: createBack.trim(),
      difficulty: 'medium',
      interval_days: 1,
      next_review_date: todayStr,
      review_count: 0,
      is_difficult: false,
    };

    const { data, error } = await supabase
      .from('flashcards')
      .insert(row)
      .select('*, subject:subjects(*)')
      .single();

    if (!error && data) {
      setCards((prev) => [data as unknown as Flashcard, ...prev]);
      setMode('list');
    } else {
      Alert.alert('Error', 'Failed to save flashcard. Please try again.');
    }
    setSaving(false);
  };

  // ---------- Review Mode ----------
  if (mode === 'review') {
    const current = reviewQueue[reviewIndex];
    if (!current) {
      exitReview();
      return null;
    }

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Review header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={exitReview}
            style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Review {reviewIndex + 1}/{reviewQueue.length}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {current.subject?.name ?? 'General'}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((reviewIndex) / reviewQueue.length) * 100}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>

        <ScrollView
          style={styles.reviewBody}
          contentContainerStyle={styles.reviewBodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Flashcard */}
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => setShowAnswer((v) => !v)}
          >
            <Card
              style={[
                styles.flashcard,
                {
                  backgroundColor: showAnswer
                    ? colors.secondaryLight
                    : colors.card,
                  borderColor: showAnswer ? colors.secondary : colors.border,
                },
              ]}
            >
              <View style={styles.flashcardBadgeRow}>
                <View
                  style={[
                    styles.flashcardBadge,
                    {
                      backgroundColor: showAnswer
                        ? colors.secondary
                        : colors.primary,
                    },
                  ]}
                >
                  {showAnswer ? (
                    <Check size={12} color="#FFFFFF" />
                  ) : (
                    <BookOpen size={12} color="#FFFFFF" />
                  )}
                  <Text style={styles.flashcardBadgeText}>
                    {showAnswer ? 'ANSWER' : 'QUESTION'}
                  </Text>
                </View>
                {current.is_difficult && (
                  <View
                    style={[styles.difficultPill, { backgroundColor: colors.errorLight }]}
                  >
                    <AlertCircle size={11} color={colors.error} />
                    <Text style={[styles.difficultPillText, { color: colors.error }]}>
                      Difficult
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[styles.flashcardText, { color: colors.text }]}
              >
                {showAnswer ? current.back : current.front}
              </Text>

              <Text style={[styles.flipHint, { color: colors.textTertiary }]}>
                Tap to flip
              </Text>
            </Card>
          </TouchableOpacity>

          {/* Action buttons */}
          <View style={styles.reviewActions}>
            <TouchableOpacity
              style={[
                styles.reviewActionBtn,
                { backgroundColor: colors.error, borderColor: colors.error },
              ]}
              onPress={() => updateCardReview(current, false)}
              activeOpacity={0.8}
            >
              <X size={20} color="#FFFFFF" />
              <Text style={styles.reviewActionText}>Need Practice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.reviewActionBtn,
                { backgroundColor: colors.success, borderColor: colors.success },
              ]}
              onPress={() => updateCardReview(current, true)}
              activeOpacity={0.8}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.reviewActionText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ---------- List Mode ----------
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
        <View style={styles.headerLeft}>
          <View style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}>
            <Layers size={22} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Flashcards
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {cards.length} {cards.length === 1 ? 'card' : 'cards'} · {dueCount} due
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Review Due banner */}
        {dueCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={startReview}
          >
            <View
              style={[
                styles.dueBanner,
                { backgroundColor: colors.primaryLight, borderColor: colors.primary },
              ]}
            >
              <View style={[styles.dueBannerIcon, { backgroundColor: colors.primary }]}>
                <Layers size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dueBannerTitle, { color: colors.primaryDark }]}>
                  {dueCount} card{dueCount === 1 ? '' : 's'} due for review
                </Text>
                <Text style={[styles.dueBannerSub, { color: colors.primary }]}>
                  Tap to start your review session
                </Text>
              </View>
              <ChevronRight size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Create Card button */}
        <Button
          variant="outline"
          onPress={openCreate}
          style={styles.createBtn}
        >
          <Plus size={18} color={colors.primary} /> Create Card
        </Button>

        {/* AI Flashcard Generator */}
        <Card style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={[styles.aiIcon, { backgroundColor: colors.primaryLight }]}>
              <Sparkles size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiTitle, { color: colors.text }]}>
                AI Flashcard Generator
              </Text>
              <Text style={[styles.aiSub, { color: colors.textSecondary }]}>
                Pick a subject and generate cards instantly
              </Text>
            </View>
          </View>

          {/* Subject chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subjectChips}
          >
            {subjects.map((s) => {
              const selected = aiSubjectId === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.subjectChip,
                    selected && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                    !selected && {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setAiSubjectId(s.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.subjectChipText,
                      { color: selected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {s.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Button
            variant="primary"
            onPress={handleGenerate}
            disabled={!aiSubjectId}
            loading={generating}
            style={styles.generateBtn}
          >
            {generating ? 'Generating...' : 'Generate Flashcards'}
          </Button>
        </Card>

        {/* All Cards */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          All Cards
        </Text>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.centerContent}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
              <Layers size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No flashcards yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Create a card manually or let AI generate some for you
            </Text>
          </View>
        ) : (
          cards.map((card) => (
            <Card key={card.id} style={styles.cardItem}>
              <View style={styles.cardItemHeader}>
                <View style={styles.cardItemTags}>
                  {card.subject && (
                    <View style={[styles.subjectTag, { backgroundColor: colors.primaryLight }]}>
                      <BookOpen size={11} color={colors.primary} />
                      <Text
                        style={[styles.subjectTagText, { color: colors.primary }]}
                        numberOfLines={1}
                      >
                        {card.subject.name}
                      </Text>
                    </View>
                  )}
                  {card.is_difficult && (
                    <View style={[styles.difficultTag, { backgroundColor: colors.errorLight }]}>
                      <AlertCircle size={11} color={colors.error} />
                      <Text style={[styles.difficultTagText, { color: colors.error }]}>
                        Difficult
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(card)}
                  activeOpacity={0.6}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.cardFront, { color: colors.text }]} numberOfLines={3}>
                {card.front}
              </Text>
              <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.cardBack, { color: colors.textSecondary }]} numberOfLines={3}>
                {card.back}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={mode === 'create'}
        animationType="slide"
        transparent
        onRequestClose={() => setMode('list')}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            {/* Modal header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                New Flashcard
              </Text>
              <TouchableOpacity
                onPress={() => setMode('list')}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceSecondary }]}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Front (Question) */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Front (Question)
              </Text>
              <TextInput
                style={[
                  styles.multilineInput,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={createFront}
                onChangeText={setCreateFront}
                placeholder="Enter the question..."
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
              />

              {/* Back (Answer) */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Back (Answer)
              </Text>
              <TextInput
                style={[
                  styles.multilineInput,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={createBack}
                onChangeText={setCreateBack}
                placeholder="Enter the answer..."
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
              />

              {/* Subject picker */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Subject
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subjectChips}
              >
                <TouchableOpacity
                  style={[
                    styles.subjectChip,
                    createSubjectId === null && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                    createSubjectId !== null && {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setCreateSubjectId(null)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.subjectChipText,
                      { color: createSubjectId === null ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    None
                  </Text>
                </TouchableOpacity>
                {subjects.map((s) => {
                  const selected = createSubjectId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.subjectChip,
                        selected && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                        !selected && {
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setCreateSubjectId(s.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.subjectChipText,
                          { color: selected ? '#FFFFFF' : colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </ScrollView>

            {/* Save button */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Button
                variant="primary"
                onPress={handleCreateSave}
                loading={saving}
                disabled={!createFront.trim() || !createBack.trim()}
                style={styles.saveBtn}
              >
                Save Flashcard
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------- Styles ----------

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
  headerLeft: {
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
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  dueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  dueBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueBannerTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    marginBottom: 2,
  },
  dueBannerSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  aiCard: {
    marginBottom: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    marginBottom: 2,
  },
  aiSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  subjectChips: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  subjectChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
  },
  subjectChipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  generateBtn: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  cardItem: {
    marginBottom: 12,
    padding: 16,
  },
  cardItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardItemTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    maxWidth: 140,
  },
  subjectTagText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  difficultTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  difficultTagText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  cardFront: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    lineHeight: 21,
  },
  cardDivider: {
    height: 1,
    marginVertical: 10,
  },
  cardBack: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  // Review mode
  reviewBody: {
    flex: 1,
  },
  reviewBodyContent: {
    padding: 20,
    paddingBottom: 32,
  },
  flashcard: {
    minHeight: 280,
    padding: 24,
    borderWidth: 2,
    justifyContent: 'space-between',
  },
  flashcardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flashcardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  flashcardBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#FFFFFF',
  },
  difficultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  difficultPillText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  flashcardText: {
    fontSize: 22,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    lineHeight: 30,
    textAlign: 'center',
    paddingVertical: 20,
  },
  flipHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  reviewActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  reviewActionText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    maxHeight: 420,
  },
  modalBodyContent: {
    padding: 20,
    gap: 8,
    paddingBottom: 12,
    flexGrow: 1,
    minHeight: 200,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    marginBottom: 4,
  },
  multilineInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    minHeight: 100,
    marginBottom: 16,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 50,
  },
});
