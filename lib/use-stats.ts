import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth-context';
import { Achievement } from './types';
import { achievementDefinitions, checkAchievements } from './ai-engine';

export interface UserStats {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  totalQuizzes: number;
  totalNotes: number;
  totalFlashcards: number;
  avgQuizScore: number;
  achievements: Achievement[];
  pendingAchievements: string[];
}

export function useUserStats() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    todayMinutes: 0,
    weekMinutes: 0,
    monthMinutes: 0,
    totalQuizzes: 0,
    totalNotes: 0,
    totalFlashcards: 0,
    avgQuizScore: 0,
    achievements: [],
    pendingAchievements: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [todaySessions, weekSessions, monthSessions, quizzes, notes, flashcards, achievements] = await Promise.all([
      supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id).gte('created_at', todayStart),
      supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id).gte('created_at', weekStart),
      supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id).gte('created_at', monthStart),
      supabase.from('quizzes').select('score, total_questions').eq('user_id', user.id).not('completed_at', 'is', null),
      supabase.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('achievements').select('*').eq('user_id', user.id),
    ]);

    const todayMin = (todaySessions.data || []).reduce((s: number, r: any) => s + (r.duration_minutes || 0), 0);
    const weekMin = (weekSessions.data || []).reduce((s: number, r: any) => s + (r.duration_minutes || 0), 0);
    const monthMin = (monthSessions.data || []).reduce((s: number, r: any) => s + (r.duration_minutes || 0), 0);
    const quizData = (quizzes.data || []) as any[];
    const completedQuizzes = quizData.filter((q) => q.score !== null);
    const avgScore = completedQuizzes.length > 0
      ? completedQuizzes.reduce((s, q) => s + (q.score / q.total_questions) * 100, 0) / completedQuizzes.length
      : 0;

    const earnedAchievements = (achievements.data || []) as Achievement[];
    const earnedIds = earnedAchievements.map((a) => a.badge_id);
    const newAchievements = checkAchievements({
      quizzes: quizData.length,
      streak: profile?.study_streak || 0,
      notes: notes.count || 0,
      flashcards: flashcards.count || 0,
      xp: profile?.xp_points || 0,
    });
    const pending = newAchievements.filter((id) => !earnedIds.includes(id));

    for (const badgeId of pending) {
      const def = achievementDefinitions.find((a) => a.badge_id === badgeId);
      if (def) {
        await supabase.from('achievements').insert({
          user_id: user.id,
          badge_id: def.badge_id,
          badge_name: def.badge_name,
          badge_icon: def.badge_icon,
        });
      }
    }

    if (pending.length > 0) {
      const { data: updatedAchievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);
      setStats({
        todayMinutes: todayMin,
        weekMinutes: weekMin,
        monthMinutes: monthMin,
        totalQuizzes: quizData.length,
        totalNotes: notes.count || 0,
        totalFlashcards: flashcards.count || 0,
        avgQuizScore: avgScore,
        achievements: (updatedAchievements || []) as Achievement[],
        pendingAchievements: pending,
      });
    } else {
      setStats({
        todayMinutes: todayMin,
        weekMinutes: weekMin,
        monthMinutes: monthMin,
        totalQuizzes: quizData.length,
        totalNotes: notes.count || 0,
        totalFlashcards: flashcards.count || 0,
        avgQuizScore: avgScore,
        achievements: earnedAchievements,
        pendingAchievements: [],
      });
    }

    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

export async function logStudySession(userId: string, subjectId: string | null, minutes: number, activityType: string = 'study') {
  await supabase.from('study_sessions').insert({
    user_id: userId,
    subject_id: subjectId,
    duration_minutes: minutes,
    activity_type: activityType,
  });

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp_points, coins, study_streak, last_study_date')
    .eq('id', userId)
    .maybeSingle();

  if (profile) {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = profile.last_study_date;
    let newStreak = profile.study_streak;

    if (lastDate !== today) {
      if (lastDate) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (lastDate === yesterday) {
          newStreak = profile.study_streak + 1;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
    }

    const xpGain = Math.floor(minutes / 5) * 5;
    const coinGain = Math.floor(minutes / 10);

    await supabase.from('profiles').update({
      xp_points: (profile.xp_points || 0) + xpGain,
      coins: (profile.coins || 0) + coinGain,
      study_streak: newStreak,
      last_study_date: today,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);
  }
}
