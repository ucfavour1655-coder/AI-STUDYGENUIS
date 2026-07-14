import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useUserStats } from '@/lib/use-stats';
import { Card } from '@/components/Card';
import {
  Clock,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Flame,
  Star,
  BookOpen,
} from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Sample weekly data (minutes studied per day). The last entry is replaced
// with the live todayMinutes value so the chart always reflects "today".
const weeklyData = [45, 60, 30, 75, 50, 40, 0];

export default function ProgressScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { stats, loading } = useUserStats();

  const todayMinutes = stats.todayMinutes;
  const weekMinutes = stats.weekMinutes;
  const monthMinutes = stats.monthMinutes;
  const totalQuizzes = stats.totalQuizzes;
  const avgQuizScore = Math.round(stats.avgQuizScore);
  const totalNotes = stats.totalNotes;
  const studyStreak = profile?.study_streak ?? 0;
  const achievements = stats.achievements;

  // Build the chart dataset: sample days + live today value on the last bar.
  const chartData = weeklyData.map((value, index) =>
    index === weeklyData.length - 1 ? todayMinutes : value
  );
  const maxChartValue = Math.max(...chartData, 60);

  // Chart geometry
  const chartPadding = 32;
  const barCount = chartData.length;
  const chartWidth = screenWidth - chartPadding * 2 - 32; // account for card padding
  const barGap = 12;
  const barWidth = (chartWidth - barGap * (barCount - 1)) / barCount;
  const chartHeight = 140;

  // Subject performance derived from avgQuizScore with offsets so the bars
  // differ visually even before the user has many quizzes.
  const subjects = [
    { name: 'Mathematics', offset: 8, color: colors.primary },
    { name: 'Science', offset: -4, color: colors.secondary },
    { name: 'English', offset: 12, color: colors.accent },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading your progress...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Progress</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Track your study journey and achievements
        </Text>
      </View>

      {/* Study time row */}
      <View style={styles.studyTimeRow}>
        <Card style={styles.studyTimeCard} padding={14}>
          <View style={[styles.studyTimeIcon, { backgroundColor: colors.primaryLight }]}>
            <Clock size={18} color={colors.primary} />
          </View>
          <Text style={[styles.studyTimeValue, { color: colors.text }]}>
            {todayMinutes}
            <Text style={[styles.studyTimeUnit, { color: colors.textSecondary }]}> min</Text>
          </Text>
          <Text style={[styles.studyTimeLabel, { color: colors.textSecondary }]}>Today</Text>
        </Card>

        <Card style={styles.studyTimeCard} padding={14}>
          <View style={[styles.studyTimeIcon, { backgroundColor: colors.secondaryLight }]}>
            <Clock size={18} color={colors.secondary} />
          </View>
          <Text style={[styles.studyTimeValue, { color: colors.text }]}>
            {weekMinutes}
            <Text style={[styles.studyTimeUnit, { color: colors.textSecondary }]}> min</Text>
          </Text>
          <Text style={[styles.studyTimeLabel, { color: colors.textSecondary }]}>This Week</Text>
        </Card>

        <Card style={styles.studyTimeCard} padding={14}>
          <View style={[styles.studyTimeIcon, { backgroundColor: colors.warningLight }]}>
            <Clock size={18} color={colors.accent} />
          </View>
          <Text style={[styles.studyTimeValue, { color: colors.text }]}>
            {monthMinutes}
            <Text style={[styles.studyTimeUnit, { color: colors.textSecondary }]}> min</Text>
          </Text>
          <Text style={[styles.studyTimeLabel, { color: colors.textSecondary }]}>This Month</Text>
        </Card>
      </View>

      {/* Weekly chart card */}
      <Card style={styles.chartCard} padding={16}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleWrap}>
            <View style={[styles.chartTitleIcon, { backgroundColor: colors.primaryLight }]}>
              <BarChart3 size={16} color={colors.primary} />
            </View>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Study Time</Text>
          </View>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
            {weekMinutes} min total
          </Text>
        </View>

        <View style={[styles.chartArea, { height: chartHeight }]}>
          {chartData.map((value, index) => {
            const barHeight = Math.max((value / maxChartValue) * chartHeight, 4);
            const isToday = index === chartData.length - 1;
            return (
              <View key={index} style={styles.barColumn}>
                <View style={[styles.barTrack, { height: chartHeight, backgroundColor: colors.surfaceSecondary }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: isToday ? colors.primary : colors.primaryLight,
                        width: barWidth,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.barValue,
                    { color: isToday ? colors.primary : colors.textTertiary },
                  ]}
                >
                  {value}
                </Text>
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                  {DAYS[index]}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard} padding={14}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Target size={18} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalQuizzes}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Quizzes</Text>
        </Card>

        <Card style={styles.statCard} padding={14}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.secondaryLight }]}>
            <TrendingUp size={18} color={colors.secondary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{avgQuizScore}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Score</Text>
        </Card>

        <Card style={styles.statCard} padding={14}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.warningLight }]}>
            <BookOpen size={18} color={colors.accent} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalNotes}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Notes</Text>
        </Card>
      </View>

      {/* Strengths & Weak Areas */}
      <Card style={styles.subjectsCard} padding={16}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardTitleIcon, { backgroundColor: colors.primaryLight }]}>
            <TrendingUp size={16} color={colors.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Strengths & Weak Areas</Text>
        </View>

        {subjects.map((subject) => {
          const score = Math.min(Math.max(avgQuizScore + subject.offset, 0), 100);
          return (
            <View key={subject.name} style={styles.subjectRow}>
              <View style={styles.subjectHeader}>
                <Text style={[styles.subjectName, { color: colors.text }]}>{subject.name}</Text>
                <Text style={[styles.subjectScore, { color: colors.textSecondary }]}>
                  {Math.round(score)}%
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSecondary }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${score}%`,
                      backgroundColor: subject.color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </Card>

      {/* Study Streak */}
      <Card style={styles.streakCard} padding={16}>
        <View style={[styles.streakIconWrap, { backgroundColor: colors.errorLight }]}>
          <Flame size={24} color={colors.error} />
        </View>
        <View style={styles.streakTextWrap}>
          <Text style={[styles.streakTitle, { color: colors.text }]}>Study Streak</Text>
          <Text style={[styles.streakSubtitle, { color: colors.textSecondary }]}>
            {studyStreak > 0
              ? `Keep it up! You're on a ${studyStreak}-day streak.`
              : 'Start studying today to begin your streak!'}
          </Text>
        </View>
        <View style={[styles.streakBadge, { backgroundColor: colors.errorLight }]}>
          <Text style={[styles.streakBadgeValue, { color: colors.error }]}>{studyStreak}</Text>
          <Text style={[styles.streakBadgeLabel, { color: colors.error }]}>days</Text>
        </View>
      </Card>

      {/* Achievement Badges */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <View style={[styles.sectionTitleIcon, { backgroundColor: colors.warningLight }]}>
            <Award size={16} color={colors.accent} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievement Badges</Text>
        </View>
        <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
          {achievements.length} earned
        </Text>
      </View>

      {achievements.length > 0 ? (
        <View style={styles.badgeGrid}>
          {achievements.map((achievement) => (
            <Card key={achievement.id} style={styles.badgeCard} padding={14}>
              <View style={[styles.badgeIconWrap, { backgroundColor: colors.warningLight }]}>
                <Award size={28} color={colors.accent} />
              </View>
              <Text
                style={[styles.badgeName, { color: colors.text }]}
                numberOfLines={2}
              >
                {achievement.badge_name}
              </Text>
              <View style={[styles.badgeTag, { backgroundColor: colors.successLight }]}>
                <Star size={10} color={colors.success} />
                <Text style={[styles.badgeTagText, { color: colors.success }]}>Earned</Text>
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <Card style={styles.emptyBadgesCard} padding={24}>
          <View style={[styles.emptyBadgeIcon, { backgroundColor: colors.warningLight }]}>
            <Award size={32} color={colors.accent} />
          </View>
          <Text style={[styles.emptyBadgesTitle, { color: colors.text }]}>
            No Badges Yet
          </Text>
          <Text style={[styles.emptyBadgesSubtitle, { color: colors.textSecondary }]}>
            Complete quizzes, take notes, and study regularly to earn your first achievement badge!
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 12,
  },
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  // Study time row
  studyTimeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  studyTimeCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  studyTimeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  studyTimeValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  studyTimeUnit: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  studyTimeLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  // Weekly chart
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartTitleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  chartSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    borderRadius: 6,
  },
  barValue: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    marginTop: 6,
  },
  barLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  // Strengths & Weak Areas
  subjectsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  subjectRow: {
    marginBottom: 14,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subjectName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  subjectScore: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
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
  // Study Streak
  streakCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  streakTextWrap: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  streakSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  streakBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  streakBadgeValue: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
  },
  streakBadgeLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  // Badge grid
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  badgeCard: {
    width: (screenWidth - 48) / 3,
    maxWidth: 140,
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 12,
  },
  badgeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  badgeName: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 32,
  },
  badgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTagText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 3,
  },
  // Empty badges
  emptyBadgesCard: {
    marginHorizontal: 16,
    alignItems: 'center',
  },
  emptyBadgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyBadgesTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyBadgesSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 19,
  },
});
