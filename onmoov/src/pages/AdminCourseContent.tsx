import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Save, X, GripVertical, 
  Video, FileText, Headphones, BookOpen, Loader2, HelpCircle,
  Sun, Moon, AlertCircle, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Course, CourseModule, CourseLesson, LessonType } from '../types';
import toast from 'react-hot-toast';
import { useTheme } from '../lib/ThemeContext';

export default function AdminCourseContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Module Form State
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [isSubmittingModule, setIsSubmittingModule] = useState(false);

  // Lesson Form State
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<LessonType>('video');
  const [lessonDuration, setLessonDuration] = useState('');
  const [lessonTextContent, setLessonTextContent] = useState('');
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, type: 'module' | 'lesson' } | null>(null);

  const SUPER_ADMIN_EMAIL = 'irmerveilkanku@gmail.com';
  const SECONDARY_ADMIN_EMAIL = 'herbestinformatique@gmail.com';

  useEffect(() => {
    checkAdminAndFetchData();
  }, [id]);

  async function checkAdminAndFetchData() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        if (sessionError.message?.includes('AbortError') || sessionError.message?.includes('Lock broken')) {
          return;
        }
        throw sessionError;
      }

      if (!session?.user) {
        navigate('/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        if (profileError.message?.includes('AbortError') || profileError.message?.includes('Lock broken')) {
          return;
        }
        console.error('Error fetching profile:', profileError);
      }

      const userEmail = session.user.email?.toLowerCase().trim();
      const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || userEmail === SECONDARY_ADMIN_EMAIL.toLowerCase().trim();
      const isSuperAdmin = profile?.role === 'super_admin' || userEmail === SUPER_ADMIN_EMAIL.toLowerCase().trim();
      const isTrainer = profile?.role === 'trainer' || isAdmin;

      if (!isTrainer && !isAdmin && !isSuperAdmin) {
        navigate('/');
        return;
      }

      await fetchCourseData();
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) return;
      console.error('Error checking auth:', error);
      navigate('/');
    }
  }

  async function fetchCourseData() {
    try {
      setLoading(true);
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) {
        if (courseError.message?.includes('AbortError') || courseError.message?.includes('Lock broken')) {
          return;
        }
        throw courseError;
      }
      setCourse(courseData);

      // Fetch modules and lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select(`
          *,
          lessons:course_lessons(*)
        `)
        .eq('course_id', id)
        .order('order', { ascending: true });

      if (modulesError) {
        if (modulesError.message?.includes('AbortError') || modulesError.message?.includes('Lock broken')) {
          return;
        }
        throw modulesError;
      }
      
      const sortedModules = modulesData?.map(m => ({
        ...m,
        lessons: m.lessons?.sort((a: any, b: any) => a.order - b.order) || []
      })) || [];
      
      setModules(sortedModules);
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) return;
      console.error('Error fetching course data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  // --- MODULE MANAGEMENT ---

  const resetModuleForm = () => {
    setEditingModuleId(null);
    setModuleTitle('');
    setModuleDescription('');
  };

  const handleEditModule = (module: CourseModule) => {
    setEditingModuleId(module.id);
    setModuleTitle(module.title);
    setModuleDescription(module.description || '');
    // Close lesson form if open
    resetLessonForm();
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;

    setIsSubmittingModule(true);
    try {
      if (editingModuleId && editingModuleId !== 'new') {
        const { error } = await supabase
          .from('course_modules')
          .update({
            title: moduleTitle,
            description: moduleDescription
          })
          .eq('id', editingModuleId);
        if (error) throw error;
        toast.success('Module mis à jour');
      } else {
        const newOrder = modules.length > 0 ? Math.max(...modules.map(m => m.order)) + 1 : 0;
        const { error } = await supabase
          .from('course_modules')
          .insert([{
            course_id: id,
            title: moduleTitle,
            description: moduleDescription,
            order: newOrder
          }]);
        if (error) throw error;
        toast.success('Module créé');
      }
      resetModuleForm();
      fetchCourseData();
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('Lock broken')) return;
      console.error('Error saving module:', error);
      toast.error('Erreur lors de la sauvegarde du module');
    } finally {
      setIsSubmittingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      // 1. Get all lessons in this module to delete their related records
      const { data: lessons, error: fetchLessonsError } = await supabase
        .from('course_lessons')
        .select('id')
        .eq('module_id', moduleId);
      
      if (fetchLessonsError) throw fetchLessonsError;

      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map(l => l.id);
        
        // 2. Delete quizzes for all lessons in this module
        const { error: quizzesError } = await supabase
          .from('course_quizzes')
          .delete()
          .in('lesson_id', lessonIds);
        if (quizzesError) console.warn('Error deleting quizzes:', quizzesError);
          
        // 3. Delete progress for all lessons in this module
        const { error: progressError } = await supabase
          .from('lesson_progress')
          .delete()
          .in('lesson_id', lessonIds);
        if (progressError) console.warn('Error deleting progress:', progressError);
          
        // 4. Delete the lessons
        const { error: lessonsDeleteError } = await supabase
          .from('course_lessons')
          .delete()
          .eq('module_id', moduleId);
        if (lessonsDeleteError) throw lessonsDeleteError;
      }

      // 5. Finally delete the module
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', moduleId);
      if (error) throw error;
      
      toast.success('Module supprimé avec succès');
      setDeleteConfirmation(null);
      fetchCourseData();
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('Lock broken')) return;
      console.error('Error deleting module:', error);
      toast.error(`Erreur lors de la suppression: ${error.message || 'Erreur inconnue'}`);
    }
  };

  // --- LESSON MANAGEMENT ---

  const resetLessonForm = () => {
    setEditingLessonId(null);
    setActiveModuleId(null);
    setLessonTitle('');
    setLessonType('video');
    setLessonDuration('');
    setLessonTextContent('');
    setLessonFile(null);
  };

  const handleAddLesson = (moduleId: string) => {
    resetModuleForm();
    resetLessonForm();
    setActiveModuleId(moduleId);
  };

  const handleEditLesson = (lesson: CourseLesson, moduleId: string) => {
    resetModuleForm();
    setEditingLessonId(lesson.id);
    setActiveModuleId(moduleId);
    setLessonTitle(lesson.title);
    setLessonType(lesson.type);
    setLessonDuration(lesson.duration_minutes?.toString() || '');
    setLessonTextContent(lesson.text_content || '');
    setLessonFile(null);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !activeModuleId) return;

    setIsSubmittingLesson(true);
    try {
      let contentUrl = undefined;

      // Upload file if provided
      if (lessonFile) {
        const uploadToast = toast.loading("Téléchargement du fichier en cours...");
        try {
          const fileExt = lessonFile.name.split('.').pop();
          const fileName = `lesson_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('app-files')
            .upload(fileName, lessonFile);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('app-files')
            .getPublicUrl(fileName);

          contentUrl = publicUrlData.publicUrl;
          toast.success("Fichier téléchargé avec succès", { id: uploadToast });
        } catch (err: any) {
          toast.error(`Erreur de téléchargement: ${err.message}`, { id: uploadToast });
          setIsSubmittingLesson(false);
          return;
        }
      } else if (!editingLessonId && ['video', 'pdf', 'audio'].includes(lessonType)) {
        toast.error("Veuillez sélectionner un fichier pour ce type de leçon");
        setIsSubmittingLesson(false);
        return;
      }

      const lessonData: any = {
        title: lessonTitle,
        type: lessonType,
        text_content: lessonTextContent,
        duration_minutes: lessonDuration ? parseInt(lessonDuration) : null,
      };

      if (contentUrl) {
        lessonData.content_url = contentUrl;
      }

      if (editingLessonId) {
        const { error } = await supabase
          .from('course_lessons')
          .update(lessonData)
          .eq('id', editingLessonId);
        if (error) throw error;
        toast.success('Leçon mise à jour');
      } else {
        const module = modules.find(m => m.id === activeModuleId);
        const newOrder = module?.lessons && module.lessons.length > 0 
          ? Math.max(...module.lessons.map(l => l.order)) + 1 
          : 0;

        lessonData.module_id = activeModuleId;
        lessonData.order = newOrder;

        const { error } = await supabase
          .from('course_lessons')
          .insert([lessonData]);
        if (error) throw error;
        toast.success('Leçon créée');
      }
      resetLessonForm();
      fetchCourseData();
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('Lock broken')) return;
      console.error('Error saving lesson:', error);
      toast.error(`Erreur lors de l'enregistrement: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsSubmittingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      // 1. Delete quizzes associated with this lesson
      const { error: quizzesError } = await supabase
        .from('course_quizzes')
        .delete()
        .eq('lesson_id', lessonId);
      
      if (quizzesError) console.warn('Error deleting quizzes:', quizzesError);

      // 2. Delete lesson progress associated with this lesson
      const { error: progressError } = await supabase
        .from('lesson_progress')
        .delete()
        .eq('lesson_id', lessonId);
      
      if (progressError) console.warn('Error deleting progress:', progressError);

      // 3. Finally delete the lesson
      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', lessonId);
      if (error) throw error;
      
      toast.success('Leçon supprimée avec succès');
      setDeleteConfirmation(null);
      fetchCourseData();
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('Lock broken')) return;
      console.error('Error deleting lesson:', error);
      toast.error(`Erreur lors de la suppression: ${error.message || 'Erreur inconnue'}`);
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'audio': return <Headphones className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>, moduleId: string) => {
    const file = e.target.files?.[0];
    if (!file || !moduleId) return;

    setIsBulkUploading(true);
    const toastId = toast.loading("Analyse du fichier...");

    try {
      const text = await file.text();
      let lessonsToCreate: any[] = [];

      if (file.name.endsWith('.json')) {
        lessonsToCreate = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        lessonsToCreate = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.trim());
          const lesson: any = {};
          headers.forEach((header, index) => {
            if (header === 'duration') {
              lesson.duration_minutes = values[index] ? parseInt(values[index]) : null;
            } else if (header === 'url') {
              lesson.content_url = values[index];
            } else if (header === 'content') {
              lesson.text_content = values[index];
            } else {
              lesson[header] = values[index];
            }
          });
          return lesson;
        });
      } else {
        throw new Error("Format de fichier non supporté. Utilisez .json ou .csv");
      }

      if (!Array.isArray(lessonsToCreate) || lessonsToCreate.length === 0) {
        throw new Error("Aucune leçon trouvée dans le fichier");
      }

      toast.loading(`Création de ${lessonsToCreate.length} leçons...`, { id: toastId });

      const module = modules.find(m => m.id === moduleId);
      let currentOrder = module?.lessons && module.lessons.length > 0 
        ? Math.max(...module.lessons.map(l => l.order)) + 1 
        : 0;

      const results = { success: 0, error: 0 };

      for (const lessonData of lessonsToCreate) {
        try {
          const { error } = await supabase
            .from('course_lessons')
            .insert([{
              module_id: moduleId,
              title: lessonData.title || 'Sans titre',
              type: (lessonData.type as LessonType) || 'text',
              duration_minutes: lessonData.duration_minutes || null,
              content_url: lessonData.content_url || null,
              text_content: lessonData.text_content || null,
              order: currentOrder++
            }]);

          if (error) throw error;
          results.success++;
        } catch (err) {
          console.error('Error creating lesson in bulk:', err);
          results.error++;
        }
      }

      if (results.error === 0) {
        toast.success(`${results.success} leçons ajoutées avec succès`, { id: toastId });
      } else {
        toast.error(`${results.success} ajoutées, ${results.error} échecs`, { id: toastId });
      }

      fetchCourseData();
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      toast.error(`Erreur: ${error.message || 'Erreur lors du traitement du fichier'}`, { id: toastId });
    } finally {
      setIsBulkUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-meta-blue dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin" 
              className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-meta-blue dark:hover:text-blue-400 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-meta-dark dark:text-white truncate">Contenu de la formation</h1>
              <p className="text-sm text-meta-gray dark:text-gray-400 truncate">{course?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={toggleDarkMode}
              className="text-meta-gray dark:text-gray-400 hover:text-meta-dark dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => { resetLessonForm(); setEditingModuleId('new'); }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-meta-blue text-white rounded-xl font-semibold hover:bg-meta-blue-hover transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" /> Ajouter un module
            </button>
          </div>
        </div>

        {/* Module Form */}
        {editingModuleId !== null && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-meta-dark dark:text-white">
                {editingModuleId === 'new' ? 'Nouveau module' : 'Modifier le module'}
              </h2>
              <button onClick={resetModuleForm} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveModule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre du module</label>
                <input
                  type="text"
                  required
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optionnel)</label>
                <textarea
                  value={moduleDescription}
                  onChange={(e) => setModuleDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetModuleForm}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingModule}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-meta-blue rounded-xl hover:bg-meta-blue-hover transition-colors disabled:opacity-70"
                >
                  {isSubmittingModule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modules List */}
        <div className="space-y-6">
          {modules.map((module, mIndex) => (
            <div key={module.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Module Header */}
              <div className="bg-gray-50/80 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                <div className="flex items-center gap-3">
                  <div className="cursor-move text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-meta-dark dark:text-white leading-tight truncate max-w-[200px] sm:max-w-md">Module {mIndex + 1}: {module.title}</h3>
                    {module.description && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{module.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-auto">
                  <button
                    onClick={() => handleAddLesson(module.id)}
                    className="p-2 text-meta-blue dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Ajouter une leçon"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <label className="p-2 text-meta-blue dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer" title="Import groupé (CSV/JSON)">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept=".csv,.json"
                      className="hidden"
                      onChange={(e) => handleBulkUpload(e, module.id)}
                      disabled={isBulkUploading}
                    />
                  </label>
                  <button
                    onClick={() => handleEditModule(module)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-meta-blue dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Modifier le module"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmation({ id: module.id, type: 'module' })}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Supprimer le module"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lessons List */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {module.lessons?.map((lesson, lIndex) => (
                  <div key={lesson.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="cursor-move text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 flex-shrink-0">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-meta-blue dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                        {getLessonIcon(lesson.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-meta-dark dark:text-white truncate">{lIndex + 1}. {lesson.title}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <span className="capitalize">{lesson.type}</span>
                          {lesson.duration_minutes && <span>{lesson.duration_minutes} min</span>}
                          {lesson.content_url && <span className="text-green-600 dark:text-green-400">Fichier joint</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-auto">
                      <Link
                        to={`/admin/lessons/${lesson.id}/quizzes`}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-meta-blue dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Gérer les quiz"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleEditLesson(lesson, module.id)}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-meta-blue dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmation({ id: lesson.id, type: 'lesson' })}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {(!module.lessons || module.lessons.length === 0) && activeModuleId !== module.id && (
                  <div className="p-4 text-sm text-gray-400 dark:text-gray-500 text-center italic">
                    Aucune leçon dans ce module.
                  </div>
                )}

                {/* Lesson Form (Inline) */}
                {activeModuleId === module.id && (
                  <div className="p-6 bg-blue-50/30 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-meta-dark dark:text-white text-sm">
                        {editingLessonId ? 'Modifier la leçon' : 'Nouvelle leçon'}
                      </h4>
                      <button onClick={resetLessonForm} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <form onSubmit={handleSaveLesson} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Titre de la leçon</label>
                          <input
                            type="text"
                            required
                            value={lessonTitle}
                            onChange={(e) => setLessonTitle(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                            <select
                              value={lessonType}
                              onChange={(e) => setLessonType(e.target.value as LessonType)}
                              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                            >
                              <option value="video">Vidéo</option>
                              <option value="pdf">PDF</option>
                              <option value="audio">Audio</option>
                              <option value="text">Texte</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Durée (min)</label>
                            <input
                              type="number"
                              min="0"
                              value={lessonDuration}
                              onChange={(e) => setLessonDuration(e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {['video', 'pdf', 'audio'].includes(lessonType) && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fichier ({lessonType})</label>
                          <input
                            type="file"
                            accept={lessonType === 'video' ? 'video/*' : lessonType === 'pdf' ? '.pdf' : 'audio/*'}
                            onChange={(e) => setLessonFile(e.target.files?.[0] || null)}
                            className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-meta-blue dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                          />
                          {editingLessonId && !lessonFile && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Laissez vide pour conserver le fichier actuel.</p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Contenu texte / Description</label>
                        <textarea
                          value={lessonTextContent}
                          onChange={(e) => setLessonTextContent(e.target.value)}
                          rows={4}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                          placeholder="Texte de la leçon ou description de la vidéo/pdf..."
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={resetLessonForm}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingLesson}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-meta-blue rounded-lg hover:bg-meta-blue-hover transition-colors disabled:opacity-70"
                        >
                          {isSubmittingLesson ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Enregistrer la leçon
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {modules.length === 0 && editingModuleId === null && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
              <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun module</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Commencez par ajouter un module à cette formation.</p>
              <button
                onClick={() => setEditingModuleId('new')}
                className="mt-4 px-4 py-2 bg-meta-blue text-white rounded-xl font-medium hover:bg-meta-blue-hover transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Ajouter un module
              </button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-4 text-red-600 dark:text-red-400 mb-4">
                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-full">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Confirmation de suppression</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {deleteConfirmation.type === 'module' 
                  ? 'Êtes-vous sûr de vouloir supprimer ce module et toutes ses leçons ? Cette action est irréversible.' 
                  : 'Êtes-vous sûr de vouloir supprimer cette leçon ? Cette action est irréversible.'}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirmation.type === 'module') {
                      handleDeleteModule(deleteConfirmation.id);
                    } else {
                      handleDeleteLesson(deleteConfirmation.id);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
