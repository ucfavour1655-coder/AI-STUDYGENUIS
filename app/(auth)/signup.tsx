import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Header } from '@/components/Header';
import { Brain, Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';

export default function SignupScreen() {
  const { colors } = useTheme();
  const { signUp } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!displayName || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await signUp(email, password, displayName);
    setLoading(false);
    if (error) {
      setError(error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Brain size={48} color="#FFFFFF" strokeWidth={2} />
          </View>

          <Header title="Create Account" subtitle="Start your learning journey with StudyGenius AI" size="xl" />

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <User size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <Input
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Full name"
                autoCapitalize="words"
                style={styles.inputWithIcon}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Mail size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                keyboardType="email-address"
                style={styles.inputWithIcon}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Password (min 6 characters)"
                secureTextEntry={!showPassword}
                style={styles.inputWithIcon}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.textTertiary} />
                ) : (
                  <Eye size={20} color={colors.textTertiary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Button onPress={handleSignup} loading={loading} size="large" style={styles.button}>
            Create Account
          </Button>

          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.signupLink, { color: colors.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    minHeight: '100%',
  },
  container: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  inputContainer: {
    gap: 14,
    marginTop: 24,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: 44,
    paddingRight: 44,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    zIndex: 1,
  },
  button: {
    marginTop: 24,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  signupLink: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  errorBox: {
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});
