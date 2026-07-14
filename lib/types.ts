export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  education_level: string;
  daily_goal_minutes: number;
  xp_points: number;
  coins: number;
  study_streak: number;
  last_study_date: string | null;
  is_premium: boolean;
  is_guest: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  is_active: boolean;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  subject_id: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  subject?: Subject | null;
}

export interface Flashcard {
  id: string;
  user_id: string;
  subject_id: string | null;
  front: string;
  back: string;
  difficulty: string;
  interval_days: number;
  next_review_date: string;
  review_count: number;
  is_difficult: boolean;
  created_at: string;
  subject?: Subject | null;
}

export interface QuizQuestion {
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer';
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  difficulty: string;
  questions: QuizQuestion[];
  score: number | null;
  total_questions: number;
  completed_at: string | null;
  created_at: string;
  subject?: Subject | null;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id: string | null;
  duration_minutes: number;
  activity_type: string;
  created_at: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  subject_id: string | null;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  is_completed: boolean;
  reminder_enabled: boolean;
  notes: string | null;
  created_at: string;
  subject?: Subject | null;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_id: string;
  badge_name: string;
  badge_icon: string;
  earned_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  chat_type: string;
  role: 'user' | 'assistant';
  content: string;
  subject_id: string | null;
  created_at: string;
}
