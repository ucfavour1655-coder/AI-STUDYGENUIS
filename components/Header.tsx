import { Text, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme-context';

interface HeaderProps {
  title: string;
  subtitle?: string;
  size?: 'small' | 'medium' | 'large' | 'xl';
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function Header({ title, subtitle, size = 'large', color, align = 'left' }: HeaderProps) {
  const { colors } = useTheme();

  const sizes = {
    small: 18,
    medium: 22,
    large: 28,
    xl: 34,
  };

  return (
    <>
      <Text
        style={[
          styles.title,
          {
            fontSize: sizes[size],
            color: color || colors.text,
            textAlign: align,
          },
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
              textAlign: align,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    lineHeight: 22,
  },
});
