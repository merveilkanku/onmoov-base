import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Loader2, HelpCircle, Bot } from 'lucide-react';
import type { CourseLesson, CourseQuiz } from '../types';
import toast from 'react-hot-toast';
import { GoogleGenAI, Type } from '@google/genai';

export default function AdminLessonQuizzes() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<CourseLesson | null>(null);
  const [quizzes, setQuizzes] = useState<CourseQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    checkAdminAndFetchData();
  }, [lessonId]);

  async function checkAdminAndFetchData() {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.session.user.id)
        .single();

      if (!profile || !['admin', 'collaborator'].includes(profile.role)) {
        navigate('/');
        return;
      }

      await fetchLessonData();
    } catch (error) {
      console.error('Error checking auth:', error);
      navigate('/');
    }
  }

  async function fetchLessonData() {
    try {
      setLoading(true);
      // Fetch lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('course_lessons')
        .select('*, course_modules(course_id)')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      setLesson(lessonData);

      // Fetch quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });

      if (quizzesError) throw quizzesError;
      setQuizzes(quizzesData || []);
    } catch (error) {
      console.error('Error fetching lesson data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateQuiz = async () => {
    if (!lesson?.text_content) {
      toast.error("Le contenu de la leçon est vide. Impossible de générer un quiz.");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Génération du quiz par l'IA...");

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Clé API Gemini manquante.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Génère une question de quiz à choix multiples basée sur ce contenu de leçon :\n\n${lesson.text_content}\n\nLa question doit être pertinente et tester la compréhension du contenu.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "La question du quiz",
              },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: "Un tableau de 4 options de réponse possibles",
              },
              correctOptionIndex: {
                type: Type.INTEGER,
                description: "L'index (0 à 3) de la bonne réponse dans le tableau d'options",
              },
            },
            required: ["question", "options", "correctOptionIndex"],
          },
        }
      });

      const jsonStr = response.text?.trim();
      if (jsonStr) {
        const generatedQuiz = JSON.parse(jsonStr);
        setQuestion(generatedQuiz.question);
        setOptions(generatedQuiz.options);
        setCorrectOptionIndex(generatedQuiz.correctOptionIndex);
        setIsFormOpen(true);
        setEditingQuizId(null);
        toast.success("Quiz généré avec succès !", { id: toastId });
      } else {
        throw new Error("Réponse vide de l'IA");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Erreur lors de la génération du quiz", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
      if (correctOptionIndex >= newOptions.length) {
        setCorrectOptionIndex(newOptions.length - 1);
      } else if (correctOptionIndex === index) {
        setCorrectOptionIndex(0);
      }
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingQuizId(null);
    setQuestion('');
    setOptions(['', '']);
    setCorrectOptionIndex(0);
  };

  const handleEditQuiz = (quiz: CourseQuiz) => {
    setEditingQuizId(quiz.id);
    setQuestion(quiz.question);
    setOptions(quiz.options);
    setCorrectOptionIndex(quiz.correct_option_index);
    setIsFormOpen(true);
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) return;

    try {
      const { error } = await supabase
        .from('course_quizzes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Question supprimée');
      fetchLessonData();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonId) return;

    // Validate options
    if (options.some(opt => !opt.trim())) {
      toast.error('Toutes les options doivent être remplies');
      return;
    }

    setIsSubmitting(true);
    try {
      const quizData = {
        lesson_id: lessonId,
        question: question.trim(),
        options: options.map(opt => opt.trim()),
        correct_option_index: correctOptionIndex
      };

      if (editingQuizId) {
        const { error } = await supabase
          .from('course_quizzes')
          .update(quizData)
          .eq('id', editingQuizId);
        if (error) throw error;
        toast.success('Question mise à jour');
      } else {
        const { error } = await supabase
          .from('course_quizzes')
          .insert([quizData]);
        if (error) throw error;
        toast.success('Question ajoutée');
      }
      resetForm();
      fetchLessonData();
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-meta-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link 
              to={`/admin/courses/${(lesson as any)?.course_modules?.course_id}`}
              className="inline-flex items-center text-meta-blue hover:text-meta-blue-hover mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au contenu de la formation
            </Link>
            <h1 className="text-3xl font-bold text-meta-dark flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-meta-blue" />
              Gérer les quiz : {lesson?.title}
            </h1>
          </div>
          {!isFormOpen && (
            <div className="flex gap-3">
              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
                Générer avec l'IA
              </button>
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-4 py-2 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-xl font-bold transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Ajouter une question
              </button>
            </div>
          )}
        </div>

        {isFormOpen && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-meta-dark">
                {editingQuizId ? 'Modifier la question' : 'Nouvelle question'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20"
                  placeholder="Posez votre question ici..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Options de réponse</label>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={correctOptionIndex === index}
                        onChange={() => setCorrectOptionIndex(index)}
                        className="w-5 h-5 text-meta-blue focus:ring-meta-blue"
                        title="Marquer comme bonne réponse"
                      />
                      <input
                        type="text"
                        required
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className={`flex-1 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-meta-blue/20 ${
                          correctOptionIndex === index 
                            ? 'border-meta-blue bg-blue-50/30' 
                            : 'border-gray-200'
                        }`}
                        placeholder={`Option ${index + 1}`}
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer cette option"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="mt-4 px-4 py-2 text-sm text-meta-blue bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                  >
                    + Ajouter une option
                  </button>
                )}
                <p className="text-sm text-gray-500 mt-4">
                  Sélectionnez le bouton radio à côté de l'option pour la marquer comme la bonne réponse.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-5 h-5" />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {quizzes.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun quiz</h3>
              <p className="text-gray-500">Ajoutez des questions pour évaluer les apprenants sur cette leçon.</p>
            </div>
          ) : (
            quizzes.map((quiz, index) => (
              <div key={quiz.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-meta-dark mb-4">
                      <span className="text-meta-blue mr-2">Q{index + 1}.</span>
                      {quiz.question}
                    </h3>
                    <div className="space-y-2">
                      {quiz.options.map((option, optIndex) => (
                        <div 
                          key={optIndex}
                          className={`px-4 py-2 rounded-lg border ${
                            quiz.correct_option_index === optIndex 
                              ? 'bg-green-50 border-green-200 text-green-800 font-medium' 
                              : 'bg-gray-50 border-gray-100 text-gray-600'
                          }`}
                        >
                          {option}
                          {quiz.correct_option_index === optIndex && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Bonne réponse
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-6">
                    <button
                      onClick={() => handleEditQuiz(quiz)}
                      className="p-2 text-gray-400 hover:text-meta-blue hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
