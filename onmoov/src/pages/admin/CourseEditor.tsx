import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, Plus, Trash2, ArrowLeft, Save, GripVertical, FileText, PlayCircle, Headphones, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Course, CourseModule, CourseLesson, LessonType } from '../../types';

export default function CourseEditor() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Module State
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);

  // New Lesson State
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<LessonType>('video');
  const [newLessonUrl, setNewLessonUrl] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('');
  const [newLessonText, setNewLessonText] = useState('');
  const [isAddingLesson, setIsAddingLesson] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id]);

  async function fetchCourseData() {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select(`
          *,
          lessons:course_lessons(*)
        `)
        .eq('course_id', id)
        .order('order', { ascending: true });

      if (modulesError) throw modulesError;
      
      const sortedModules = modulesData?.map(m => ({
        ...m,
        lessons: m.lessons?.sort((a: any, b: any) => a.order - b.order) || []
      })) || [];
      
      setModules(sortedModules);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Erreur lors du chargement de la formation');
    } finally {
      setLoading(false);
    }
  }

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim() || !course) return;

    setSaving(true);
    try {
      const newOrder = modules.length > 0 ? Math.max(...modules.map(m => m.order)) + 1 : 0;
      
      const { data, error } = await supabase
        .from('course_modules')
        .insert([{
          course_id: course.id,
          title: newModuleTitle,
          order: newOrder
        }])
        .select()
        .single();

      if (error) throw error;
      
      setModules([...modules, { ...data, lessons: [] }]);
      setNewModuleTitle('');
      setIsAddingModule(false);
      toast.success('Module ajouté');
    } catch (error) {
      console.error('Error adding module:', error);
      toast.error('Erreur lors de l\'ajout du module');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce module et toutes ses leçons ?')) return;

    try {
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;
      
      setModules(modules.filter(m => m.id !== moduleId));
      toast.success('Module supprimé');
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Erreur lors de la suppression du module');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim() || !activeModuleId) return;

    setSaving(true);
    try {
      const module = modules.find(m => m.id === activeModuleId);
      const newOrder = (module?.lessons?.length || 0) > 0 
        ? Math.max(...(module?.lessons?.map(l => l.order) || [0])) + 1 
        : 0;
      
      const { data, error } = await supabase
        .from('course_lessons')
        .insert([{
          module_id: activeModuleId,
          title: newLessonTitle,
          type: newLessonType,
          content_url: newLessonUrl || null,
          text_content: newLessonText || null,
          duration_minutes: newLessonDuration ? parseInt(newLessonDuration) : null,
          order: newOrder
        }])
        .select()
        .single();

      if (error) throw error;
      
      setModules(modules.map(m => {
        if (m.id === activeModuleId) {
          return { ...m, lessons: [...(m.lessons || []), data] };
        }
        return m;
      }));
      
      // Reset form
      setNewLessonTitle('');
      setNewLessonUrl('');
      setNewLessonText('');
      setNewLessonDuration('');
      setIsAddingLesson(false);
      setActiveModuleId(null);
      toast.success('Leçon ajoutée');
    } catch (error) {
      console.error('Error adding lesson:', error);
      toast.error('Erreur lors de l\'ajout de la leçon');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette leçon ?')) return;

    try {
      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      
      setModules(modules.map(m => {
        if (m.id === moduleId) {
          return { ...m, lessons: m.lessons?.filter(l => l.id !== lessonId) || [] };
        }
        return m;
      }));
      toast.success('Leçon supprimée');
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Erreur lors de la suppression de la leçon');
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircle className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'audio': return <Headphones className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-meta-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Link to="/admin" className="p-2 bg-white rounded-xl shadow-sm hover:bg-gray-50 text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gérer le contenu</h1>
            <p className="text-gray-500">{course?.title}</p>
          </div>
        </div>

        <div className="space-y-6">
          {modules.map((module, mIdx) => (
            <div key={module.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                  <h3 className="font-bold text-gray-900">Module {mIdx + 1}: {module.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveModuleId(module.id);
                      setIsAddingLesson(true);
                    }}
                    className="p-2 text-meta-blue hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ajouter une leçon"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(module.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer le module"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                {module.lessons && module.lessons.length > 0 ? (
                  <div className="space-y-2">
                    {module.lessons.map((lesson, lIdx) => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-meta-blue flex items-center justify-center">
                            {getLessonIcon(lesson.type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{lIdx + 1}. {lesson.title}</p>
                            <p className="text-xs text-gray-500 capitalize">{lesson.type} {lesson.duration_minutes ? `• ${lesson.duration_minutes} min` : ''}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteLesson(module.id, lesson.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic text-center py-4">Aucune leçon dans ce module</p>
                )}

                {isAddingLesson && activeModuleId === module.id && (
                  <form onSubmit={handleAddLesson} className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4">
                    <h4 className="font-semibold text-sm text-meta-blue">Nouvelle leçon</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Titre</label>
                        <input
                          type="text"
                          required
                          value={newLessonTitle}
                          onChange={(e) => setNewLessonTitle(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-meta-blue focus:ring-1 focus:ring-meta-blue outline-none"
                          placeholder="Titre de la leçon"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Type de contenu</label>
                        <select
                          value={newLessonType}
                          onChange={(e) => setNewLessonType(e.target.value as LessonType)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-meta-blue focus:ring-1 focus:ring-meta-blue outline-none"
                        >
                          <option value="video">Vidéo (Coursera style)</option>
                          <option value="pdf">PDF / Livre (Cisco style)</option>
                          <option value="audio">Audio</option>
                          <option value="text">Texte riche</option>
                        </select>
                      </div>
                    </div>

                    {newLessonType !== 'text' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">URL du fichier (Vidéo/PDF/Audio)</label>
                        <input
                          type="url"
                          required
                          value={newLessonUrl}
                          onChange={(e) => setNewLessonUrl(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-meta-blue focus:ring-1 focus:ring-meta-blue outline-none"
                          placeholder="https://..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Lien direct vers le fichier hébergé (ex: Supabase Storage, AWS S3, etc.)</p>
                      </div>
                    )}

                    {newLessonType === 'text' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Contenu texte (HTML supporté)</label>
                        <textarea
                          required
                          value={newLessonText}
                          onChange={(e) => setNewLessonText(e.target.value)}
                          rows={4}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-meta-blue focus:ring-1 focus:ring-meta-blue outline-none"
                          placeholder="<p>Contenu de la leçon...</p>"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Durée estimée (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        value={newLessonDuration}
                        onChange={(e) => setNewLessonDuration(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-meta-blue focus:ring-1 focus:ring-meta-blue outline-none"
                        placeholder="Ex: 15"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingLesson(false);
                          setActiveModuleId(null);
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium bg-meta-blue text-white rounded-lg hover:bg-meta-blue-hover transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Enregistrer
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ))}

          {isAddingModule ? (
            <form onSubmit={handleAddModule} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <h3 className="font-bold text-gray-900">Nouveau Module</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre du module</label>
                <input
                  type="text"
                  required
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all"
                  placeholder="Ex: Introduction aux concepts de base"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingModule(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium bg-meta-blue text-white rounded-xl hover:bg-meta-blue-hover transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Créer le module
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingModule(true)}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:text-meta-blue hover:border-meta-blue hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Ajouter un module
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
