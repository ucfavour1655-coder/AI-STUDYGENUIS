import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { generateQuiz } from '@/lib/ai-engine';
import { logStudySession } from '@/lib/use-stats';
import { QuizQuestion } from '@/lib/types';
import { Card } from '@/components/Card';
import {
  GraduationCap,
  Clock,
  ChevronRight,
  Trophy,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react-native';

type ScreenState = 'menu' | 'taking' | 'results';

interface ExamType {
  id: string;
  name: string;
  description: string;
  subject: string;
  durationMinutes: number;
  color: string;
  colorLight: string;
}

const EXAM_TYPES: ExamType[] = [
  {
    id: 'waec',
    name: 'WAEC',
    description: 'West African Examinations Council practice set',
    subject: 'Mathematics',
    durationMinutes: 60,
    color: '#2563EB',
    colorLight: '#DBEAFE',
  },
  {
    id: 'neco',
    name: 'NECO',
    description: 'National Examinations Council mock test',
    subject: 'Science',
    durationMinutes: 60,
    color: '#10B981',
    colorLight: '#D1FAE5',
  },
  {
    id: 'jamb',
    name: 'JAMB',
    description: 'Joint Admissions and Matriculation Board exam',
    subject: 'English',
    durationMinutes: 45,
    color: '#F59E0B',
    colorLight: '#FEF3C7',
  },
  {
    id: 'cambridge',
    name: 'Cambridge',
    description: 'Cambridge International Examination prep',
    subject: 'Physics',
    durationMinutes: 90,
    color: '#8B5CF6',
    colorLight: '#EDE9FE',
  },
  {
    id: 'sat',
    name: 'SAT',
    description: 'Scholastic Assessment Test practice',
    subject: 'Mathematics',
    durationMinutes: 60,
    color: '#EF4444',
    colorLight: '#FEE2E2',
  },
  {
    id: 'ielts',
    name: 'IELTS',
    description: 'International English Language Testing System',
    subject: 'English',
    durationMinutes: 60,
    color: '#06B6D4',
    colorLight: '#CFFAFE',
  },
];

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function ExamsScreen() {
  const { colors } = useTheme();
  const { user, isGuest } = useAuth();

  const [screenState, setScreenState] = useState<ScreenState>('menu');
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(null);

  // Taking state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFinishedRef = useRef(false);

  // Results state
  const [score, setScore] = useState(0);

  // ---------- Timer ----------
  useEffect(() => {
    if (screenState === 'taking' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Auto-submit when timer hits 0
            if (!hasFinishedRef.current) {
              hasFinishedRef.current = true;
              finishExam();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenState]);

  // ---------- Handlers ----------
  const handleStartExam = async (exam: ExamType) => {
    setSelectedExam(exam);
    setGenerating(true);
    // Brief delay for UX feedback
    await new Promise((r) => setTimeout(r, 300));
    const generated = generateQuiz(exam.subject, 'hard', 10);
    setQuestions(generated);
    setCurrentIndex(0);
    setAnswers([]);
    setCurrentAnswer('');
    setSelectedOption(null);
    setScore(0);
    hasFinishedRef.current = false;
    setTimeLeft(exam.durationMinutes * 60);
    setGenerating(false);
    setScreenState('taking');
  };

  const recordAnswer = useCallback((): string => {
    const question = questions[currentIndex];
    if (!question) return '';
    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      if (selectedOption !== null && question.options) {
        return question.options[selectedOption];
      }
      return '';
    }
    return currentAnswer.trim();
  }, [questions, currentIndex, selectedOption, currentAnswer]);

  const handleNext = () => {
    const answer = recordAnswer();
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answer;
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer(newAnswers[currentIndex + 1] || '');
      setSelectedOption(null);
      // Restore selection if navigating back to an answered question
      const nextQuestion = questions[currentIndex + 1];
      if (nextQuestion && (nextQuestion.type === 'multiple_choice' || nextQuestion.type === 'true_false')) {
        const existing = newAnswers[currentIndex + 1];
        if (existing && nextQuestion.options) {
          const idx = nextQuestion.options.indexOf(existing);
          if (idx >= 0) setSelectedOption(idx);
        }
      }
    } else {
      finishExam(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentIndex === 0) return;
    const answer = recordAnswer();
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answer;
    setAnswers(newAnswers);
    setCurrentIndex(currentIndex - 1);
    const prevAnswer = newAnswers[currentIndex - 1] || '';
    setCurrentAnswer(prevAnswer);
    const prevQuestion = questions[currentIndex - 1];
    if (prevQuestion && (prevQuestion.type === 'multiple_choice' || prevQuestion.type === 'true_false')) {
      if (prevQuestion.options && prevAnswer) {
        const idx = prevQuestion.options.indexOf(prevAnswer);
        setSelectedOption(idx >= 0 ? idx : null);
      } else {
        setSelectedOption(null);
      }
    } else {
      setSelectedOption(null);
    }
  };

  const finishExam = async (allAnswers?: string[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    const finalAnswers = allAnswers ?? answers;
    let finalScore = 0;
    questions.forEach((q, i) => {
      const userAnswer = (finalAnswers[i] || '').toLowerCase().trim();
      const correct = q.correct_answer.toLowerCase().trim();
      if (userAnswer === correct) {
        finalScore++;
      }
    });

    setScore(finalScore);

    if (user && !isGuest && selectedExam) {
      const title = `${selectedExam.name} • ${selectedExam.subject}`;
      const { error } = await supabase.from('quizzes').insert({
        user_id: user.id,
        subject_id: null,
        title,
        difficulty: 'hard',
        questions: questions as unknown as object,
        score: finalScore,
        total_questions: questions.length,
        completed_at: new Date().toISOString(),
      });

      if (!error) {
        // Log study session using the exam's full duration
        await logStudySession(user.id, null, selectedExam.durationMinutes, 'quiz');
      }
    }

    setScreenState('results');
  };

  const handleBackToExams = () => {
    setScreenState('menu');
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setScore(0);
    setSelectedExam(null);
    setCurrentAnswer('');
    setSelectedOption(null);
    hasFinishedRef.current = false;
  };

  // ---------- MENU STATE ----------
  const renderMenu = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Header */}
      <View style={styles.heroSection}>
        <View style={[styles.heroIconWrap, { backgroundColor: colors.primaryLight }]}>
          <GraduationCap size={36} color={colors.primary} />
        </View>
        <Text style={[styles.heroTitle, { color: colors.text }]}>Exam Preparation</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Practice with timed mock exams
        </Text>
      </View>

      {/* Exam Types */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose an Exam</Text>
        <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
          {EXAM_TYPES.length} exams
        </Text>
      </View>

      <View style={styles.examList}>
        {EXAM_TYPES.map((exam) => (
          <TouchableOpacity
            key={exam.id}
            onPress={() => handleStartExam(exam)}
            activeOpacity={0.7}
            disabled={generating}
          >
            <Card style={styles.examCard} padding={16}>
              <View style={styles.examCardTop}>
                <View style={[styles.examIconWrap, { backgroundColor: exam.colorLight }]}>
                  <GraduationCap size={24} color={exam.color} />
                </View>
                <View style={styles.examInfo}>
                  <Text style={[styles.examName, { color: colors.text }]} numberOfLines={1}>
                    {exam.name}
                  </Text>
                  <Text
                    style={[styles.examDescription, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {exam.description}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} style={styles.examChevron} />
              </View>

              <View style={[styles.examMetaRow, { borderTopColor: colors.border }]}>
                <View style={styles.examMetaItem}>
                  <Clock size={14} color={exam.color} />
                  <Text style={[styles.examMetaText, { color: colors.textSecondary }]}>
                    {exam.durationMinutes} min
                  </Text>
                </View>
                <View
                  style={[styles.examSubjectBadge, { backgroundColor: exam.colorLight }]}
                >
                  <Text style={[styles.examSubjectText, { color: exam.color }]}>
                    {exam.subject}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {generating && (
        <View style={styles.generatingOverlay}>
          <View style={[styles.generatingCard, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.generatingText, { color: colors.text }]}>
              Preparing your exam...
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  // ---------- TAKING STATE ----------
  const renderTaking = () => {
    const question = questions[currentIndex];
    if (!question) return null;

    const progress = ((currentIndex + 1) / questions.length) * 100;
    const isLast = currentIndex === questions.length - 1;
    const canProceed =
      question.type === 'multiple_choice' || question.type === 'true_false'
        ? selectedOption !== null
        : currentAnswer.trim().length > 0;
    const isLowTime = timeLeft <= 30;
    const timerColor = isLowTime ? colors.error : selectedExam?.color || colors.primary;

    return (
      <View style={[styles.takingContainer, { backgroundColor: colors.background }]}>
        {/* Exam Header with Timer */}
        <View style={[styles.takingHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.takingHeaderTop}>
            <View style={styles.takingHeaderInfo}>
              <Text style={[styles.takingExamName, { color: colors.text }]} numberOfLines={1}>
                {selectedExam?.name} Exam
              </Text>
              <Text style={[styles.takingExamSubject, { color: colors.textSecondary }]}>
                {selectedExam?.subject}
              </Text>
            </View>
            <View
              style={[
                styles.timerBadge,
                {
                  backgroundColor: isLowTime ? colors.errorLight : colors.primaryLight,
                  borderColor: timerColor,
                },
              ]}
            >
              <Clock size={16} color={timerColor} />
              <Text style={[styles.timerText, { color: timerColor }]}>
                {formatTime(timeLeft)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressInfoRow}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                Question {currentIndex + 1} of {questions.length}
              </Text>
              <Text style={[styles.progressPercent, { color: selectedExam?.color || colors.primary }]}>
                {Math.round(progress)}%
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: selectedExam?.color || colors.primary,
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>
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
                { backgroundColor: (selectedExam?.colorLight) || colors.primaryLight },
              ]}
            >
              <Text style={[styles.questionTypeText, { color: selectedExam?.color || colors.primary }]}>
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
            <Text style={[styles.questionText, { color: colors.text }]}>{question.question}</Text>
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
                          backgroundColor: isSelected
                            ? selectedExam?.colorLight || colors.primaryLight
                            : colors.surface,
                          borderColor: isSelected
                            ? selectedExam?.color || colors.primary
                            : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.optionLetterWrap,
                          {
                            backgroundColor: isSelected
                              ? selectedExam?.color || colors.primary
                              : colors.surfaceSecondary,
                            borderColor: isSelected
                              ? selectedExam?.color || colors.primary
                              : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionLetter,
                            {
                              color: isSelected ? '#FFFFFF' : colors.textSecondary,
                            },
                          ]}
                        >
                          {String.fromCharCode(65 + i)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: isSelected
                              ? selectedExam?.color || colors.primary
                              : colors.text,
                          },
                        ]}
                      >
                        {option}
                      </Text>
                      {isSelected && (
                        <CheckCircle
                          size={22}
                          color={selectedExam?.color || colors.primary}
                          style={styles.optionCheck}
                        />
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
                placeholder="Type your answer..."
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

        {/* Bottom Navigation */}
        <View style={[styles.takingFooter, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={handlePrevious}
            activeOpacity={0.7}
            disabled={currentIndex === 0}
            style={[
              styles.navButtonSecondary,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: currentIndex === 0 ? 0.4 : 1,
              },
            ]}
          >
            <Text style={[styles.navButtonText, { color: colors.textSecondary }]}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.7}
            disabled={!canProceed}
            style={[
              styles.navButtonPrimary,
              {
                backgroundColor: canProceed
                  ? selectedExam?.color || colors.primary
                  : colors.border,
              },
            ]}
          >
            <Text style={[styles.navButtonTextPrimary, { color: '#FFFFFF' }]}>
              {isLast ? 'Submit Exam' : 'Next'}
            </Text>
          </TouchableOpacity>
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
            {isPass ? 'Congratulations!' : 'Keep Practicing!'}
          </Text>
          <Text style={[styles.resultsSubtitle, { color: colors.textSecondary }]}>
            {selectedExam?.name} • {selectedExam?.subject}
          </Text>

          {/* Score Circle */}
          <View style={[styles.scoreCircle, { borderColor: resultColor }]}>
            <Text style={[styles.scorePercentage, { color: resultColor }]}>{percentage}%</Text>
            <Text style={[styles.scoreFraction, { color: colors.textSecondary }]}>
              {score} / {total}
            </Text>
          </View>

          <Text style={[styles.resultsScoreText, { color: colors.textSecondary }]}>
            You scored {score} out of {total} questions correctly
          </Text>
        </View>

        {/* Question Review */}
        <Text style={[styles.reviewTitle, { color: colors.text }]}>Review Answers</Text>
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

                <Text style={[styles.reviewQuestion, { color: colors.text }]}>{q.question}</Text>

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
                  <View style={[styles.reviewAnswerRow, { backgroundColor: colors.successLight }]}>
                    <Text style={[styles.reviewAnswerLabel, { color: colors.textSecondary }]}>
                      Correct answer:
                    </Text>
                    <Text style={[styles.reviewAnswerValue, { color: colors.success }]}>
                      {q.correct_answer}
                    </Text>
                  </View>
                )}

                {q.explanation ? (
                  <View
                    style={[styles.reviewExplanation, { backgroundColor: colors.surfaceSecondary }]}
                  >
                    <Text style={[styles.reviewExplanationText, { color: colors.textSecondary }]}>
                      {q.explanation}
                    </Text>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>

        {/* Back to Exams Button */}
        <TouchableOpacity
          onPress={handleBackToExams}
          activeOpacity={0.7}
          style={[
            styles.backToExamsButton,
            { backgroundColor: selectedExam?.color || colors.primary },
          ]}
        >
          <Text style={styles.backToExamsText}>Back to Exams</Text>
        </TouchableOpacity>
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
    marginBottom: 28,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
  examList: {
    gap: 14,
  },
  examCard: {
    marginBottom: 0,
  },
  examCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  examIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  examInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    marginBottom: 4,
  },
  examDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  examChevron: {
    marginLeft: 8,
  },
  examMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  examMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examMetaText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    marginLeft: 6,
  },
  examSubjectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  examSubjectText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  generatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingCard: {
    paddingHorizontal: 32,
    paddingVertical: 28,
    borderRadius: 20,
    alignItems: 'center',
  },
  generatingText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginTop: 14,
  },

  // --- Taking ---
  takingContainer: {
    flex: 1,
  },
  takingHeader: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  takingHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  takingHeaderInfo: {
    flex: 1,
    marginRight: 12,
  },
  takingExamName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    marginBottom: 2,
  },
  takingExamSubject: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  timerText: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    marginLeft: 6,
    fontVariant: ['tabular-nums'],
  },
  progressSection: {
    // no extra padding; header provides it
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
    paddingTop: 18,
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
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 36,
    borderTopWidth: 1,
  },
  navButtonSecondary: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonPrimary: {
    flex: 1.5,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  navButtonTextPrimary: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
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
    marginBottom: 16,
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
  resultsScoreText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
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
  backToExamsButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  backToExamsText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
