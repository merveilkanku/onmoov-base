export interface Application {
  id: string;
  name: string;
  description: string;
  tag: string;
  image_url: string;
  download_url: string;
  status: 'draft' | 'published';
  downloads_count: number;
  created_at: string;
}

export type UserRole = 'super_admin' | 'admin' | 'trainer' | 'user';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
}

export interface TrainerApplication {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  experience: string;
  cover_letter: string;
  passport_photo_url: string | null;
  cv_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

export interface JobOffer {
  id: string;
  title: string;
  department: string;
  location: string;
  contract_type: string;
  description: string;
  requirements: string;
  status: 'open' | 'closed' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  resume_url: string | null;
  cover_letter_url: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  status: 'new' | 'screening' | 'interview' | 'technical_test' | 'offer' | 'hired' | 'rejected';
  notes: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
  job_offers?: {
    title: string;
  };
}

export interface SiteSettings {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  currency?: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  level: string;
  image_url: string;
  icon_name: string;
  status: 'draft' | 'published';
  is_paid: boolean;
  price: number;
  currency?: string;
  created_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
  lessons?: CourseLesson[];
}

export type LessonType = 'video' | 'pdf' | 'audio' | 'text';

export interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  type: LessonType;
  content_url: string | null;
  text_content: string | null;
  duration_minutes: number | null;
  order: number;
  created_at: string;
  progress?: LessonProgress;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'enrolled' | 'completed';
  progress: number;
  payment_status: 'pending' | 'paid' | 'free';
  enrolled_at: string;
  completed_at: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  certificate_url: string | null;
}

export interface CourseReview {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

export interface CourseComment {
  id: string;
  lesson_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

export interface CourseQuiz {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_option_index: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: string;
  earned_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}
