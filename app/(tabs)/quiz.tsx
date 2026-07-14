import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useSubjects } from '@/lib/use-subjects';
import { supabase } from '@/lib/supabase';
import { generateQuiz } from '@/lib/ai-engine';
import { logStudySession } from '@/lib/use-stats';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { QuizQuestion, Quiz } from '@/lib/types';
import {
  ClipboardList,
  ChevronRight,
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
  Clock,
  ArrowLeft,
} from 'lucide-react-native';

type ScreenState = 'menu' | 'config' | 'taking' | 'results';
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: { label: string; value: Difficulty }[] = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

const QUESTION_COUNTS = [3, 5, 7, 10];

export default function QuizScreen() {
  const { colors } = useTheme();
  const { user, isGuest } = useAuth();
  const { subjects } = useSubjects();

  const [screenState, setScreenState] = useState<ScreenState>('menu');
  const [pastQuizzes, setPastQuizzes] = useState<Quiz[]>([]);
  const [loadingPast, setLoadingPast] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Config state
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [numQuestions, setNumQuestions] = useState(5);

  // Taking state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  // Results state
  const [score, setScore] = useState(0);

  const fetchPastQuizzes = useCallback(async () => {
    if (!user) {
      setLoadingPast(false);
      return;
    }
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, subject:subjects(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setPastQuizzes(data as unknown as Quiz[]);
    }
    setLoadingPast(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    fetchPastQuizzes();
  }, [fetchPastQuizzes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPastQuizzes();
  };

  const handleStartNewQuiz = () => {
    setScreenState('config');
    setSelectedSubject(null);
    setSelectedSubjectId(null);
    setDifficulty('medium');
    setNumQuestions(5);
  };

  const handleGenerateQuiz = async () => {
    if (!selectedSubject) return;
    setGenerating(true);
    // Simulate slight delay for UX feedback
    await new Promise((r) => setTimeout(r, 300));
    const generated = generateQuiz(selectedSubject, difficulty, numQuestions);
    setQuestions(generated);
    setCurrentIndex(0);
    setAnswers([]);
    setCurrentAnswer('');
    setSelectedOption(null);
    setGenerating(false);
    setScreenState('taking');
  };

  const handleNext = () => {
    const question = questions[currentIndex];
    let answer = '';

    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      if (selectedOption !== null && question.options) {
        answer = question.options[selectedOption];
      }
    } else {
      answer = currentAnswer.trim();
    }

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer('');
      setSelectedOption(null);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const finishQuiz = async (allAnswers: string[]) => {
    let finalScore = 0;
    questions.forEach((q, i) => {
      const userAnswer = (allAnswers[i] || '').toLowerCase().trim();
      const correct = q.correct_answer.toLowerCase().trim();
      if (userAnswer === correct) {
        finalScore++;
      }
    });

    setScore(finalScore);

    if (user && !isGuest) {
      const title = `${selectedSubject} • ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`;
      const { error } = await supabase.from('quizzes').insert({
        user_id: user.id,
        subject_id: selectedSubjectId,
        title,
        difficulty,
        questions: questions as unknown as object,
        score: finalScore,
        total_questions: questions.length,
        completed_at: new Date().toISOString(),
      });

      if (!error) {
        // Estimate ~2 minutes per question for study session logging
        const estimatedMinutes = Math.max(1, questions.length * 2);
        await logStudySession(user.id, selectedSubjectId, estimatedMinutes, 'quiz');
        // Refresh past quizzes in background
        fetchPastQuizzes();
      }
    }

    setScreenState('results');
  };

  const handleNewQuiz = () => {
    setScreenState('config');
    setSelectedSubject(null);
    setSelectedSubjectId(null);
    setDifficulty('medium');
    setNumQuestions(5);
  };

  const handleDone = () => {
    setScreenState('menu');
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setScore(0);
  };

  const handleSelectSubject = (subjectId: string, subjectName: string) => {
    if (selectedSubjectId === subjectId) {
      setSelectedSubjectId(null);
      setSelectedSubject(null);
    } else {
      setSelectedSubjectId(subjectId);
      setSelectedSubject(subjectName);
    }
  };

  // ---------- MENU STATE ----------
  const renderMenu = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Hero Header */}
      <View style={styles.heroSection}>
        <View style={[styles.heroIconWrap, { backgroundColor: colors.primaryLight }]}>
          <ClipboardList size={36} color={colors.primary} />
        </View>
        <Text style={[styles.heroTitle, { color: colors.text }]}>Quiz Generator</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Test your knowledge with AI-powered quizzes
        </Text>
      </View>

      {/* Create New Quiz Button */}
      <Button onPress={handleStartNewQuiz} size="large" style={styles.createButton}>
        Create New Quiz
      </Button>

      {/* Past Quizzes */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Quizzes</Text>
        {pastQuizzes.length > 0 && (
          <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
            {pastQuizzes.length} {pastQuizzes.length === 1 ? 'quiz' : 'quizzes'}
          </Text>
        )}
      </View>

      {loadingPast ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : pastQuizzes.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
            <ClipboardList size={32} color={colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No quizzes yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Create your first quiz to get started!
          </Text>
        </Card>
      ) : (
        <View style={styles.quizList}>
          {pastQuizzes.map((quiz, index) => {
            const total = quiz.total_questions;
            const sc = quiz.score ?? 0;
            const percentage = total > 0 ? Math.round((sc / total) * 100) : 0;
            const isPass = percentage >= 50;
            const diffColor =
              quiz.difficulty === 'easy'
                ? colors.success
                : quiz.difficulty === 'hard'
                ? colors.error
                : colors.accent;

            return (
              <Card key={quiz.id || index} style={styles.pastQuizCard} padding={14}>
                <View style={styles.pastQuizTopRow}>
                  <View style={styles.pastQuizInfo}>
                    <Text
                      style={[styles.pastQuizTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {quiz.title}
                    </Text>
                    <View style={styles.pastQuizMeta}>
                      {quiz.subject && (
                        <View style={[styles.subjectBadge, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.subjectBadgeText, { color: colors.primary }]}>
                            {quiz.subject.name}
                          </Text>
                        </View>
                      )}
                      <View style={[styles.diffBadge, { backgroundColor: diffColor + '22' }]}>
                        <Text style={[styles.diffBadgeText, { color: diffColor }]}>
                          {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.percentageBadge,
                      {
                        backgroundColor: isPass ? colors.successLight : colors.errorLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.percentageText,
                        { color: isPass ? colors.success : colors.error },
                      ]}
                    >
                      {percentage}%
                    </Text>
                  </View>
                </View>
                <View style={styles.pastQuizBottomRow}>
                  <Clock size={14} color={colors.textTertiary} />
                  <Text style={[styles.pastQuizScore, { color: colors.textSecondary }]}>
                    Score: {sc} / {total}
                  </Text>
                  <ChevronRight size={16} color={colors.textTertiary} style={styles.chevron} />
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );

  // ---------- CONFIG STATE ----------
  const renderConfig = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setScreenState('menu')}
        activeOpacity={0.7}
      >
        <ArrowLeft size={22} color={colors.primary} />
        <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.configTitle, { color: colors.text }]}>Quiz Setup</Text>
      <Text style={[styles.configSubtitle, { color: colors.textSecondary }]}>
        Configure your quiz and start practicing
      </Text>

      {/* Subject Selection */}
      <Text style={[styles.configLabel, { color: colors.text }]}>Choose a Subject</Text>
      {subjects.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {subjects.map((subject) => {
            const isSelected = selectedSubjectId === subject.id;
            return (
              <TouchableOpacity
                key={subject.id}
                onPress={() => handleSelectSubject(subject.id, subject.name)}
                activeOpacity={0.7}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {subject.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Difficulty Selection */}
      <Text style={[styles.configLabel, { color: colors.text, marginTop: 24 }]}>Difficulty</Text>
      <View style={styles.diffRow}>
        {DIFFICULTIES.map((diff) => {
          const isSelected = difficulty === diff.value;
          const diffColor =
            diff.value === 'easy'
              ? colors.success
              : diff.value === 'hard'
              ? colors.error
              : colors.accent;
          return (
            <TouchableOpacity
              key={diff.value}
              onPress={() => setDifficulty(diff.value)}
              activeOpacity={0.7}
              style={[
                styles.diffOption,
                {
                  backgroundColor: isSelected ? diffColor : colors.surface,
                  borderColor: isSelected ? diffColor : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.diffOptionText,
                  { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {diff.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Number of Questions */}
      <Text style={[styles.configLabel, { color: colors.text, marginTop: 24 }]}>
        Number of Questions
      </Text>
      <View style={styles.countRow}>
        {QUESTION_COUNTS.map((count) => {
          const isSelected = numQuestions === count;
          return (
            <TouchableOpacity
              key={count}
              onPress={() => setNumQuestions(count)}
              activeOpacity={0.7}
              style={[
                styles.countOption,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.countOptionText,
                  { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Start Quiz Button */}
      <View style={styles.configButtonWrap}>
        <Button
          onPress={handleGenerateQuiz}
          size="large"
          disabled={!selectedSubject || generating}
          loading={generating}
        >
          {generating ? 'Generating...' : 'Start Quiz'}
        </Button>
      </View>
    </ScrollView>
  );

  // ---------- TAKING STATE ----------
  const renderTaking = () => {
    const question = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const isLast = currentIndex === questions.length - 1;
    const canProceed =
      question.type === 'multiple_choice' || question.type === 'true_false'
        ? selectedOption !== null
        : currentAnswer.trim().length > 0;

    return (
      <View style={[styles.takingContainer, { backgroundColor: colors.background }]}>
        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfoRow}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              Question {currentIndex + 1} of {questions.length}
            </Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>
              {Math.round(progress)}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${progress}%` },
              ]}
            />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.takingScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Type Badge */}
          <View style={styles.questionTypeWrap}>
            <View
              style={[
                styles.questionTypeBadge,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Text style={[styles.questionTypeText, { color: colors.primary }]}>
                {question.type === 'multiple_choice'
                  ? 'Multiple Choice'
                  : question.type === 'true_false'
                  ? 'True / False'
                  : question.type === 'fill_blank'
                  ? 'Fill in the Blank'
                  : 'Short Answer'}
              </Text>
            </View>
          </View>

          {/* Question Text */}
          <Card style={styles.questionCard} padding={20}>
            <Text style={[styles.questionText, { color: colors.text }]}>
              {question.question}
            </Text>
          </Card>

          {/* Answer Area */}
          {question.type === 'multiple_choice' || question.type === 'true_false' ? (
            <View style={styles.optionsWrap}>
              {question.options?.map((option, i) => {
                const isSelected = selectedOption === i;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelectedOption(i)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.optionLetterWrap,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionLetter,
                            { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                          ]}
                        >
                          {String.fromCharCode(65 + i)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          { color: isSelected ? colors.primary : colors.text },
                        ]}
                      >
                        {option}
                      </Text>
                      {isSelected && (
                        <CheckCircle size={22} color={colors.primary} style={styles.optionCheck} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.textInputWrap}>
              <TextInput
                style={[
                  styles.textAnswerInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder={
                  question.type === 'fill_blank'
                    ? 'Type your answer...'
                    : 'Type your answer...'
                }
                placeholderTextColor={colors.textTertiary}
                value={currentAnswer}
                onChangeText={setCurrentAnswer}
                multiline={question.type === 'short_answer'}
                numberOfLines={question.type === 'short_answer' ? 3 : 1}
                textAlignVertical={question.type === 'short_answer' ? 'top' : 'center'}
              />
            </View>
          )}
        </ScrollView>

        {/* Bottom Action */}
        <View style={[styles.takingFooter, { backgroundColor: colors.background }]}>
          <Button
            onPress={handleNext}
            size="large"
            disabled={!canProceed}
            style={styles.takingButton}
          >
            {isLast ? 'Finish Quiz' : 'Next Question'}
          </Button>
        </View>
      </View>
    );
  };

  // ---------- RESULTS STATE ----------
  const renderResults = () => {
    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const isPass = percentage >= 50;
    const resultColor = isPass ? colors.success : colors.error;
    const resultBg = isPass ? colors.successLight : colors.errorLight;

    return (
      <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <View style={[styles.resultsIconWrap, { backgroundColor: resultBg }]}>
          {isPass ? (
            <Trophy size={48} color={resultColor} />
          ) : (
            <RotateCcw size={48} color={resultColor} />
          )}
        </View>
        <Text style={[styles.resultsTitle, { color: colors.text }]}>
          {isPass ? 'Great Job!' : 'Keep Practicing!'}
        </Text>
        <Text style={[styles.resultsSubtitle, { color: colors.textSecondary }]}>
          You scored {score} out of {total} questions correctly
        </Text>

        {/* Score Circle */}
        <View style={[styles.scoreCircle, { borderColor: resultColor }]}>
          <Text style={[styles.scorePercentage, { color: resultColor }]}>{percentage}%</Text>
          <Text style={[styles.scoreFraction, { color: colors.textSecondary }]}>
            {score} / {total}
          </Text>
        </View>
      </View>

      {/* Question Review */}
      <Text style={[styles.reviewTitle, { color: colors.text }]}>Review</Text>
      <View style={styles.reviewList}>
        {questions.map((q, i) => {
          const userAnswer = (answers[i] || 'No answer').trim() || 'No answer';
          const isCorrect =
            userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();

          return (
            <Card key={i} style={styles.reviewCard} padding={16}>
              <View style={styles.reviewCardHeader}>
                <View style={styles.reviewIconWrap}>
                  {isCorrect ? (
                    <CheckCircle size={22} color={colors.success} />
                  ) : (
                    <XCircle size={22} color={colors.error} />
                  )}
                </View>
                <Text style={[styles.reviewQuestionNum, { color: colors.textTertiary }]}>
                  Q{i + 1}
                </Text>
              </View>

              <Text style={[styles.reviewQuestion, { color: colors.text }]}>
                {q.question}
              </Text>

              <View
                style={[
                  styles.reviewAnswerRow,
                  { backgroundColor: isCorrect ? colors.successLight : colors.errorLight },
                ]}
              >
                <Text style={[styles.reviewAnswerLabel, { color: colors.textSecondary }]}>
                  Your answer:
                </Text>
                <Text
                  style={[
                    styles.reviewAnswerValue,
                    { color: isCorrect ? colors.success : colors.error },
                  ]}
                >
                  {userAnswer}
                </Text>
              </View>

              {!isCorrect && (
                <View
                  style={[
                    styles.reviewAnswerRow,
                    { backgroundColor: colors.successLight },
                  ]}
                >
                  <Text style={[styles.reviewAnswerLabel, { color: colors.textSecondary }]}>
                    Correct answer:
                  </Text>
                  <Text style={[styles.reviewAnswerValue, { color: colors.success }]}>
                    {q.correct_answer}
                  </Text>
                </View>
              )}

              {q.explanation ? (
                <View style={[styles.reviewExplanation, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.reviewExplanationText, { color: colors.textSecondary }]}>
                    {q.explanation}
                  </Text>
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>

      {/* Results Actions */}
      <View style={styles.resultsActions}>
        <Button onPress={handleNewQuiz} variant="outline" size="large" style={styles.resultsActionBtn}>
          New Quiz
        </Button>
        <Button onPress={handleDone} size="large" style={styles.resultsActionBtn}>
          Done
        </Button>
      </View>
    </ScrollView>
    );
  };

  // ---------- MAIN RENDER ----------
  if (screenState === 'taking') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderTaking()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {screenState === 'menu' && renderMenu()}
      {screenState === 'config' && renderConfig()}
      {screenState === 'results' && renderResults()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 100,
  },

  // --- Menu ---
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  createButton: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  loadingWrap: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  quizList: {
    gap: 12,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  pastQuizCard: {
    marginBottom: 0,
  },
  pastQuizTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  pastQuizInfo: {
    flex: 1,
    marginRight: 12,
  },
  pastQuizTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginBottom: 8,
  },
  pastQuizMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  diffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  diffBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  percentageBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  pastQuizBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  pastQuizScore: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginLeft: 6,
  },
  chevron: {
    marginLeft: 'auto',
  },

  // --- Config ---
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginLeft: 6,
  },
  configTitle: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    marginBottom: 6,
  },
  configSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    marginBottom: 28,
  },
  configLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginBottom: 12,
  },
  chipsRow: {
    paddingRight: 20,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  diffRow: {
    flexDirection: 'row',
    gap: 10,
  },
  diffOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  diffOptionText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  countRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countOption: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  countOptionText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  configButtonWrap: {
    marginTop: 36,
  },

  // --- Taking ---
  takingContainer: {
    flex: 1,
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  takingScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  questionTypeWrap: {
    marginBottom: 14,
  },
  questionTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  questionTypeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionCard: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    lineHeight: 28,
  },
  optionsWrap: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 16,
  },
  optionLetterWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  optionLetter: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  optionCheck: {
    marginLeft: 8,
  },
  textInputWrap: {
    marginBottom: 20,
  },
  textAnswerInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 56,
  },
  takingFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  takingButton: {
    flex: 1,
  },

  // --- Results ---
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  resultsIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    marginBottom: 6,
  },
  resultsSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePercentage: {
    fontSize: 38,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  scoreFraction: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    marginTop: 2,
  },
  reviewTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginBottom: 12,
  },
  reviewList: {
    gap: 12,
  },
  reviewCard: {
    marginBottom: 0,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reviewIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewQuestionNum: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  reviewQuestion: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 22,
  },
  reviewAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  reviewAnswerLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    marginRight: 6,
  },
  reviewAnswerValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    flex: 1,
  },
  reviewExplanation: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  reviewExplanationText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  resultsActionBtn: {
    flex: 1,
  },
});
