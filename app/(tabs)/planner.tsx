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
} from 'react-native';
import {
  Calendar,
  Plus,
  X,
  Check,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useSubjects } from '@/lib/use-subjects';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StudyPlan } from '@/lib/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTimeRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

export default function PlannerScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { subjects } = useSubjects();

  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Add-task modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<string | null>(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const todayString = toDateString(today);
  const selectedString = toDateString(selectedDate);
  const isToday = isSameDay(selectedDate, today);

  const loadPlans = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = toDateString(thirtyDaysAgo);

    const { data, error } = await supabase
      .from('study_plans')
      .select('*, subject:subjects(*)')
      .eq('user_id', user.id)
      .gte('scheduled_date', fromDate)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (!error && data) {
      setPlans(data as StudyPlan[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const todaysTasks = plans.filter((p) => p.scheduled_date === selectedString);
  const completedCount = todaysTasks.filter((p) => p.is_completed).length;
  const totalCount = todaysTasks.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const upcomingTasks = plans
    .filter(
      (p) =>
        !p.is_completed &&
        p.scheduled_date > selectedString &&
        p.scheduled_date > todayString
    )
    .slice(0, 10);

  const toggleComplete = async (plan: StudyPlan) => {
    if (!user) return;
    const updated = !plan.is_completed;
    // Optimistic update
    setPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, is_completed: updated } : p))
    );
    const { error } = await supabase
      .from('study_plans')
      .update({ is_completed: updated })
      .eq('id', plan.id);
    if (error) {
      // Revert on error
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, is_completed: plan.is_completed } : p))
      );
      console.error('Error updating plan:', error);
    }
  };

  const deletePlan = async (plan: StudyPlan) => {
    if (!user) return;
    // Optimistic removal
    setPlans((prev) => prev.filter((p) => p.id !== plan.id));
    const { error } = await supabase.from('study_plans').delete().eq('id', plan.id);
    if (error) {
      // Revert on error
      setPlans((prev) => [...prev, plan].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)));
      console.error('Error deleting plan:', error);
    }
  };

  const addTask = async () => {
    if (!user || !newTitle.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('study_plans')
      .insert({
        user_id: user.id,
        title: newTitle.trim(),
        subject_id: newSubjectId,
        scheduled_date: selectedString,
        start_time: newStartTime.trim() || null,
        end_time: newEndTime.trim() || null,
        is_completed: false,
      })
      .select('*, subject:subjects(*)')
      .single();

    if (!error && data) {
      setPlans((prev) => {
        const next = [...prev, data as StudyPlan];
        next.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
        return next;
      });
      // Reset modal
      setNewTitle('');
      setNewSubjectId(null);
      setNewStartTime('');
      setNewEndTime('');
      setModalVisible(false);
    } else if (error) {
      console.error('Error adding plan:', error);
    }
    setSaving(false);
  };

  const closeAndResetModal = () => {
    setNewTitle('');
    setNewSubjectId(null);
    setNewStartTime('');
    setNewEndTime('');
    setModalVisible(false);
  };

  const navigateDay = (direction: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + direction);
    setSelectedDate(next);
  };

  const goToToday = () => setSelectedDate(new Date());

  const formatDateDisplay = (date: Date) => {
    const weekday = WEEKDAYS[date.getDay()];
    const month = MONTHS[date.getMonth()];
    const day = date.getDate();
    return `${weekday}, ${month} ${day}`;
  };

  const getSubjectColor = (subjectId: string | null): string => {
    if (!subjectId) return colors.textTertiary;
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.color || colors.primary;
  };

  const getSubjectName = (subjectId: string | null): string => {
    if (!subjectId) return 'General';
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.name || 'General';
  };

  const renderTaskCard = (plan: StudyPlan, showDate = false) => {
    const subjectColor = getSubjectColor(plan.subject_id);
    const subjectName = getSubjectName(plan.subject_id);
    const timeRange = formatTimeRange(plan.start_time, plan.end_time);

    return (
      <Card key={plan.id} style={styles.taskCard} padding={14}>
        <View style={styles.taskRow}>
          {/* Checkbox */}
          <TouchableOpacity
            onPress={() => toggleComplete(plan)}
            style={[
              styles.checkbox,
              {
                backgroundColor: plan.is_completed ? colors.primary : 'transparent',
                borderColor: plan.is_completed ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            {plan.is_completed && <Check size={16} color="#FFFFFF" />}
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.taskContent}>
            <Text
              style={[
                styles.taskTitle,
                {
                  color: plan.is_completed ? colors.textTertiary : colors.text,
                  textDecorationLine: plan.is_completed ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={2}
            >
              {plan.title}
            </Text>

            <View style={styles.taskMeta}>
              {/* Subject tag */}
              <View
                style={[
                  styles.subjectTag,
                  { backgroundColor: `${subjectColor}1A` },
                ]}
              >
                <View
                  style={[styles.subjectDot, { backgroundColor: subjectColor }]}
                />
                <Text
                  style={[styles.subjectTagText, { color: subjectColor }]}
                  numberOfLines={1}
                >
                  {subjectName}
                </Text>
              </View>

              {/* Time */}
              {timeRange && (
                <View style={styles.timeRow}>
                  <Clock size={12} color={colors.textSecondary} />
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                    {timeRange}
                  </Text>
                </View>
              )}

              {/* Date for upcoming */}
              {showDate && (
                <View style={styles.timeRow}>
                  <Calendar size={12} color={colors.textSecondary} />
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                    {formatDateDisplay(new Date(plan.scheduled_date + 'T00:00:00'))}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Delete */}
          <TouchableOpacity
            onPress={() => deletePlan(plan)}
            style={styles.deleteButton}
            activeOpacity={0.6}
          >
            <Trash2 size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderEmptyState = (message: string) => (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: colors.primaryLight },
        ]}
      >
        <BookOpen size={28} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No tasks yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );

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
            <Calendar size={22} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerText, { color: colors.text }]}>
              Study Planner
            </Text>
            <Text
              style={[styles.headerSubtext, { color: colors.textSecondary }]}
            >
              Plan your study schedule
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date navigation bar */}
        <Card style={styles.dateNavCard} padding={12}>
          <View style={styles.dateNavRow}>
            <TouchableOpacity
              onPress={() => navigateDay(-1)}
              style={[
                styles.dateNavButton,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToToday}
              style={styles.dateDisplay}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateText, { color: colors.text }]}>
                {formatDateDisplay(selectedDate)}
              </Text>
              {isToday && (
                <View
                  style={[
                    styles.todayBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.todayBadgeText}>Today</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateDay(1)}
              style={[
                styles.dateNavButton,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              activeOpacity={0.7}
            >
              <ChevronRight size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Progress bar */}
        {totalCount > 0 && (
          <Card style={styles.progressCard} padding={16}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.text }]}>
                Progress
              </Text>
              <Text style={[styles.progressCount, { color: colors.textSecondary }]}>
                {completedCount} / {totalCount} completed
              </Text>
            </View>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress * 100}%`,
                    backgroundColor: progress === 1 ? colors.success : colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPercent, { color: colors.textSecondary }]}>
              {Math.round(progress * 100)}% done
            </Text>
          </Card>
        )}

        {/* Today's Tasks section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isToday ? "Today's Tasks" : 'Tasks'}
          </Text>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={[
              styles.addButton,
              { backgroundColor: colors.primaryLight },
            ]}
            activeOpacity={0.7}
          >
            <Plus size={18} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>
              Add
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : todaysTasks.length === 0 ? (
          renderEmptyState(
            isToday
              ? 'Tap Add to create your first task for today.'
              : 'No tasks scheduled for this day.'
          )
        ) : (
          <View style={styles.tasksList}>
            {todaysTasks.map((plan) => renderTaskCard(plan))}
          </View>
        )}

        {/* Upcoming section */}
        {!loading && upcomingTasks.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Upcoming
            </Text>
            <View style={styles.tasksList}>
              {upcomingTasks.map((plan) => renderTaskCard(plan, true))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeAndResetModal}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: colors.overlay },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface },
            ]}
          >
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                New Task
              </Text>
              <TouchableOpacity
                onPress={closeAndResetModal}
                style={[
                  styles.modalCloseButton,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
                activeOpacity={0.7}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Title input */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Task Title
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Review Chapter 5"
                placeholderTextColor={colors.textTertiary}
                maxLength={120}
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
                  onPress={() => setNewSubjectId(null)}
                  style={[
                    styles.subjectChip,
                    {
                      backgroundColor:
                        newSubjectId === null
                          ? colors.primary
                          : colors.surfaceSecondary,
                      borderColor:
                        newSubjectId === null ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.subjectChipText,
                      {
                        color:
                          newSubjectId === null
                            ? '#FFFFFF'
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    General
                  </Text>
                </TouchableOpacity>
                {subjects.map((subject) => {
                  const selected = newSubjectId === subject.id;
                  return (
                    <TouchableOpacity
                      key={subject.id}
                      onPress={() => setNewSubjectId(subject.id)}
                      style={[
                        styles.subjectChip,
                        {
                          backgroundColor: selected
                            ? subject.color
                            : colors.surfaceSecondary,
                          borderColor: selected ? subject.color : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.subjectChipDot,
                          {
                            backgroundColor: selected
                              ? '#FFFFFF'
                              : subject.color,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.subjectChipText,
                          {
                            color: selected ? '#FFFFFF' : colors.text,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {subject.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Time inputs */}
              <View style={styles.timeInputRow}>
                <View style={styles.timeInputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Start Time
                  </Text>
                  <TextInput
                    style={[
                      styles.timeInput,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={newStartTime}
                    onChangeText={setNewStartTime}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={styles.timeInputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    End Time
                  </Text>
                  <TextInput
                    style={[
                      styles.timeInput,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={newEndTime}
                    onChangeText={setNewEndTime}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Add button */}
            <Button
              onPress={addTask}
              disabled={!newTitle.trim() || saving}
              loading={saving}
              style={styles.modalAddButton}
            >
              Add Task
            </Button>
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  // Date navigation
  dateNavCard: {
    marginBottom: 12,
  },
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  todayBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Progress
  progressCard: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
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
  progressPercent: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
    textAlign: 'right',
  },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  // Tasks
  tasksList: {
    gap: 10,
  },
  taskCard: {
    marginBottom: 0,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 6,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  subjectTagText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  deleteButton: {
    padding: 6,
    marginTop: 2,
  },
  // Upcoming
  upcomingSection: {
    marginTop: 24,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
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
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalScrollContent: {
    paddingBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 4,
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
  },
  subjectChips: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
    marginBottom: 16,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
  },
  subjectChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subjectChipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  modalAddButton: {
    marginTop: 20,
    borderRadius: 16,
  },
});
