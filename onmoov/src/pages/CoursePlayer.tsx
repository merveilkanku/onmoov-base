import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, PlayCircle, FileText, Headphones, CheckCircle, 
  ChevronLeft, ChevronRight, Menu, X, Loader2, Lock, MessageSquare, Send, HelpCircle,
  Sun, Moon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/ThemeContext';
import type { Course, CourseModule, CourseLesson, Enrollment, LessonProgress, CourseComment, CourseQuiz } from '../types';
import toast from 'react-hot-toast';
import AITutor from '../components/AITutor';

export default function CoursePlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [currentLesson, setCurrentLesson] = useState<CourseLesson | null>(null);
  const [progressData, setProgressData] = useState<Record<string, LessonProgress>>({});
  
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [quizzes, setQuizzes] = useState<CourseQuiz[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id]);

  useEffect(() => {
    if (currentLesson) {
      fetchLessonData(currentLesson.id);
    }
  }, [currentLesson]);

  async function fetchLessonData(lessonId: string) {
    try {
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
      // Fetch comments
      const { data: commentsData } = await supabase
        .from('course_comments')
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });
      
      if (commentsData) setComments(commentsData);

      // Fetch quizzes
      const { data: quizzesData } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('lesson_id', lessonId);
      
      if (quizzesData) {
        setQuizzes(quizzesData);
        setQuizAnswers({});
        setQuizSubmitted(false);
      }
    } catch (error) {
      console.error('Error fetching lesson data:', error);
    }
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentLesson) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { data, error } = await supabase
        .from('course_comments')
        .insert({
          lesson_id: currentLesson.id,
          user_id: session.session.user.id,
          content: newComment.trim()
        })
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .single();

      if (error) throw error;
      
      if (data) {
        setComments([data, ...comments]);
        setNewComment('');
        toast.success('Commentaire ajouté');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  const handleQuizSubmit = () => {
    let score = 0;
    quizzes.forEach(quiz => {
      if (quizAnswers[quiz.id] === quiz.correct_option_index) {
        score++;
      }
    });
    setQuizSubmitted(true);
    
    const percentage = Math.round((score / quizzes.length) * 100);
    setQuizScore(percentage);
    if (percentage >= 80) {
      toast.success(`Félicitations ! Vous avez réussi le quiz avec ${percentage}% de bonnes réponses.`);
      markLessonComplete();
    } else {
      toast.error(`Vous avez obtenu ${percentage}%. Il faut 80% pour valider ce quiz. Réessayez !`);
    }
  };

  const handleRetryQuiz = () => {
    setQuizSubmitted(false);
    setQuizAnswers({});
    setQuizScore(null);
  };

  async function fetchCourseData() {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast.error('Veuillez vous connecter pour accéder au cours');
        navigate(`/formations/${id}`);
        return;
      }

      // Fetch enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .eq('course_id', id)
        .eq('user_id', session.session.user.id)
        .single();

      if (enrollmentError || !enrollmentData) {
        toast.error('Vous n\'êtes pas inscrit à cette formation');
        navigate(`/formations/${id}`);
        return;
      }

      if (enrollmentData.payment_status === 'pending') {
        toast.error('Veuillez finaliser votre paiement pour accéder à cette formation');
        navigate(`/formations/${id}`);
        return;
      }

      setEnrollment(enrollmentData);

      // Fetch course
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      setCourse(courseData);

      // Fetch modules and lessons
      const { data: modulesData } = await supabase
        .from('course_modules')
        .select(`
          *,
          lessons:course_lessons(*)
        `)
        .eq('course_id', id)
        .order('order', { ascending: true });

      const sortedModules = modulesData?.map(m => ({
        ...m,
        lessons: m.lessons?.sort((a: any, b: any) => a.order - b.order) || []
      })) || [];
      setModules(sortedModules);

      // Fetch progress
      const { data: progressList } = await supabase
        .from('course_progress')
        .select('*')
        .eq('enrollment_id', enrollmentData.id);

      const progressMap: Record<string, LessonProgress> = {};
      progressList?.forEach(p => {
        progressMap[p.lesson_id] = p;
      });
      setProgressData(progressMap);

      // Set initial lesson
      if (sortedModules.length > 0 && sortedModules[0].lessons && sortedModules[0].lessons.length > 0) {
        // Find first uncompleted lesson, or just the first one
        let firstUncompleted: CourseLesson | null = null;
        for (const m of sortedModules) {
          for (const l of m.lessons || []) {
            if (!progressMap[l.id]) {
              firstUncompleted = l;
              break;
            }
          }
          if (firstUncompleted) break;
        }
        setCurrentLesson(firstUncompleted || sortedModules[0].lessons[0]);
      }

    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Erreur lors du chargement de la formation');
    } finally {
      setLoading(false);
    }
  }

  const handleLessonSelect = (lesson: CourseLesson) => {
    setCurrentLesson(lesson);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const markLessonComplete = async () => {
    if (!currentLesson || !enrollment) return;

    try {
      const existingProgress = progressData[currentLesson.id];
      
      if (existingProgress) {
        const { data, error } = await supabase
          .from('course_progress')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', existingProgress.id)
          .select()
          .single();
        if (error) throw error;
        setProgressData(prev => ({ ...prev, [currentLesson.id]: data }));
      } else {
        const { data, error } = await supabase
          .from('course_progress')
          .insert([{
            user_id: enrollment.user_id,
            lesson_id: currentLesson.id,
            completed_at: new Date().toISOString()
          }])
          .select()
          .single();
        if (error) throw error;
        setProgressData(prev => ({ ...prev, [currentLesson.id]: data }));
      }

      // Update overall progress
      updateOverallProgress();
      toast.success('Leçon terminée !');

      // Go to next lesson
      goToNextLesson();

    } catch (error) {
      console.error('Error marking complete:', error);
      toast.error('Erreur lors de la sauvegarde de la progression');
    }
  };

  const updateOverallProgress = async () => {
    if (!enrollment || !modules.length) return;

    let totalLessons = 0;
    let completedLessons = 0;

    modules.forEach(m => {
      m.lessons?.forEach(l => {
        totalLessons++;
        if (progressData[l.id]?.completed_at || l.id === currentLesson?.id) {
          completedLessons++;
        }
      });
    });

    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    try {
      await supabase
        .from('course_enrollments')
        .update({ 
          progress, 
          status: progress === 100 ? 'completed' : 'enrolled',
          completed_at: progress === 100 ? new Date().toISOString() : null
        })
        .eq('id', enrollment.id);
      
      setEnrollment(prev => prev ? { ...prev, progress, status: progress === 100 ? 'completed' : 'enrolled' } : null);

      if (progress === 100 && enrollment.status !== 'completed') {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.user) {
          // Award badge
          await supabase.from('user_badges').insert({
            user_id: session.session.user.id,
            badge_type: `course_completed_${course?.id}`
          }).select().single();

          // Send notification
          await supabase.from('notifications').insert({
            user_id: session.session.user.id,
            title: 'Félicitations !',
            message: `Vous avez terminé la formation "${course?.title}".`,
            link: '/achievements'
          });

          toast.success('Formation terminée ! Vous avez débloqué un nouveau badge.');
        }
      }
    } catch (error) {
      console.error('Error updating overall progress:', error);
    }
  };

  const goToNextLesson = () => {
    if (!currentLesson) return;

    let foundCurrent = false;
    for (const m of modules) {
      for (const l of m.lessons || []) {
        if (foundCurrent) {
          setCurrentLesson(l);
          return;
        }
        if (l.id === currentLesson.id) {
          foundCurrent = true;
        }
      }
    }
  };

  const goToPrevLesson = () => {
    if (!currentLesson) return;

    let prevLesson: CourseLesson | null = null;
    for (const m of modules) {
      for (const l of m.lessons || []) {
        if (l.id === currentLesson.id && prevLesson) {
          setCurrentLesson(prevLesson);
          return;
        }
        prevLesson = l;
      }
    }
  };

  const getLessonIcon = (type: string, completed: boolean) => {
    if (completed) return <CheckCircle className="w-5 h-5 text-green-500" />;
    switch (type) {
      case 'video': return <PlayCircle className="w-5 h-5 text-meta-blue" />;
      case 'pdf': return <FileText className="w-5 h-5 text-meta-blue" />;
      case 'audio': return <Headphones className="w-5 h-5 text-meta-blue" />;
      default: return <BookOpen className="w-5 h-5 text-meta-blue" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-meta-dark">
        <Loader2 className="w-12 h-12 animate-spin text-meta-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-meta-dark text-meta-dark dark:text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-meta-dark border-b border-gray-100 dark:border-white/10 flex items-center justify-between px-4 flex-shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link to={`/formations/${id}`} className="text-gray-500 dark:text-gray-400 hover:text-meta-blue dark:hover:text-white transition-colors flex-shrink-0">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-bold text-base sm:text-lg truncate max-w-[150px] sm:max-w-md">{course?.title}</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Progression</span>
            <div className="w-24 lg:w-32 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-meta-blue transition-all duration-500"
                style={{ width: `${enrollment?.progress || 0}%` }}
              />
            </div>
            <span className="font-bold">{enrollment?.progress || 0}%</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={toggleDarkMode}
              className="text-gray-500 dark:text-gray-400 hover:text-meta-blue dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-meta-blue dark:hover:text-white"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside 
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed lg:static inset-y-0 left-0 w-72 sm:w-80 bg-white dark:bg-meta-dark border-r border-gray-100 dark:border-white/10 z-30 flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 dark:border-white/10">
                <h2 className="font-bold text-lg">Contenu du cours</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {modules.map((module, mIdx) => (
                  <div key={module.id} className="space-y-2">
                    <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Module {mIdx + 1}: {module.title}
                    </h3>
                    <div className="space-y-1">
                      {module.lessons?.map((lesson, lIdx) => {
                        const isCompleted = !!progressData[lesson.id]?.completed_at;
                        const isActive = currentLesson?.id === lesson.id;
                        
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleLessonSelect(lesson)}
                            className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-colors ${
                              isActive 
                                ? 'bg-meta-blue/10 dark:bg-meta-blue/20 border border-meta-blue/20 dark:border-meta-blue/30 text-meta-blue dark:text-white' 
                                : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {getLessonIcon(lesson.type, isCompleted)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-meta-blue dark:text-white' : ''}`}>
                                {lIdx + 1}. {lesson.title}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-2">
                                <span className="capitalize">{lesson.type}</span>
                                {lesson.duration_minutes && <span>• {lesson.duration_minutes} min</span>}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden relative z-0">
          {currentLesson ? (
            <>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto w-full p-4 lg:p-8">
                  {/* Content Player */}
                  <div className="bg-black rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl mb-8">
                    {currentLesson.type === 'video' && currentLesson.content_url && (
                      <div className="aspect-video relative group">
                        <video
                          ref={videoRef}
                          src={currentLesson.content_url}
                          controls
                          controlsList="nodownload"
                          onContextMenu={(e) => e.preventDefault()}
                          className="w-full h-full object-contain"
                          onEnded={markLessonComplete}
                        >
                          Votre navigateur ne supporte pas la lecture de vidéos.
                        </video>
                        {/* Protection overlay to prevent right click on video area */}
                        <div className="absolute inset-0 pointer-events-none" onContextMenu={(e) => e.preventDefault()} />
                      </div>
                    )}

                    {currentLesson.type === 'pdf' && currentLesson.content_url && (
                      <div className="h-[70vh] relative bg-white">
                        {/* Using iframe with toolbar=0 to hide download button. Not perfect DRM, but good enough for MVP */}
                        <iframe 
                          src={`${currentLesson.content_url}#toolbar=0&navpanes=0`}
                          className="w-full h-full border-0"
                          title={currentLesson.title}
                          onContextMenu={(e) => e.preventDefault()}
                        />
                        {/* Transparent overlay to prevent right click */}
                        <div className="absolute inset-0 pointer-events-none" onContextMenu={(e) => e.preventDefault()} />
                      </div>
                    )}

                    {currentLesson.type === 'audio' && currentLesson.content_url && (
                      <div className="p-12 flex flex-col items-center justify-center bg-gray-100 dark:bg-meta-dark/50">
                        <Headphones className="w-24 h-24 text-meta-blue mb-8 opacity-50" />
                        <audio
                          src={currentLesson.content_url}
                          controls
                          controlsList="nodownload"
                          onContextMenu={(e) => e.preventDefault()}
                          className="w-full max-w-md"
                          onEnded={markLessonComplete}
                        >
                          Votre navigateur ne supporte pas la lecture audio.
                        </audio>
                      </div>
                    )}

                    {currentLesson.type === 'text' && (
                      <div className="p-8 bg-white dark:bg-meta-dark/50 min-h-[40vh]">
                        <div 
                          className="prose dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: currentLesson.text_content || '' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Lesson Details */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-meta-dark dark:text-white leading-tight">{currentLesson.title}</h2>
                      {currentLesson.text_content && currentLesson.type !== 'text' && (
                        <div 
                          className="prose dark:prose-invert prose-sm max-w-none text-gray-600 dark:text-gray-400 mt-4"
                          dangerouslySetInnerHTML={{ __html: currentLesson.text_content }}
                        />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <button
                        onClick={goToPrevLesson}
                        className="p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-meta-dark dark:text-white transition-colors"
                        title="Leçon précédente"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      {!progressData[currentLesson.id]?.completed_at ? (
                        <button
                          onClick={markLessonComplete}
                          className="px-6 py-3 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Terminer la leçon
                        </button>
                      ) : (
                        <button
                          onClick={goToNextLesson}
                          className="px-6 py-3 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl font-bold flex items-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Terminée
                        </button>
                      )}
                      
                      <button
                        onClick={goToNextLesson}
                        className="p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-meta-dark dark:text-white transition-colors"
                        title="Leçon suivante"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  {/* Quizzes Section */}
                  {quizzes.length > 0 && (
                    <div className="mt-12 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 lg:p-8">
                      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-meta-dark dark:text-white">
                        <HelpCircle className="w-6 h-6 text-meta-blue" />
                        Quiz de validation
                      </h3>
                      
                      <div className="space-y-8">
                        {quizzes.map((quiz, index) => (
                          <div key={quiz.id} className="bg-gray-50 dark:bg-black/20 rounded-xl p-6 border border-gray-100 dark:border-white/5">
                            <p className="text-lg font-medium mb-4 text-meta-dark dark:text-white">
                              <span className="text-meta-blue mr-2">{index + 1}.</span>
                              {quiz.question}
                            </p>
                            <div className="space-y-3">
                              {quiz.options.map((option, optIndex) => (
                                <label 
                                  key={optIndex}
                                  className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors border ${
                                    quizAnswers[quiz.id] === optIndex 
                                      ? 'bg-meta-blue/10 border-meta-blue text-meta-blue dark:text-white' 
                                      : 'bg-white dark:bg-white/5 border-gray-200 dark:border-transparent hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
                                  } ${quizSubmitted ? 'pointer-events-none' : ''}`}
                                >
                                  <input 
                                    type="radio" 
                                    name={`quiz-${quiz.id}`}
                                    value={optIndex}
                                    checked={quizAnswers[quiz.id] === optIndex}
                                    onChange={() => setQuizAnswers(prev => ({ ...prev, [quiz.id]: optIndex }))}
                                    className="hidden"
                                    disabled={quizSubmitted}
                                  />
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                    quizAnswers[quiz.id] === optIndex ? 'border-meta-blue' : 'border-gray-400 dark:border-gray-500'
                                  }`}>
                                    {quizAnswers[quiz.id] === optIndex && (
                                      <div className="w-2.5 h-2.5 rounded-full bg-meta-blue" />
                                    )}
                                  </div>
                                  {option}
                                  
                                  {quizSubmitted && quiz.correct_option_index === optIndex && (
                                    <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                                  )}
                                  {quizSubmitted && quizAnswers[quiz.id] === optIndex && quiz.correct_option_index !== optIndex && (
                                    <X className="w-5 h-5 text-red-500 ml-auto" />
                                  )}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {!quizSubmitted ? (
                        <button
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(quizAnswers).length !== quizzes.length}
                          className="mt-8 px-6 py-3 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          Valider mes réponses
                        </button>
                      ) : (
                        <div className="mt-8 p-6 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xl font-bold mb-2 text-meta-dark dark:text-white">
                                Résultat : {quizScore}%
                              </h4>
                              <p className={quizScore && quizScore >= 80 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {quizScore && quizScore >= 80 
                                  ? 'Félicitations, vous avez validé ce quiz !' 
                                  : 'Vous devez obtenir au moins 80% pour valider ce quiz.'}
                              </p>
                            </div>
                            {quizScore !== null && quizScore < 80 && (
                              <button
                                onClick={handleRetryQuiz}
                                className="px-6 py-3 bg-white dark:bg-white/10 border border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-white/20 text-meta-dark dark:text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                              >
                                Réessayer
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comments/Q&A Section */}
                  <div className="mt-12 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 lg:p-8">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-meta-dark dark:text-white">
                      <MessageSquare className="w-6 h-6 text-meta-blue" />
                      Questions et commentaires
                    </h3>
                    
                    <form onSubmit={handlePostComment} className="mb-8">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-meta-blue/10 dark:bg-meta-blue/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-meta-blue font-bold">
                            {enrollment?.profiles?.full_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Posez une question ou partagez votre avis sur cette leçon..."
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-meta-dark dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-meta-blue focus:border-meta-blue outline-none resize-none"
                            rows={3}
                          />
                          <div className="mt-3 flex justify-end">
                            <button
                              type="submit"
                              disabled={!newComment.trim()}
                              className="px-6 py-2 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <Send className="w-4 h-4" />
                              Envoyer
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                    
                    <div className="space-y-6">
                      {comments.length > 0 ? (
                        comments.map(comment => (
                          <div key={comment.id} className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-gray-500 dark:text-gray-300 font-bold">
                                {comment.profiles?.full_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div className="flex-1 bg-gray-50 dark:bg-black/20 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-meta-dark dark:text-gray-200">{comment.profiles?.full_name || 'Utilisateur'}</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-400 dark:text-gray-500 py-4">Soyez le premier à poser une question !</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <BookOpen className="w-16 h-16 text-gray-300 dark:text-meta-gray mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-bold text-gray-400">Sélectionnez une leçon pour commencer</h2>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {currentLesson && (
        <AITutor 
          lessonTitle={currentLesson.title} 
          lessonContent={currentLesson.text_content || 'Aucun contenu textuel pour cette leçon.'} 
        />
      )}
    </div>
  );
}