import { TextInput, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '@/lib/theme-context';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: TextStyle;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  keyboardType?: 'default' | 'email-address' | 'numeric';
}

export function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  style,
  autoCapitalize = 'none',
  keyboardType = 'default',
}: InputProps) {
  const { colors } = useTheme();

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      numberOfLines={numberOfLines}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      style={[
        styles.input,
        {
          backgroundColor: colors.surfaceSecondary,
          color: colors.text,
          borderColor: colors.border,
        },
        multiline && { textAlignVertical: 'top', minHeight: numberOfLines * 24 },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});
