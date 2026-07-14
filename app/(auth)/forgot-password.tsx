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
import { Brain, Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { resetPassword } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSent(true);
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.surface }]}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Brain size={48} color="#FFFFFF" strokeWidth={2} />
          </View>

          {sent ? (
            <View style={styles.sentContainer}>
              <View style={[styles.sentIcon, { backgroundColor: colors.successLight }]}>
                <CheckCircle size={48} color={colors.success} />
              </View>
              <Header title="Check Your Email" subtitle="We've sent a password reset link to your email address." size="large" />
              <Button onPress={() => router.replace('/(auth)/login')} style={styles.button}>
                Back to Login
              </Button>
            </View>
          ) : (
            <>
              <Header title="Forgot Password" subtitle="Enter your email and we'll send you a reset link." size="large" />

              {error && (
                <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              )}

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

              <Button onPress={handleReset} loading={loading} size="large" style={styles.button}>
                Send Reset Link
              </Button>
            </>
          )}
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    marginTop: 24,
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  button: {
    marginTop: 24,
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
  sentContainer: {
    alignItems: 'center',
  },
  sentIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
});
