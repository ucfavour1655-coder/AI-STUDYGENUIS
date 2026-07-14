import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl, TouchableOpacity, Pressable } from 'react-native';
import { router } from 'expo-router';
import {
  Flame,
  Trophy,
  Target,
  TrendingUp,
  BookOpen,
  Clock,
  ChevronRight,
  Sparkles,
  Award,
  Calendar,
  Brain,
  ClipboardList,
  FileText,
  ScanLine,
  PenLine,
  GraduationCap,
  Layers,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useSubjects } from '@/lib/use-subjects';
import { useUserStats } from '@/lib/use-stats';
import { Card } from '@/components/Card';
import { getDailyQuote } from '@/lib/ai-engine';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

interface QuickAction {
  id: string;
  label: string;
  icon: typeof Brain;
  route: string;
  color: string;
  bg: string;
}

const quickActions: QuickAction[] = [
  { id: 'tutor', label: 'AI Tutor', icon: Brain, route: '/(tabs)/tutor', color: '#2563EB', bg: '#DBEAFE' },
  { id: 'quiz', label: 'Quiz', icon: ClipboardList, route: '/(tabs)/quiz', color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'notes', label: 'Notes', icon: FileText, route: '/(tabs)/notes', color: '#0891B2', bg: '#CFFAFE' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, route: '/(tabs)/flashcards', color: '#DB2777', bg: '#FCE7F3' },
  { id: 'writing', label: 'Writing', icon: PenLine, route: '/(tabs)/writing', color: '#CA8A04', bg: '#FEF9C3' },
  { id: 'scanner', label: 'Scanner', icon: ScanLine, route: '/(tabs)/scanner', color: '#059669', bg: '#D1FAE5' },
  { id: 'exams', label: 'Exams', icon: GraduationCap, route: '/(tabs)/exams', color: '#DC2626', bg: '#FEE2E2' },
  { id: 'progress', label: 'Progress', icon: TrendingUp, route: '/(tabs)/progress', color: '#4F46E5', bg: '#E0E7FF' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getInitial(name: string | undefined | null): string {
  if (!name) return 'S';
  return name.charAt(0).toUpperCase();
}

export default function HomeScreen() {
  const { profile, isGuest } = useAuth();
  const { colors } = useTheme();
  const { subjects } = useSubjects();
  const { stats, loading, refetch } = useUserStats();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const displayName = profile?.display_name || 'Student';
  const studyStreak = profile?.study_streak ?? 0;
  const xpPoints = profile?.xp_points ?? 0;
  const dailyGoal = profile?.daily_goal_minutes || 30;
  const todayMinutes = stats.todayMinutes;
  const goalProgress = Math.min(todayMinutes / dailyGoal, 1);
  const dailyQuote = getDailyQuote();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()},</Text>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
            {displayName} 👋
          </Text>
        </View>
        <Pressable
          style={[styles.avatar, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={styles.avatarText}>{getInitial(profile?.display_name)}</Text>
        </Pressable>
      </View>

      {/* Guest mode banner */}
      {isGuest && (
        <View style={[styles.guestBanner, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
          <Sparkles size={20} color={colors.warning} />
          <View style={styles.guestBannerContent}>
            <Text style={[styles.guestBannerTitle, { color: colors.text }]}>You're in guest mode</Text>
            <Text style={[styles.guestBannerSubtitle, { color: colors.textSecondary }]}>
              Sign in to save your progress and sync across devices.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.guestBannerButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.guestBannerButtonText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stat cards row */}
      <View style={styles.statRow}>
        <Card style={styles.statCard} padding={16}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.warningLight }]}>
            <Flame size={22} color="#EA580C" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{studyStreak}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
        </Card>

        <Card style={styles.statCard} padding={16}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Trophy size={22} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{xpPoints.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>XP Points</Text>
        </Card>
      </View>

      {/* Daily Study Goal */}
      <Card style={styles.goalCard} padding={18}>
        <View style={styles.goalHeader}>
          <View style={[styles.goalIconWrap, { backgroundColor: colors.successLight }]}>
            <Target size={20} color={colors.success} />
          </View>
          <View style={styles.goalHeaderText}>
            <Text style={[styles.goalTitle, { color: colors.text }]}>Daily Study Goal</Text>
            <Text style={[styles.goalSubtitle, { color: colors.textSecondary }]}>
              {todayMinutes} / {dailyGoal} min today
            </Text>
          </View>
          <Text style={[styles.goalPercent, { color: colors.success }]}>
            {Math.round(goalProgress * 100)}%
          </Text>
        </View>
        <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.max(goalProgress * 100, goalProgress > 0 ? 6 : 0)}%`,
                backgroundColor: goalProgress >= 1 ? colors.success : colors.primary,
              },
            ]}
          />
        </View>
        {goalProgress >= 1 ? (
          <Text style={[styles.goalMessage, { color: colors.success }]}>
            🎉 Goal reached! Great work today.
          </Text>
        ) : (
          <Text style={[styles.goalMessage, { color: colors.textSecondary }]}>
            {Math.max(dailyGoal - todayMinutes, 0)} min left to hit your goal.
          </Text>
        )}
      </Card>

      {/* Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      </View>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <TouchableOpacity
              key={action.id}
              style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                <Icon size={24} color={action.color} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>{action.label}</Text>
              <ChevronRight size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Subjects */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Subjects</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/subjects' as any)}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>
      {subjects.length === 0 ? (
        <Card style={styles.emptyCard} padding={18}>
          <BookOpen size={24} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No subjects yet. Add one to get started!
          </Text>
        </Card>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              activeOpacity={0.7}
              onPress={() => router.push(`/(tabs)/subjects` as any)}
            >
              <Card style={styles.subjectCard} padding={14}>
                <View style={[styles.subjectIcon, { backgroundColor: subject.color || colors.primaryLight }]}>
                  <BookOpen size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.subjectName, { color: colors.text }]} numberOfLines={1}>
                  {subject.name}
                </Text>
                {subject.description ? (
                  <Text style={[styles.subjectDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                    {subject.description}
                  </Text>
                ) : null}
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Recent Achievements */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Achievements</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/progress' as any)}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>
      {stats.achievements.length === 0 ? (
        <Card style={styles.emptyCard} padding={18}>
          <Award size={24} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No achievements yet. Keep studying to earn badges!
          </Text>
        </Card>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {stats.achievements.slice(0, 8).map((achievement) => (
            <Card key={achievement.id} style={styles.achievementCard} padding={14}>
              <View style={[styles.achievementIcon, { backgroundColor: colors.warningLight }]}>
                <Award size={22} color={colors.warning} />
              </View>
              <Text style={[styles.achievementName, { color: colors.text }]} numberOfLines={2}>
                {achievement.badge_name}
              </Text>
              <View style={[styles.achievementBadge, { backgroundColor: colors.successLight }]}>
                <Text style={[styles.achievementBadgeText, { color: colors.success }]}>Earned</Text>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Daily Quote */}
      <Card style={styles.quoteCard} padding={20}>
        <View style={styles.quoteHeader}>
          <View style={[styles.quoteIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Sparkles size={20} color={colors.primary} />
          </View>
          <Text style={[styles.quoteLabel, { color: colors.textSecondary }]}>Daily Motivation</Text>
        </View>
        <Text style={[styles.quoteText, { color: colors.text }]}>"{dailyQuote}"</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    lineHeight: 30,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  guestBannerContent: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  guestBannerTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  guestBannerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  guestBannerButton: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  guestBannerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: cardWidth,
    alignItems: 'center',
    paddingVertical: 18,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  goalCard: {
    marginBottom: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  goalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalHeaderText: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  goalSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  goalPercent: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  goalMessage: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionCard: {
    width: cardWidth,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  horizontalScroll: {
    paddingRight: 4,
    paddingBottom: 4,
  },
  subjectCard: {
    width: 140,
    marginRight: 12,
    alignItems: 'center',
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  subjectName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
    textAlign: 'center',
  },
  subjectDesc: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 10,
    textAlign: 'center',
  },
  achievementCard: {
    width: 140,
    marginRight: 12,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  achievementName: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 36,
  },
  achievementBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  achievementBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  quoteCard: {
    marginBottom: 20,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quoteLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  quoteText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    lineHeight: 24,
    fontStyle: 'italic',
  },
});
