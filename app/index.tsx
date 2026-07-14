import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/lib/theme-context';

export default function Index() {
  const { session, isGuest, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (session || isGuest) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
