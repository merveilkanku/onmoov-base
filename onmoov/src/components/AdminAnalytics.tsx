import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, Users, CheckCircle, Star, MessageSquare, Loader2, BookOpen, Clock } from 'lucide-react';

interface CourseStats {
  id: string;
  title: string;
  totalEnrollments: number;
  averageProgress: number;
  completedCount: number;
  averageRating: number;
  totalComments: number;
}

interface RecentActivity {
  id: string;
  type: 'review' | 'comment';
  content: string;
  rating?: number;
  userName: string;
  courseTitle: string;
  createdAt: string;
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CourseStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalEnrollments: 0,
    totalCompletions: 0,
    averageRating: 0,
    totalComments: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      setLoading(true);

      // 1. Fetch all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title');
      
      if (coursesError) throw coursesError;
      if (!coursesData) return;

      // 2. Fetch enrollments
      const { data: enrollmentsData } = await supabase
        .from('course_enrollments')
        .select('course_id, progress, completed');

      // 3. Fetch reviews
      const { data: reviewsData } = await supabase
        .from('course_reviews')
        .select(`
          id,
          course_id,
          rating,
          comment,
          created_at,
          profiles:user_id(full_name)
        `)
        .order('created_at', { ascending: false });

      // 4. Fetch comments
      const { data: commentsData } = await supabase
        .from('course_comments')
        .select(`
          id,
          content,
          created_at,
          profiles:user_id(full_name),
          course_lessons!inner (
            title,
            course_modules!inner (
              course_id,
              courses (title)
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Calculate stats per course
      let totalEnrolls = 0;
      let totalComps = 0;
      let sumRatings = 0;
      let totalRevs = 0;
      let totalComms = commentsData?.length || 0;

      const courseStats: CourseStats[] = coursesData.map(course => {
        const courseEnrollments = enrollmentsData?.filter(e => e.course_id === course.id) || [];
        const enrollCount = courseEnrollments.length;
        const completedCount = courseEnrollments.filter(e => e.completed).length;
        
        const avgProgress = enrollCount > 0 
          ? courseEnrollments.reduce((acc, curr) => acc + (curr.progress || 0), 0) / enrollCount 
          : 0;

        const courseReviews = reviewsData?.filter(r => r.course_id === course.id) || [];
        const reviewCount = courseReviews.length;
        const avgRating = reviewCount > 0
          ? courseReviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount
          : 0;

        const courseComments = commentsData?.filter(c => 
          (c.course_lessons as any)?.course_modules?.course_id === course.id
        ) || [];

        totalEnrolls += enrollCount;
        totalComps += completedCount;
        sumRatings += courseReviews.reduce((acc, curr) => acc + curr.rating, 0);
        totalRevs += reviewCount;

        return {
          id: course.id,
          title: course.title,
          totalEnrollments: enrollCount,
          averageProgress: Math.round(avgProgress),
          completedCount,
          averageRating: Number(avgRating.toFixed(1)),
          totalComments: courseComments.length
        };
      });

      courseStats.sort((a, b) => b.totalEnrollments - a.totalEnrollments);

      // Compile recent activity
      const activities: RecentActivity[] = [];
      
      reviewsData?.forEach(r => {
        if (r.comment) {
          const course = coursesData.find(c => c.id === r.course_id);
          activities.push({
            id: `rev_${r.id}`,
            type: 'review',
            content: r.comment,
            rating: r.rating,
            userName: (r.profiles as any)?.full_name || 'Utilisateur',
            courseTitle: course?.title || 'Formation',
            createdAt: r.created_at
          });
        }
      });

      commentsData?.forEach(c => {
        const courseTitle = (c.course_lessons as any)?.course_modules?.courses?.title || 'Formation';
        activities.push({
          id: `com_${c.id}`,
          type: 'comment',
          content: c.content,
          userName: (c.profiles as any)?.full_name || 'Utilisateur',
          courseTitle: courseTitle,
          createdAt: c.created_at
        });
      });

      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setStats(courseStats);
      setRecentActivity(activities.slice(0, 10)); // Top 10 recent
      setGlobalStats({
        totalEnrollments: totalEnrolls,
        totalCompletions: totalComps,
        averageRating: totalRevs > 0 ? Number((sumRatings / totalRevs).toFixed(1)) : 0,
        totalComments: totalComms
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-meta-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Global Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-meta-blue dark:text-blue-400 rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Inscriptions totales</p>
            <p className="text-3xl font-bold text-meta-dark dark:text-white">{globalStats.totalEnrollments}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Formations terminées</p>
            <p className="text-3xl font-bold text-meta-dark dark:text-white">{globalStats.totalCompletions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-500 dark:text-yellow-400 rounded-xl">
            <Star className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Note moyenne</p>
            <p className="text-3xl font-bold text-meta-dark dark:text-white">{globalStats.averageRating} / 5</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Commentaires</p>
            <p className="text-3xl font-bold text-meta-dark dark:text-white">{globalStats.totalComments}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Course by Course Breakdown */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-meta-dark dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-meta-blue dark:text-blue-400" />
              Statistiques par formation
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Formation</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm text-center">Inscrits</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm text-center">Progression moy.</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm text-center">Terminés</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm text-center">Note</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm text-center">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {stats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Aucune donnée disponible
                    </td>
                  </tr>
                ) : (
                  stats.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-meta-blue dark:text-blue-400" />
                          </div>
                          <span className="font-medium text-meta-dark dark:text-white line-clamp-1">{course.title}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-medium text-gray-700 dark:text-gray-300">
                        {course.totalEnrollments}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-meta-blue dark:bg-blue-500 rounded-full"
                              style={{ width: `${course.averageProgress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{course.averageProgress}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-medium text-green-600 dark:text-green-400">
                        {course.completedCount}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-yellow-500 dark:text-yellow-400 font-medium">
                          <Star className="w-4 h-4 fill-current" />
                          {course.averageRating > 0 ? course.averageRating : '-'}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                          <MessageSquare className="w-4 h-4" />
                          {course.totalComments}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-meta-dark dark:text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-meta-blue dark:text-blue-400" />
              Activité récente
            </h2>
          </div>
          <div className="p-6 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
            <div className="space-y-6">
              {recentActivity.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aucune activité récente</p>
              ) : (
                recentActivity.map(activity => (
                  <div key={activity.id} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'review' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-500 dark:text-yellow-400' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    }`}>
                      {activity.type === 'review' ? <Star className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 dark:text-white">{activity.userName}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">sur</span>
                        <span className="text-sm font-medium text-meta-blue dark:text-blue-400 line-clamp-1">{activity.courseTitle}</span>
                      </div>
                      {activity.type === 'review' && activity.rating && (
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < activity.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-700'}`} 
                            />
                          ))}
                        </div>
                      )}
                      <p className="text-gray-600 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                        {activity.content}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(activity.createdAt).toLocaleDateString('fr-FR', { 
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
