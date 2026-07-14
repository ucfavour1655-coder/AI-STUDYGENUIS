import { Tabs } from 'expo-router';
import { useTheme } from '@/lib/theme-context';
import { Home, Brain, ClipboardList, Calendar, BarChart3 } from 'lucide-react-native';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter-Medium',
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ size, color }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen name="tutor" options={{ title: 'AI Tutor', tabBarIcon: ({ size, color }) => <Brain size={size} color={color} /> }} />
      <Tabs.Screen name="quiz" options={{ title: 'Quizzes', tabBarIcon: ({ size, color }) => <ClipboardList size={size} color={color} /> }} />
      <Tabs.Screen name="planner" options={{ title: 'Planner', tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} /> }} />
      <Tabs.Screen name="notes" options={{ href: null, title: 'Notes' }} />
      <Tabs.Screen name="flashcards" options={{ href: null, title: 'Flashcards' }} />
      <Tabs.Screen name="progress" options={{ href: null, title: 'Progress' }} />
      <Tabs.Screen name="subjects" options={{ href: null, title: 'Subjects' }} />
      <Tabs.Screen name="exams" options={{ href: null, title: 'Exams' }} />
      <Tabs.Screen name="writing" options={{ href: null, title: 'Writing' }} />
      <Tabs.Screen name="homework" options={{ href: null, title: 'Homework' }} />
      <Tabs.Screen name="scanner" options={{ href: null, title: 'Scanner' }} />
    </Tabs>
  );
}
