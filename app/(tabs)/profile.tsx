import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useUserStats } from '@/lib/use-stats';
import { Card } from '@/components/Card';
import {
  Moon,
  Sun,
  LogOut,
  Trophy,
  Flame,
  Coins,
  Star,
  Award,
  ChevronRight,
  Crown,
  FileText,
  Layers,
  ClipboardList,
  Clock,
} from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

interface MenuItem {
  id: string;
  label: string;
  icon: typeof FileText;
  iconColor: string;
  iconBg: string;
  route?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, isGuest, signOut } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
  const { stats } = useUserStats();

  const displayName = profile?.display_name || 'Student';
  const email = profile?.id ? '' : '';
  const userEmail = isGuest ? 'Guest user' : 'Signed in with email';
  const initial = (displayName?.charAt(0) || 'S').toUpperCase();

  const studyStreak = profile?.study_streak ?? 0;
  const xpPoints = profile?.xp_points ?? 0;
  const coins = profile?.coins ?? 0;
  const badgesCount = stats.achievements.length;

  const menuItems: MenuItem[] = [
    {
      id: 'notes',
      label: 'My Notes',
      icon: FileText,
      iconColor: '#0891B2',
      iconBg: '#CFFAFE',
      route: '/(tabs)/notes',
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: Layers,
      iconColor: '#DB2777',
      iconBg: '#FCE7F3',
      route: '/(tabs)/flashcards',
    },
    {
      id: 'quiz-history',
      label: 'Quiz History',
      icon: ClipboardList,
      iconColor: '#7C3AED',
      iconBg: '#EDE9FE',
      route: '/(tabs)/quiz',
    },
    {
      id: 'study-progress',
      label: 'Study Progress',
      icon: Clock,
      iconColor: '#4F46E5',
      iconBg: '#E0E7FF',
      route: '/(tabs)/progress',
    },
  ];

  const settingsItems: MenuItem[] = [
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Award,
      iconColor: '#F59E0B',
      iconBg: '#FEF3C7',
    },
    {
      id: 'privacy',
      label: 'Privacy & Security',
      icon: Trophy,
      iconColor: '#10B981',
      iconBg: '#D1FAE5',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: Star,
      iconColor: '#2563EB',
      iconBg: '#DBEAFE',
    },
  ];

  const handleMenuPress = (item: MenuItem) => {
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your progress will be saved to your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with gradient-like solid primary background */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            {profile?.is_premium && !isGuest && (
              <View style={styles.avatarCrown}>
                <Crown size={18} color="#FBBF24" />
              </View>
            )}
          </View>

          {/* Name and email */}
          <Text style={styles.displayName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.emailText} numberOfLines={1}>
            {userEmail}
          </Text>

          {/* Badges row */}
          <View style={styles.badgeRow}>
            {isGuest && (
              <View style={styles.guestBadge}>
                <Text style={styles.guestBadgeText}>Guest</Text>
              </View>
            )}
            {profile?.is_premium && !isGuest && (
              <View style={styles.premiumBadge}>
                <Crown size={12} color="#FBBF24" />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard} padding={14}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.warningLight }]}>
            <Flame size={20} color="#EA580C" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{studyStreak}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
        </Card>

        <Card style={styles.statCard} padding={14}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Star size={20} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{xpPoints.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>XP</Text>
        </Card>

        <Card style={styles.statCard} padding={14}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.accent + '33' }]}>
            <Coins size={20} color={colors.accent} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{coins.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Coins</Text>
        </Card>

        <Card style={styles.statCard} padding={14}>
          <View style={[styles.statIconWrap, { backgroundColor: colors.successLight }]}>
            <Award size={20} color={colors.success} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{badgesCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Badges</Text>
        </Card>
      </View>

      {/* Dark/Light mode toggle card */}
      <Card style={styles.themeCard} padding={16}>
        <View style={styles.themeRow}>
          <View style={[styles.themeIconWrap, { backgroundColor: colors.primaryLight }]}>
            {theme === 'dark' ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
          </View>
          <View style={styles.themeTextWrap}>
            <Text style={[styles.themeTitle, { color: colors.text }]}>
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </Text>
            <Text style={[styles.themeSubtitle, { color: colors.textSecondary }]}>
              {theme === 'dark' ? 'Easy on the eyes at night' : 'Bright and clear during the day'}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleTheme}
            style={[
              styles.toggleTrack,
              {
                backgroundColor: theme === 'dark' ? colors.primary : colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                {
                  backgroundColor: '#FFFFFF',
                  transform: [{ translateX: theme === 'dark' ? 24 : 0 }],
                },
              ]}
            />
          </TouchableOpacity>
        </View>
      </Card>

      {/* Menu items */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>My Content</Text>
      </View>
      <Card style={styles.menuCard} padding={4}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.6}
              onPress={() => handleMenuPress(item)}
              style={[
                styles.menuItem,
                index !== menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.iconBg }]}>
                <Icon size={18} color={item.iconColor} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              <ChevronRight size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* Settings items */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
      </View>
      <Card style={styles.menuCard} padding={4}>
        {settingsItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.6}
              onPress={() => handleMenuPress(item)}
              style={[
                styles.menuItem,
                index !== settingsItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.iconBg }]}>
                <Icon size={18} color={item.iconColor} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              <ChevronRight size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* Achievements horizontal scroll */}
      {stats.achievements.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
            <Text style={[styles.achievementCount, { color: colors.textSecondary }]}>
              {stats.achievements.length} earned
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsScroll}
          >
            {stats.achievements.map((achievement) => (
              <Card key={achievement.id} style={styles.achievementCard} padding={14}>
                <View style={[styles.achievementIcon, { backgroundColor: colors.warningLight }]}>
                  <Award size={24} color={colors.warning} />
                </View>
                <Text style={[styles.achievementName, { color: colors.text }]} numberOfLines={2}>
                  {achievement.badge_name}
                </Text>
                <View style={[styles.achievementBadgeTag, { backgroundColor: colors.successLight }]}>
                  <Text style={[styles.achievementBadgeText, { color: colors.success }]}>Earned</Text>
                </View>
              </Card>
            ))}
          </ScrollView>
        </>
      )}

      {/* Sign Out button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleSignOut}
        style={[styles.signOutButton, { backgroundColor: colors.errorLight }]}
      >
        <LogOut size={20} color={colors.error} />
        <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
      </TouchableOpacity>

      {/* Version text */}
      <Text style={[styles.versionText, { color: colors.textTertiary }]}>StudyGenius AI v1.0.0</Text>
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
  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontFamily: 'Inter-Bold',
  },
  avatarCrown: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  displayName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  emailText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  guestBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 8,
  },
  premiumBadgeText: {
    color: '#FBBF24',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    paddingVertical: 16,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  // Theme toggle card
  themeCard: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  themeTextWrap: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  themeSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  achievementCount: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  // Menu card
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  // Achievements scroll
  achievementsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
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
  achievementBadgeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  achievementBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  // Sign out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  // Version
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 8,
  },
});
