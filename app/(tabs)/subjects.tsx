import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BookOpen, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme-context';
import { useSubjects } from '@/lib/use-subjects';
import { Card } from '@/components/Card';

export default function SubjectsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { subjects, loading } = useSubjects();

  const handleSelectSubject = (subjectId: string) => {
    router.push('/(tabs)/tutor?subject=' + subjectId);
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Subjects
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: colors.textSecondary }]}
        >
          Choose a subject to start learning
        </Text>
      </View>

      {/* Subjects list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : subjects.length === 0 ? (
          <View style={styles.centerContent}>
            <View
              style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}
            >
              <BookOpen size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No subjects available
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              Check back later for new subjects
            </Text>
          </View>
        ) : (
          subjects.map((subject) => (
            <Card key={subject.id} style={styles.subjectCard}>
              <TouchableOpacity
                style={styles.subjectRow}
                onPress={() => handleSelectSubject(subject.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.subjectIcon,
                    { backgroundColor: subject.color },
                  ]}
                >
                  <BookOpen size={22} color="#FFFFFF" />
                </View>

                <View style={styles.subjectInfo}>
                  <Text
                    style={[styles.subjectName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {subject.name}
                  </Text>
                  {subject.description ? (
                    <Text
                      style={[
                        styles.subjectDescription,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {subject.description}
                    </Text>
                  ) : null}
                </View>

                <ChevronRight size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  subjectCard: {
    marginBottom: 12,
    padding: 16,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    marginBottom: 2,
  },
  subjectDescription: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    flex: 1,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});
