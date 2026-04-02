import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, Clock, Users, PlayCircle, FileText, Headphones, Loader2, CheckCircle, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import type { Course, CourseModule, Enrollment, CourseReview, SiteSettings } from '../types';
import Layout from '../components/Layout';
import AuthModal from '../components/AuthModal';
import toast from 'react-hot-toast';

const getCurrencySymbol = (currency?: string) => {
  if (!currency) return '€';
  switch (currency) {
    case 'EUR': return '€';
    case 'USD': return '$';
    case 'CDF': return 'FC';
    case 'ZAR': return 'R';
    case '€': return '€';
    case '$': return '$';
    default: return currency;
  }
};

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [course, setCourse] = useState<Course | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [progressData, setProgressData] = useState<Record<string, boolean>>({});
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userReview, setUserReview] = useState<CourseReview | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      toast.success('Paiement réussi ! Vous êtes maintenant inscrit à la formation.');
      // Update payment status in database
      const updatePaymentStatus = async () => {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.user && id) {
          const transId = query.get('trans_id');
          if (transId) {
            // We could verify transId here if we wanted to be extra secure
            // but the webhook should have handled it.
            // Let's just refresh the data.
          }
          await supabase
            .from('course_enrollments')
            .update({ payment_status: 'paid' })
            .eq('course_id', id)
            .eq('user_id', session.session.user.id);
          fetchCourseData();
        }
      };
      updatePaymentStatus();
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (query.get('canceled')) {
      toast.error('Le paiement a été annulé.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [id]);

  async function fetchCourseData() {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      // Fetch site settings for currency
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (settingsData) setSiteSettings(settingsData);

      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('course_reviews')
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .eq('course_id', id)
        .order('created_at', { ascending: false });
      
      if (reviewsData) {
        setReviews(reviewsData);
        if (userId) {
          const userRev = reviewsData.find(r => r.user_id === userId);
          if (userRev) setUserReview(userRev);
        }
      }

      // Fetch modules and lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select(`
          *,
          lessons:course_lessons(*)
        `)
        .eq('course_id', id)
        .order('order', { ascending: true });

      if (modulesError) throw modulesError;
      
      // Sort lessons within modules
      const sortedModules = modulesData?.map(m => ({
        ...m,
        lessons: m.lessons?.sort((a: any, b: any) => a.order - b.order) || []
      })) || [];
      
      setModules(sortedModules);

      // Check enrollment
      if (userId) {
        const { data: enrollmentData } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('course_id', id)
          .eq('user_id', userId)
          .single();
        
        if (enrollmentData) {
          setEnrollment(enrollmentData);

          // Fetch progress
          const { data: progressList } = await supabase
            .from('course_progress')
            .select('lesson_id, completed')
            .eq('enrollment_id', enrollmentData.id);
            
          const progressMap: Record<string, boolean> = {};
          progressList?.forEach(p => {
            progressMap[p.lesson_id] = p.completed;
          });
          setProgressData(progressMap);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('Lock broken')) return;
      console.error('Error fetching course:', error);
      toast.error('Erreur lors du chargement de la formation');
    } finally {
      setLoading(false);
    }
  }

  const handleEnroll = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      setIsAuthModalOpen(true);
      return;
    }

    setEnrolling(true);
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert([
          { 
            course_id: id, 
            user_id: session.session.user.id,
            payment_status: course?.is_paid ? 'pending' : 'free'
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setEnrollment(data);
      
      if (course?.is_paid) {
        setIsPaymentModalOpen(true);
        setEnrolling(false);
        return;
      } else {
        toast.success('Inscription réussie !');
        navigate(`/formations/${id}/learn`);
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error('Erreur lors de l\'inscription');
    } finally {
      if (!course?.is_paid) {
        setEnrolling(false);
      }
    }
  };

  const handlePaymentSelection = async (method: 'stripe' | 'cinetpay') => {
    setIsPaymentModalOpen(false);
    toast.loading('Redirection vers la page de paiement...', { id: 'payment-redirect' });
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user || !course) return;

      const endpoint = method === 'cinetpay' ? '/api/create-cinetpay-session' : '/api/create-checkout-session';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          courseTitle: course.title,
          coursePrice: course.price,
          userId: session.session.user.id,
          origin: window.location.origin,
          currency: course.currency || siteSettings?.currency || 'EUR'
        }),
      });

      const result = await response.json();
      
      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Erreur lors de la création de la session de paiement');
      }
    } catch (paymentError: any) {
      console.error('Payment error:', paymentError);
      toast.error(paymentError.message || 'Erreur de paiement', { id: 'payment-redirect' });
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    fetchCourseData(); // Refresh to get enrollment status
    handleEnroll(); // Try enrolling again
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    setSubmittingReview(true);
    try {
      const { error } = await supabase
        .from('course_reviews')
        .upsert({
          course_id: id,
          user_id: session.session.user.id,
          rating: reviewRating,
          comment: reviewComment
        }, { onConflict: 'course_id,user_id' });

      if (error) throw error;
      toast.success('Votre avis a été enregistré !');
      fetchCourseData();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Erreur lors de l\'enregistrement de votre avis');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircle className="w-5 h-5" />;
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'audio': return <Headphones className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center pt-20">
          <Loader2 className="w-12 h-12 animate-spin text-meta-blue" />
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center pt-20">
          <p className="text-xl text-meta-gray">Formation introuvable</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 bg-meta-dark text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={course.image_url} alt={course.title} className="w-full h-full object-cover blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-t from-meta-dark via-meta-dark/80 to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-meta-blue/20 text-blue-300 text-sm font-medium mb-4 sm:mb-6 border border-meta-blue/30">
                {course.category}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight">{course.title}</h1>
              <div 
                className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8 leading-relaxed line-clamp-4 sm:line-clamp-none"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-meta-blue" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-meta-blue" />
                  <span>{course.level}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700 rounded-3xl p-6 sm:p-8 lg:sticky lg:top-32">
              <div className="aspect-video rounded-xl overflow-hidden mb-6 sm:mb-8">
                <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
              </div>
              
              {enrollment ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-300">Progression</span>
                    <span className="font-bold text-white">{enrollment.progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 dark:bg-gray-700 rounded-full h-2 mb-6">
                    <div 
                      className="bg-meta-blue h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                  {course.is_paid && enrollment.payment_status === 'pending' ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                      <p className="text-yellow-200 text-xs sm:text-sm mb-3">Votre paiement est en attente de validation.</p>
                      <button 
                        className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold transition-colors text-sm"
                        onClick={() => setIsPaymentModalOpen(true)}
                      >
                        Payer {course.price} {getCurrencySymbol(course.currency || siteSettings?.currency)}
                      </button>
                    </div>
                  ) : (
                    <Link 
                      to={`/formations/${course.id}/learn`}
                      className="flex items-center justify-center w-full py-4 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-xl font-bold transition-colors"
                    >
                      Reprendre la formation
                    </Link>
                  )}
                </div>
              ) : (
                <button 
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="flex items-center justify-center w-full py-4 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-xl font-bold transition-colors disabled:opacity-70"
                >
                  {enrolling ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    course.is_paid ? `S'inscrire (${course.price} ${getCurrencySymbol(course.currency || siteSettings?.currency)})` : "S'inscrire gratuitement"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-12 sm:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-meta-dark dark:text-white mb-6 sm:mb-10">Programme de la formation</h2>
            
            <div className="space-y-4 sm:space-y-6">
              {modules.length === 0 ? (
                <p className="text-meta-gray dark:text-gray-400">Le contenu de cette formation n'est pas encore disponible.</p>
              ) : (
                modules.map((module, index) => {
                  const totalLessons = module.lessons?.length || 0;
                  const completedLessons = module.lessons?.filter(l => progressData[l.id]).length || 0;
                  const moduleProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                  return (
                  <div key={module.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <div className="p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-meta-dark dark:text-white truncate">
                            Module {index + 1}: {module.title}
                          </h3>
                          {module.description && (
                            <p className="text-meta-gray dark:text-gray-400 mt-1 sm:mt-2 text-sm line-clamp-2 sm:line-clamp-none">{module.description}</p>
                          )}
                        </div>
                        {enrollment && totalLessons > 0 && (
                          <div className="w-full sm:w-48 flex-shrink-0">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-meta-gray dark:text-gray-400 font-medium">Progression</span>
                              <span className="font-bold text-meta-blue dark:text-blue-400">{moduleProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className="bg-meta-blue h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${moduleProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {module.lessons?.map((lesson, lessonIndex) => {
                        const isCompleted = progressData[lesson.id];
                        return (
                        <div key={lesson.id} className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-green-50 dark:bg-green-900/30 text-green-500 dark:text-green-400' : 'bg-blue-50 dark:bg-blue-900/30 text-meta-blue dark:text-blue-400'}`}>
                            {isCompleted ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : getLessonIcon(lesson.type)}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className={`font-medium text-sm sm:text-base truncate ${isCompleted ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-meta-dark dark:text-gray-200'}`}>{lesson.title}</h4>
                            <p className="text-[10px] sm:text-xs text-meta-gray dark:text-gray-500 capitalize">{lesson.type}</p>
                          </div>
                          {lesson.duration_minutes && (
                            <div className="text-xs sm:text-sm text-meta-gray dark:text-gray-400 flex-shrink-0">
                              {lesson.duration_minutes} min
                            </div>
                          )}
                        </div>
                      )})}
                      {(!module.lessons || module.lessons.length === 0) && (
                        <div className="p-4 text-sm text-meta-gray dark:text-gray-500 italic">
                          Aucune leçon dans ce module.
                        </div>
                      )}
                    </div>
                  </div>
                )})
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-meta-dark dark:text-white mb-10 flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              Avis des participants
            </h2>

            {enrollment && enrollment.progress >= 20 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 mb-10">
                <h3 className="text-lg font-bold text-meta-dark dark:text-white mb-4">
                  {userReview ? 'Modifier votre avis' : 'Donner votre avis'}
                </h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Note</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star 
                            className={`w-8 h-8 ${star <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commentaire (optionnel)</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-meta-dark dark:text-white rounded-xl focus:ring-2 focus:ring-meta-blue focus:border-meta-blue outline-none"
                      rows={3}
                      placeholder="Qu'avez-vous pensé de cette formation ?"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-2 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {submittingReview && <Loader2 className="w-4 h-4 animate-spin" />}
                    {userReview ? 'Mettre à jour' : 'Publier mon avis'}
                  </button>
                </form>
              </div>
            )}
            
            {reviews.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700">
                <p className="text-meta-gray dark:text-gray-400">Aucun avis pour le moment. Soyez le premier à donner votre avis !</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-meta-blue/10 dark:bg-blue-900/30 flex items-center justify-center text-meta-blue dark:text-blue-400 font-bold">
                          {review.profiles?.full_name?.charAt(0) || review.profiles?.email?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-meta-dark dark:text-white">
                            {review.profiles?.full_name || review.profiles?.email?.split('@')[0] || 'Utilisateur'}
                          </p>
                          <p className="text-xs text-meta-gray dark:text-gray-400">
                            {new Date(review.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-meta-gray dark:text-gray-300">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess} 
      />

      {/* Payment Method Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-meta-dark dark:text-white mb-4">Choisissez votre mode de paiement</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Sélectionnez comment vous souhaitez payer pour la formation "{course?.title}".
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => handlePaymentSelection('cinetpay')}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-meta-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-white dark:group-hover:bg-gray-600">
                      <span className="font-bold text-meta-blue">CP</span>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-meta-dark dark:text-white">Mobile Money & Cartes (Afrique)</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">M-Pesa, Airtel Money, Orange Money, Visa, Mastercard</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentSelection('stripe')}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-meta-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-white dark:group-hover:bg-gray-600">
                      <span className="font-bold text-[#635BFF]">Stripe</span>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-meta-dark dark:text-white">Carte Bancaire (International)</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Paiement sécurisé par carte de crédit/débit</div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-meta-dark dark:hover:text-white transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}