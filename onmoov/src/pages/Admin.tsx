import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { Loader2, LogOut, Plus, Trash2, ArrowLeft, Users, ShieldAlert, Settings, Save, GraduationCap, LayoutDashboard, AppWindow, Database, UserCog, Upload, UserPlus, Search, FileText, CheckCircle2, BarChart3, Sun, Moon, Briefcase, MapPin, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useDropzone } from 'react-dropzone';
import { useTheme } from '../lib/ThemeContext';
import ConfirmModal from '../components/ConfirmModal';
import AdminAnalytics from '../components/AdminAnalytics';
import AdminRecruitment from '../components/AdminRecruitment';
import { motion } from 'motion/react';
import type { Application, Profile, SiteSettings, Course, UserRole, TrainerApplication } from '../types';

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

export default function Admin() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [trainerApplications, setTrainerApplications] = useState<any[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'apps' | 'courses' | 'users' | 'trainer_apps' | 'settings' | 'setup' | 'analytics' | 'recruitment'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const navigate = useNavigate();

  const SUPER_ADMIN_EMAIL = 'irmerveilkanku@gmail.com';
  const SECONDARY_ADMIN_EMAIL = 'herbestinformatique@gmail.com';
  const THIRD_ADMIN_EMAIL = 'dashkanku87@gmail.com';

  const isSuperAdmin = profile?.role === 'super_admin' || 
    profile?.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase().trim() ||
    profile?.email?.toLowerCase().trim() === THIRD_ADMIN_EMAIL.toLowerCase().trim();
  const isAdmin = isSuperAdmin || profile?.role === 'admin' || profile?.email?.toLowerCase().trim() === SECONDARY_ADMIN_EMAIL.toLowerCase().trim();
  const isTrainer = isAdmin || profile?.role === 'trainer';
  const canSeeTrainerApps = isSuperAdmin || profile?.email?.toLowerCase().trim() === SECONDARY_ADMIN_EMAIL.toLowerCase().trim();

  // App Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('Application');
  const [appStatus, setAppStatus] = useState<'draft' | 'published'>('published');
  const [appImageFile, setAppImageFile] = useState<File | null>(null);
  const [appFile, setAppFile] = useState<File | null>(null);
  const [appFormKey, setAppFormKey] = useState(0);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);

  // New User Form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseDuration, setCourseDuration] = useState('');
  const [courseLevel, setCourseLevel] = useState('');
  const [courseStatus, setCourseStatus] = useState<'draft' | 'published'>('published');
  const [courseIsPaid, setCourseIsPaid] = useState(false);
  const [coursePrice, setCoursePrice] = useState(0);
  const [courseCurrency, setCourseCurrency] = useState('');
  const [courseImageFile, setCourseImageFile] = useState<File | null>(null);
  const [courseIconName, setCourseIconName] = useState('Code');
  const [courseFormKey, setCourseFormKey] = useState(0);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Dropzone hooks
  const onAppImageDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) setAppImageFile(acceptedFiles[0]);
  }, []);
  const { getRootProps: getAppImageProps, getInputProps: getAppImageInputProps, isDragActive: isAppImageDragActive } = useDropzone({ onDrop: onAppImageDrop, accept: { 'image/*': [] }, maxFiles: 1 } as any);

  const onAppFileDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) setAppFile(acceptedFiles[0]);
  }, []);
  const { getRootProps: getAppFileProps, getInputProps: getAppFileInputProps, isDragActive: isAppFileDragActive } = useDropzone({ onDrop: onAppFileDrop, maxFiles: 1 } as any);

  const onCourseImageDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) setCourseImageFile(acceptedFiles[0]);
  }, []);
  const { getRootProps: getCourseImageProps, getInputProps: getCourseImageInputProps, isDragActive: isCourseImageDragActive } = useDropzone({ onDrop: onCourseImageDrop, accept: { 'image/*': [] }, maxFiles: 1 } as any);

  useEffect(() => {
    let isMounted = true;

    async function initAdmin() {
      setLoading(true);
      try {
        // Sequential initialization to avoid lock contention and AbortErrors
        await checkUserAndProfile();
        
        if (isMounted) {
          // Fetch data in parallel but after profile is checked
          await Promise.allSettled([
            fetchApplications(),
            fetchCourses(),
            fetchSiteSettings(),
            fetchUsers(),
            fetchTrainerApplications()
          ]);
        }
      } catch (error) {
        console.error('Initial admin load error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAdmin();

    return () => {
      isMounted = false;
    };
  }, []);

  async function fetchTrainerApplications() {
    try {
      const { data, error } = await supabase
        .from('trainer_applications')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.message?.includes('AbortError') || error.message?.includes('Lock broken')) {
          console.warn('Fetch trainer applications aborted due to lock contention. Retrying...');
          return;
        }
        if (error.code !== '42P01') throw error;
      }
      if (data) setTrainerApplications(data);
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) return;
      console.error('Error fetching trainer applications:', error);
      if (isSuperAdmin && error.message?.includes('insufficient permissions')) {
        toast.error('Erreur de permissions. Veuillez exécuter le script SQL dans l\'onglet "Configuration SQL".');
      }
    }
  }

  const [selectedTrainerApp, setSelectedTrainerApp] = useState<TrainerApplication | null>(null);
  const [isTrainerAppModalOpen, setIsTrainerAppModalOpen] = useState(false);

  async function handleDeleteTrainerApplication(id: string) {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette candidature ?')) return;
    
    try {
      const { error } = await supabase
        .from('trainer_applications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Candidature supprimée avec succès.');
      fetchTrainerApplications();
      if (selectedTrainerApp?.id === id) {
        setIsTrainerAppModalOpen(false);
        setSelectedTrainerApp(null);
      }
    } catch (error) {
      console.error('Error deleting trainer application:', error);
      toast.error('Erreur lors de la suppression de la candidature.');
    }
  }

  async function handleUpdateApplicationStatus(applicationId: string, newStatus: 'approved' | 'rejected') {
    try {
      if (newStatus === 'rejected') {
        await handleDeleteTrainerApplication(applicationId);
      } else {
        const { error } = await supabase
          .from('trainer_applications')
          .update({ status: newStatus })
          .eq('id', applicationId);
        if (error) throw error;
        toast.success('Candidature approuvée avec succès.');
        fetchTrainerApplications();
        fetchUsers(); // Refresh users as role might have changed
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Erreur lors de la mise à jour de la candidature.');
    }
  }

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.message?.includes('AbortError') || error.message?.includes('Lock broken')) {
          console.warn('Fetch users aborted due to lock contention.');
          return;
        }
        if (error.code !== '42P01') throw error;
      }
      if (data) setUsers(data);
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) return;
      console.error('Error fetching users:', error);
      if (isSuperAdmin && error.message?.includes('insufficient permissions')) {
        toast.error('Erreur de permissions. Veuillez exécuter le script SQL dans l\'onglet "Configuration SQL".');
      }
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) return;

    const emailToUse = newUserEmail
      .trim()
      .toLowerCase()
      .replace(/['"]/g, '') // Supprimer les guillemets si l'utilisateur en a tapé
      .replace(/\s+/g, '') // Supprimer tous les espaces (y compris au milieu)
      .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Supprimer les caractères invisibles (zero-width)

    if (!emailToUse) {
      alert("Veuillez entrer une adresse email valide.");
      return;
    }

    setIsCreatingUser(true);
    try {
      if (!supabaseUrl || typeof supabaseUrl !== 'string' || !supabaseUrl.startsWith('http')) {
        throw new Error('URL Supabase invalide pour le client secondaire.');
      }
      // Create a secondary client that doesn't persist the session
      // This prevents the admin from being logged out when creating a new user
      const adminAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'admin-temp-auth-key', // Fix Multiple GoTrueClient instances warning
        }
      });

      const { data, error } = await adminAuthClient.auth.signUp({
        email: emailToUse,
        password: newUserPassword,
      });

      if (error) throw error;

      // If the user was created successfully, we might need to update their role
      if (data.user && newUserRole !== 'user') {
        // Wait a brief moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        await supabase
          .from('profiles')
          .update({ role: newUserRole })
          .eq('id', data.user.id);
      }

      alert(`Utilisateur ${emailToUse} créé avec succès !`);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Traduire les erreurs communes
      let errorMessage = error.message;
      if (errorMessage.toLowerCase().includes('invalid email') || errorMessage.toLowerCase().includes('email invalide')) {
        errorMessage = "L'adresse email est invalide. Veuillez vérifier qu'elle ne contient pas d'espaces ou de caractères spéciaux non autorisés.";
      } else if (errorMessage.toLowerCase().includes('already registered')) {
        errorMessage = "Cet utilisateur existe déjà.";
      } else if (errorMessage.toLowerCase().includes('rate limit')) {
        errorMessage = "La limite d'envoi d'emails a été atteinte (sécurité anti-spam de Supabase). Veuillez patienter un peu avant de réessayer, ou désactivez la confirmation d'email dans votre tableau de bord Supabase (Authentication > Providers > Email).";
      }
      
      alert(`Erreur lors de la création de l'utilisateur : ${errorMessage}`);
    } finally {
      setIsCreatingUser(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) throw error;
      fetchUsers();
      alert('Rôle mis à jour avec succès.');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Erreur lors de la mise à jour du rôle.');
    }
  }

  async function handleUserDelete(userId: string, email: string) {
    if (email === 'irmerveilkanku@gmail.com') {
      alert('Impossible de supprimer l\'administrateur principal.');
      return;
    }
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${email} ? Cette action est irréversible et supprimera toutes ses données.`)) {
      return;
    }

    try {
      // On utilise la fonction RPC pour supprimer l'utilisateur de auth.users
      const { error } = await supabase.rpc('delete_user', { user_id: userId });
      
      if (error) {
        console.error('RPC delete_user failed:', error);
        
        // Fallback: si la fonction RPC n'existe pas, on supprime au moins le profil
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);
          
        if (profileError) {
          throw new Error("Impossible de supprimer l'utilisateur. Veuillez exécuter le script SQL de configuration mis à jour.");
        } else {
          alert('Le profil a été supprimé, mais l\'utilisateur existe toujours dans l\'authentification. Exécutez le script SQL pour une suppression complète.');
        }
      } else {
        alert('Utilisateur supprimé avec succès.');
      }
      
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`Erreur lors de la suppression : ${error.message || 'Erreur inconnue'}`);
    }
  }

  async function fetchCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error && error.code !== '42P01') throw error;
      if (data) setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }

  async function fetchSiteSettings() {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error) {
        if (error.message?.includes('AbortError') || error.message?.includes('Lock broken')) {
          console.warn('Fetch site settings aborted due to lock contention.');
          return;
        }
        if (error.code !== 'PGRST116') throw error;
      }
      
      if (data) {
        setSiteSettings(data);
        // Set default course currency if not already set
        if (!courseCurrency) {
          setCourseCurrency(data.currency || 'EUR');
        }
      } else {
        setSiteSettings({
          id: 1,
          hero_title: 'Construisons le futur ensemble.',
          hero_subtitle: 'Découvrez nos équipements d\'ingénierie de pointe et nos solutions logicielles conçues pour repousser les limites de la technologie.',
          contact_email: 'onmoov.engineering@outlook.be',
          contact_phone: '+33 1 23 45 67 89',
          contact_address: '123 Avenue de l\'Innovation, 75001 Paris, France',
          updated_at: new Date().toISOString()
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) return;
      console.error('Error fetching site settings:', error);
    }
  }

  async function checkUserAndProfile() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        if (sessionError.message?.includes('AbortError') || sessionError.message?.includes('Lock broken')) {
          console.warn('Get session aborted due to lock contention.');
          return;
        }
        throw sessionError;
      }

      if (!session) {
        navigate('/login');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        if (error.message?.includes('AbortError') || error.message?.includes('Lock broken')) {
          console.warn('Fetch profile aborted due to lock contention.');
          return;
        }
        if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }
      }

      if (profileData) {
        // Force super_admin role for the primary admin email
        if (session.user.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase().trim()) {
          profileData.role = 'super_admin';
        }
        // Force admin role for the secondary admin email
        if (session.user.email?.toLowerCase().trim() === SECONDARY_ADMIN_EMAIL.toLowerCase().trim() && profileData.role === 'user') {
          profileData.role = 'admin';
        }
        setProfile(profileData);
      } else {
        setProfile({
          id: session.user.id,
          email: session.user.email || '',
          role: session.user.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase().trim() ? 'super_admin' : 
                session.user.email?.toLowerCase().trim() === SECONDARY_ADMIN_EMAIL.toLowerCase().trim() ? 'admin' : 'user',
          full_name: null,
          created_at: new Date().toISOString()
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) return;
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchApplications() {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAppId && (!appImageFile || !appFile)) {
      toast.error("Veuillez sélectionner une image et un fichier pour l'application.");
      return;
    }
    
    setIsSubmitting(true);

    try {
      let finalImageUrl = undefined;
      let finalAppUrl = undefined;

      // Upload Image if provided
      if (appImageFile) {
        const imageExt = appImageFile.name.split('.').pop();
        const imageName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${imageExt}`;
        const { error: imageError } = await supabase.storage
          .from('app-images')
          .upload(imageName, appImageFile);
        if (imageError) throw imageError;

        const { data } = supabase.storage
          .from('app-images')
          .getPublicUrl(imageName);
        finalImageUrl = data.publicUrl;
      }

      // Upload App File if provided
      if (appFile) {
        const appExt = appFile.name.split('.').pop();
        const appName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${appExt}`;
        const { error: appError } = await supabase.storage
          .from('app-files')
          .upload(appName, appFile);
        if (appError) throw appError;

        const { data } = supabase.storage
          .from('app-files')
          .getPublicUrl(appName);
        finalAppUrl = data.publicUrl;
      }

      const appData: any = {
        name,
        description,
        tag,
        status: appStatus,
      };

      if (finalImageUrl) appData.image_url = finalImageUrl;
      if (finalAppUrl) appData.download_url = finalAppUrl;

      if (editingAppId) {
        const { error } = await supabase.from('applications').update(appData).eq('id', editingAppId);
        if (error) throw error;
        toast.success('Application mise à jour avec succès !');
      } else {
        appData.downloads_count = 0;
        const { error } = await supabase.from('applications').insert([appData]);
        if (error) throw error;
        toast.success('Application ajoutée avec succès !');
      }

      setName('');
      setDescription('');
      setTag('Application');
      setAppStatus('published');
      setAppImageFile(null);
      setAppFile(null);
      setEditingAppId(null);
      setAppFormKey(prev => prev + 1);
      
      fetchApplications();
    } catch (error) {
      console.error('Error saving application:', error);
      toast.error('Erreur lors de l\'enregistrement de l\'application.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    console.log('handleDelete called for app id:', id);
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer l\'application',
      message: 'Êtes-vous sûr de vouloir supprimer cette application ? Cette action est irréversible.',
      onConfirm: async () => {
        console.log('onConfirm for app deletion triggered');
        try {
          const { error } = await supabase.from('applications').delete().eq('id', id);
          if (error) throw error;
          toast.success('Application supprimée.');
          fetchApplications();
        } catch (error) {
          console.error('Error deleting application:', error);
          toast.error('Erreur lors de la suppression.');
        }
      }
    });
  }

  function handleEditApp(app: Application) {
    setEditingAppId(app.id);
    setName(app.name);
    setDescription(app.description);
    setTag(app.tag);
    setAppStatus(app.status !== 'draft' ? 'published' : 'draft');
    setAppImageFile(null);
    setAppFile(null);
    setAppFormKey(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleEditCourse(course: Course) {
    setEditingCourseId(course.id);
    setCourseTitle(course.title);
    setCourseCategory(course.category);
    setCourseDescription(course.description);
    setCourseDuration(course.duration);
    setCourseLevel(course.level);
    setCourseStatus(course.status !== 'draft' ? 'published' : 'draft');
    setCourseIsPaid(course.is_paid || false);
    setCoursePrice(course.price || 0);
    setCourseCurrency(course.currency || siteSettings?.currency || 'EUR');
    setCourseIconName(course.icon_name || 'Code');
    setCourseImageFile(null);
    setCourseFormKey(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleCourseSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCourseId && !courseImageFile) {
      toast.error("Veuillez sélectionner une image pour la formation.");
      return;
    }
    
    setIsSubmitting(true);

    try {
      let finalImageUrl = undefined;

      // Upload Course Image if provided
      if (courseImageFile) {
        const imageExt = courseImageFile.name.split('.').pop();
        const imageName = `course_${Math.random().toString(36).substring(2)}_${Date.now()}.${imageExt}`;
        const { error: imageError } = await supabase.storage
          .from('app-images')
          .upload(imageName, courseImageFile);
        if (imageError) throw imageError;

        const { data } = supabase.storage
          .from('app-images')
          .getPublicUrl(imageName);
        finalImageUrl = data.publicUrl;
      }

      const { data: session } = await supabase.auth.getSession();
      const authorId = session?.session?.user?.id;

      const courseData: any = {
        title: courseTitle,
        category: courseCategory,
        description: courseDescription,
        duration: courseDuration,
        level: courseLevel,
        icon_name: courseIconName,
        status: courseStatus,
        is_paid: courseIsPaid,
        price: courseIsPaid ? coursePrice : 0,
        currency: courseCurrency,
        author_id: authorId
      };

      if (finalImageUrl) courseData.image_url = finalImageUrl;

      if (editingCourseId) {
        const { error } = await supabase.from('courses').update(courseData).eq('id', editingCourseId);
        if (error) throw error;
        toast.success('Formation mise à jour avec succès !');
      } else {
        const { error } = await supabase.from('courses').insert([courseData]);
        if (error) throw error;
        toast.success('Formation ajoutée avec succès !');
      }

      setCourseTitle('');
      setCourseCategory('');
      setCourseDescription('');
      setCourseDuration('');
      setCourseLevel('');
      setCourseStatus('published');
      setCourseIsPaid(false);
      setCoursePrice(0);
      setCourseCurrency(siteSettings?.currency || 'EUR');
      setCourseImageFile(null);
      setCourseIconName('Code');
      setEditingCourseId(null);
      setCourseFormKey(prev => prev + 1);
      
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Erreur lors de l\'enregistrement de la formation.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCourseDelete(id: string) {
    console.log('handleCourseDelete called for course id:', id);
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer la formation',
      message: 'Êtes-vous sûr de vouloir supprimer cette formation ? Cette action est irréversible.',
      onConfirm: async () => {
        console.log('onConfirm for course deletion triggered');
        try {
          const { error } = await supabase.from('courses').delete().eq('id', id);
          if (error) throw error;
          toast.success('Formation supprimée.');
          fetchCourses();
        } catch (error) {
          console.error('Error deleting course:', error);
          toast.error('Erreur lors de la suppression.');
        }
      }
    });
  }

  async function handleUpdateAllCoursesCurrency() {
    if (!siteSettings?.currency) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Mettre à jour la devise',
      message: `Voulez-vous vraiment changer la devise de TOUTES les formations en ${siteSettings.currency} ?`,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('courses')
            .update({ currency: siteSettings.currency })
            .not('id', 'is', null); // Update all courses

          if (error) throw error;
          toast.success('Toutes les formations ont été mises à jour !');
          fetchCourses();
        } catch (error: any) {
          console.error('Error updating courses currency:', error);
          toast.error(`Erreur lors de la mise à jour de la devise : ${error.message || 'Erreur inconnue'}`);
        }
      }
    });
  }

  async function handleUpdateSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!siteSettings) return;
    
    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert([
          {
            id: 1,
            hero_title: siteSettings.hero_title,
            hero_subtitle: siteSettings.hero_subtitle,
            contact_email: siteSettings.contact_email,
            contact_phone: siteSettings.contact_phone,
            contact_address: siteSettings.contact_address,
            currency: siteSettings.currency || 'EUR',
            updated_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      toast.success('Paramètres mis à jour avec succès !');
      fetchSiteSettings();
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error(`Erreur lors de la mise à jour des paramètres : ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsSavingSettings(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-meta-blue dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        {isSuperAdmin && (
          <div className="bg-red-600 text-white text-[10px] py-1 px-4 text-center font-bold uppercase tracking-widest">
            Mode Super Admin Activé ({profile?.email})
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link to="/" className="text-meta-gray dark:text-gray-400 hover:text-meta-dark dark:hover:text-white transition-colors p-1 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Formateur'}
              </h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-4">
              <button 
                onClick={toggleDarkMode}
                className="text-meta-gray dark:text-gray-400 hover:text-meta-dark dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-8 flex space-x-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-1 hide-scrollbar sticky top-16 bg-gray-50 dark:bg-gray-900 z-40">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-meta-blue text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-meta-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> <span className="hidden xs:inline">Tableau de bord</span><span className="xs:hidden">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('apps')}
            className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'apps'
                ? 'bg-meta-blue text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-meta-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <AppWindow className="w-4 h-4" /> <span className="hidden xs:inline">Applications</span><span className="xs:hidden">Apps</span>
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'courses'
                ? 'bg-meta-blue text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-meta-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> <span className="hidden xs:inline">Formations</span><span className="xs:hidden">Cours</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-meta-blue text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-meta-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> <span className="hidden xs:inline">Statistiques</span><span className="xs:hidden">Stats</span>
          </button>
          
          {isAdmin && (
            <>
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'users'
                      ? 'bg-meta-blue text-white shadow-md'
                      : 'text-gray-500 dark:text-gray-400 hover:text-meta-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <UserCog className="w-4 h-4" /> <span className="hidden xs:inline">Utilisateurs</span><span className="xs:hidden">Users</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('trainer_apps')}
                className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'trainer_apps'
                    ? 'bg-meta-blue text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:text-meta-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <FileText className="w-4 h-4" /> <span className="hidden xs:inline">Formateurs</span><span className="xs:hidden">Formateurs</span>
              </button>
              <button
                onClick={() => setActiveTab('recruitment')}
                className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'recruitment'
                    ? 'bg-meta-blue text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:text-meta-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Briefcase className="w-4 h-4" /> <span className="hidden xs:inline">Recrutement</span><span className="xs:hidden">Jobs</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-meta-blue text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:text-meta-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Settings className="w-4 h-4" /> <span className="hidden xs:inline">Paramètres</span><span className="xs:hidden">Config</span>
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('setup')}
                  className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'setup'
                      ? 'bg-meta-blue text-white shadow-md'
                      : 'text-gray-500 dark:text-gray-400 hover:text-meta-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Database className="w-4 h-4" /> <span className="hidden xs:inline">SQL</span><span className="xs:hidden">SQL</span>
                </button>
              )}
            </>
          )}
        </div>

        {activeTab === 'analytics' && (
          <AdminAnalytics />
        )}

        {activeTab === 'recruitment' && (
          <AdminRecruitment />
        )}

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-5 hover:shadow-md transition-shadow">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-meta-blue dark:text-blue-400 rounded-xl">
                <AppWindow className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Applications</p>
                <p className="text-3xl font-bold text-meta-dark dark:text-white">{applications.length}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-5 hover:shadow-md transition-shadow">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Formations</p>
                <p className="text-3xl font-bold text-meta-dark dark:text-white">{courses.length}</p>
              </div>
            </div>
            {isAdmin && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-5 hover:shadow-md transition-shadow">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Utilisateurs</p>
                  <p className="text-3xl font-bold text-meta-dark dark:text-white">{users.length}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'trainer_apps' && canSeeTrainerApps && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-meta-dark dark:text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-meta-blue dark:text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                Candidatures Devenir Formateur
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                      <th className="px-8 py-4 text-sm font-semibold text-meta-gray dark:text-gray-400">Candidat</th>
                      <th className="px-8 py-4 text-sm font-semibold text-meta-gray dark:text-gray-400">Bio & Expérience</th>
                      <th className="px-8 py-4 text-sm font-semibold text-meta-gray dark:text-gray-400">Statut</th>
                      <th className="px-8 py-4 text-sm font-semibold text-meta-gray dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainerApplications.map((app) => (
                      <tr key={app.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/30 dark:hover:bg-gray-900/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="font-bold text-meta-dark dark:text-white">{app.full_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{app.email}</div>
                        </td>
                        <td className="px-8 py-6 max-w-md">
                          <p className="text-sm text-meta-dark dark:text-gray-300 line-clamp-2 mb-1"><strong>Bio:</strong> {app.bio}</p>
                          <p className="text-sm text-meta-dark dark:text-gray-300 line-clamp-2"><strong>Exp:</strong> {app.experience}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            app.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {app.status === 'pending' ? 'En attente' : app.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedTrainerApp(app);
                                setIsTrainerAppModalOpen(true);
                              }}
                              className="p-2 bg-blue-50 dark:bg-blue-900/30 text-meta-blue dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                              title="Voir les détails"
                            >
                              <FileText className="w-5 h-5" />
                            </button>
                            {app.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'approved')}
                                  className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                                  title="Approuver"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                                  className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                  title="Rejeter"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleDeleteTrainerApplication(app.id)}
                                className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                title="Supprimer définitivement"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {trainerApplications.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-12 text-center text-gray-500 dark:text-gray-400">
                          Aucune candidature trouvée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && isAdmin && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-meta-dark dark:text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-meta-blue dark:text-blue-400">
                  <UserPlus className="w-6 h-6" />
                </div>
                Ajouter un collaborateur
              </h2>
              <form onSubmit={handleCreateUser} className="grid md:grid-cols-4 gap-6 items-end">
                <div>
                  <label className="block text-sm font-semibold text-meta-dark dark:text-white mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white"
                    placeholder="email@exemple.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-meta-dark dark:text-white mb-2">Mot de passe provisoire</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white"
                    placeholder="Min. 6 caractères"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-meta-dark dark:text-white mb-2">Rôle</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 appearance-none dark:text-white"
                  >
                    <option value="user">Utilisateur</option>
                    <option value="trainer">Formateur</option>
                    <option value="admin">Administrateur</option>
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="w-full flex justify-center items-center gap-2 rounded-xl bg-meta-blue py-3 px-4 text-sm font-bold text-white hover:bg-meta-blue-hover focus:outline-none transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isCreatingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Créer le compte'}
                </button>
              </form>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-meta-dark dark:text-white">Gestion des utilisateurs</h2>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-8 py-4 text-sm font-semibold text-meta-gray dark:text-gray-400">Email</th>
                    <th className="px-8 py-4 text-sm font-semibold text-meta-gray dark:text-gray-400">Rôle actuel</th>
                    <th className="px-8 py-4 text-sm font-semibold text-meta-gray dark:text-gray-400">Date d'inscription</th>
                    <th className="px-8 py-4 text-sm font-semibold text-meta-gray dark:text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-8 py-5 text-sm font-medium text-meta-dark dark:text-white">{u.email}</td>
                      <td className="px-8 py-5 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-meta-gray dark:text-gray-400">
                        {new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-5 text-sm">
                        <div className="flex items-center gap-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={u.email === 'irmerveilkanku@gmail.com' || (!isSuperAdmin && u.role === 'super_admin')}
                            className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-800 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900 cursor-pointer dark:text-white"
                          >
                            <option value="user">Utilisateur</option>
                            <option value="trainer">Formateur</option>
                            <option value="admin">Administrateur</option>
                            {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                          </select>
                          
                          {u.email !== 'irmerveilkanku@gmail.com' && (isSuperAdmin || u.role !== 'super_admin') && (
                            <button
                              onClick={() => handleUserDelete(u.id, u.email)}
                              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Supprimer l'utilisateur"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'setup' && isAdmin && (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-meta-dark dark:text-white mb-4 flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-meta-blue dark:text-blue-400">
                <Database className="w-6 h-6" />
              </div>
              Script d'installation complet (Supabase)
            </h2>
            <p className="text-base text-meta-gray dark:text-gray-400 mb-6">
              Copiez et exécutez ce script dans le <strong>SQL Editor</strong> de Supabase pour créer toutes les tables, politiques de sécurité (RLS) et fonctions nécessaires.
            </p>
            <div className="bg-[#1e1e1e] dark:bg-gray-900 rounded-xl p-6 overflow-x-auto shadow-inner border border-gray-800 dark:border-gray-700">
              <pre className="text-gray-300 dark:text-gray-400 text-sm font-mono whitespace-pre-wrap leading-relaxed">
{`-- ==========================================
-- SCRIPT SQL ONMOOV (SUPERADMIN & FORMATIONS)
-- ==========================================

-- 1. FONCTIONS DE SÉCURITÉ (ROLES)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'super_admin' OR email IN ('irmerveilkanku@gmail.com', 'dashkanku87@gmail.com'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role IN ('super_admin', 'admin') OR email IN ('herbestinformatique@gmail.com', 'dashkanku87@gmail.com'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_trainer()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role IN ('super_admin', 'admin', 'trainer') OR email IN ('herbestinformatique@gmail.com', 'dashkanku87@gmail.com'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TABLE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'trainer', 'user')),
  full_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Profils: Lecture personnelle') THEN
    CREATE POLICY "Profils: Lecture personnelle" ON profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Profils: Lecture admin') THEN
    CREATE POLICY "Profils: Lecture admin" ON profiles FOR SELECT USING (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Profils: Modification admin') THEN
    CREATE POLICY "Profils: Modification admin" ON profiles FOR UPDATE USING (public.is_admin());
  END IF;
END $$;

-- Trigger pour création automatique du profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    CASE 
      WHEN new.email = 'irmerveilkanku@gmail.com' THEN 'super_admin'
      WHEN new.email = 'dashkanku87@gmail.com' THEN 'admin' 
      ELSE 'user' 
    END
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill profiles
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 
  CASE 
    WHEN email = 'irmerveilkanku@gmail.com' THEN 'super_admin'
    WHEN email = 'dashkanku87@gmail.com' THEN 'admin' 
    ELSE 'user' 
  END
FROM auth.users
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles SET role = 'super_admin' WHERE email IN ('irmerveilkanku@gmail.com', 'dashkanku87@gmail.com');

-- 3. PARAMÈTRES DU SITE
CREATE TABLE IF NOT EXISTS public.site_settings (
  id integer PRIMARY KEY,
  hero_title text NOT NULL,
  hero_subtitle text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  contact_address text NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure currency column exists if table was already created
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_settings' AND column_name='currency') THEN
    ALTER TABLE public.site_settings ADD COLUMN currency text DEFAULT 'EUR';
  END IF;
END $$;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lecture publique des paramètres') THEN
    CREATE POLICY "Lecture publique des paramètres" ON site_settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Modification admin des paramètres') THEN
    CREATE POLICY "Modification admin des paramètres" ON site_settings FOR ALL USING (public.is_admin());
  END IF;
END $$;

INSERT INTO public.site_settings (id, hero_title, hero_subtitle, contact_email, contact_phone, contact_address, currency)
VALUES (1, 'Construisons le futur ensemble.', 'Découvrez nos équipements d''ingénierie de pointe.', 'onmoov.engineering@outlook.be', '+33 1 23 45 67 89', 'Paris, France', '€')
ON CONFLICT (id) DO NOTHING;

-- 4. APPLICATIONS
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  file_url text NOT NULL,
  tag text NOT NULL DEFAULT 'Application',
  status text NOT NULL DEFAULT 'published',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lecture publique des apps') THEN
    CREATE POLICY "Lecture publique des apps" ON applications FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gestion admin des apps') THEN
    CREATE POLICY "Gestion admin des apps" ON applications FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- 5. CANDIDATURES FORMATEURS
CREATE TABLE IF NOT EXISTS public.trainer_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  address text,
  bio text,
  experience text,
  cover_letter text,
  cv_url text,
  passport_photo_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist and user_id is nullable (for guest applications)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_applications' AND column_name = 'user_id') THEN
    ALTER TABLE public.trainer_applications ALTER COLUMN user_id DROP NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_applications' AND column_name = 'full_name') THEN
    ALTER TABLE public.trainer_applications ADD COLUMN full_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_applications' AND column_name = 'email') THEN
    ALTER TABLE public.trainer_applications ADD COLUMN email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_applications' AND column_name = 'bio') THEN
    ALTER TABLE public.trainer_applications ADD COLUMN bio text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_applications' AND column_name = 'experience') THEN
    ALTER TABLE public.trainer_applications ADD COLUMN experience text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_applications' AND column_name = 'cover_letter') THEN
    ALTER TABLE public.trainer_applications ADD COLUMN cover_letter text;
  END IF;
END $$;

ALTER TABLE public.trainer_applications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lecture admin des candidatures') THEN
    CREATE POLICY "Lecture admin des candidatures" ON trainer_applications FOR SELECT USING (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Insertion publique des candidatures formateurs') THEN
    CREATE POLICY "Insertion publique des candidatures formateurs" ON trainer_applications FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Modification admin des candidatures') THEN
    CREATE POLICY "Modification admin des candidatures" ON trainer_applications FOR UPDATE USING (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Suppression admin des candidatures') THEN
    CREATE POLICY "Suppression admin des candidatures" ON trainer_applications FOR DELETE USING (public.is_admin());
  END IF;
END $$;

-- Trigger pour promouvoir automatiquement en formateur si approuvé
CREATE OR REPLACE FUNCTION public.handle_trainer_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'approved' AND OLD.status != 'approved') THEN
    UPDATE public.profiles SET role = 'trainer' WHERE id = NEW.user_id AND role = 'user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trainer_approval ON public.trainer_applications;
CREATE TRIGGER on_trainer_approval
  AFTER UPDATE ON public.trainer_applications
  FOR EACH ROW EXECUTE PROCEDURE public.handle_trainer_approval();

-- 6. FORMATIONS (COURSES, MODULES, LESSONS)
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  duration text NOT NULL,
  level text NOT NULL,
  image_url text NOT NULL,
  icon_name text NOT NULL,
  status text NOT NULL DEFAULT 'published',
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_paid boolean NOT NULL DEFAULT false,
  price numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'EUR',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure currency column exists if table was already created
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='currency') THEN
    ALTER TABLE public.courses ADD COLUMN currency text DEFAULT 'EUR';
  END IF;
END $$;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lecture publique des cours') THEN
    CREATE POLICY "Lecture publique des cours" ON courses FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gestion formateur des cours') THEN
    CREATE POLICY "Gestion formateur des cours" ON courses FOR ALL USING (public.is_trainer());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lecture publique des modules') THEN
    CREATE POLICY "Lecture publique des modules" ON course_modules FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gestion formateur des modules') THEN
    CREATE POLICY "Gestion formateur des modules" ON course_modules FOR ALL USING (public.is_trainer());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_type') THEN
    CREATE TYPE public.lesson_type AS ENUM ('video', 'pdf', 'audio', 'text');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  type public.lesson_type NOT NULL DEFAULT 'text',
  content_url text,
  text_content text,
  duration_minutes integer,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lecture publique des leçons') THEN
    CREATE POLICY "Lecture publique des leçons" ON course_lessons FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gestion formateur des leçons') THEN
    CREATE POLICY "Gestion formateur des leçons" ON course_lessons FOR ALL USING (public.is_trainer());
  END IF;
END $$;

-- 7. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('app-images', 'app-images', true), ('app-files', 'app-files', true)
ON CONFLICT (id) DO NOTHING;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Storage: Lecture publique' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Storage: Lecture publique" ON storage.objects FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Storage: Upload authentifié' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Storage: Upload authentifié" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 8. FONCTION DE SUPPRESSION UTILISATEUR (ADMIN)
CREATE OR REPLACE FUNCTION public.delete_user(user_id uuid)
RETURNS void AS $$
BEGIN
  IF public.is_super_admin() THEN
    DELETE FROM auth.users WHERE id = user_id;
  ELSE
    RAISE EXCEPTION 'Seul le Super Admin peut supprimer des utilisateurs.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FORUM
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'Général',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lecture publique des posts' AND tablename = 'forum_posts') THEN
    CREATE POLICY "Lecture publique des posts" ON forum_posts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Création par utilisateur authentifié' AND tablename = 'forum_posts') THEN
    CREATE POLICY "Création par utilisateur authentifié" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Modification par auteur ou admin' AND tablename = 'forum_posts') THEN
    CREATE POLICY "Modification par auteur ou admin" ON forum_posts FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Suppression par auteur ou admin' AND tablename = 'forum_posts') THEN
    CREATE POLICY "Suppression par auteur ou admin" ON forum_posts FOR DELETE USING (auth.uid() = user_id OR public.is_admin());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.forum_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lecture publique des commentaires' AND tablename = 'forum_comments') THEN
    CREATE POLICY "Lecture publique des commentaires" ON forum_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Création commentaire par utilisateur' AND tablename = 'forum_comments') THEN
    CREATE POLICY "Création commentaire par utilisateur" ON forum_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Suppression commentaire par auteur ou admin' AND tablename = 'forum_comments') THEN
    CREATE POLICY "Suppression commentaire par auteur ou admin" ON forum_comments FOR DELETE USING (auth.uid() = user_id OR public.is_admin());
  END IF;
END $$;

-- 10. ENROLLMENTS & PROGRESS
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed')),
  progress integer NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'free')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at timestamp with time zone,
  UNIQUE(course_id, user_id)
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enrollments: Lecture personnelle' AND tablename = 'course_enrollments') THEN
    CREATE POLICY "Enrollments: Lecture personnelle" ON course_enrollments FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enrollments: Lecture admin' AND tablename = 'course_enrollments') THEN
    CREATE POLICY "Enrollments: Lecture admin" ON course_enrollments FOR SELECT USING (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enrollments: Insertion par utilisateur' AND tablename = 'course_enrollments') THEN
    CREATE POLICY "Enrollments: Insertion par utilisateur" ON course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enrollments: Modification par utilisateur' AND tablename = 'course_enrollments') THEN
    CREATE POLICY "Enrollments: Modification par utilisateur" ON course_enrollments FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.course_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Progress: Lecture personnelle' AND tablename = 'course_progress') THEN
    CREATE POLICY "Progress: Lecture personnelle" ON course_progress FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Progress: Insertion par utilisateur' AND tablename = 'course_progress') THEN
    CREATE POLICY "Progress: Insertion par utilisateur" ON course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Progress: Modification par utilisateur' AND tablename = 'course_progress') THEN
    CREATE POLICY "Progress: Modification par utilisateur" ON course_progress FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 11. REVIEWS & COMMENTS
CREATE TABLE IF NOT EXISTS public.course_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(course_id, user_id)
);

ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Reviews: Lecture publique' AND tablename = 'course_reviews') THEN
    CREATE POLICY "Reviews: Lecture publique" ON course_reviews FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Reviews: Insertion par utilisateur' AND tablename = 'course_reviews') THEN
    CREATE POLICY "Reviews: Insertion par utilisateur" ON course_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Reviews: Modification par auteur' AND tablename = 'course_reviews') THEN
    CREATE POLICY "Reviews: Modification par auteur" ON course_reviews FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.course_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.course_comments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Comments: Lecture publique' AND tablename = 'course_comments') THEN
    CREATE POLICY "Comments: Lecture publique" ON course_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Comments: Insertion par utilisateur' AND tablename = 'course_comments') THEN
    CREATE POLICY "Comments: Insertion par utilisateur" ON course_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 12. QUIZZES
CREATE TABLE IF NOT EXISTS public.course_quizzes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  options text[] NOT NULL,
  correct_option_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Quizzes: Lecture publique' AND tablename = 'course_quizzes') THEN
    CREATE POLICY "Quizzes: Lecture publique" ON course_quizzes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Quizzes: Gestion formateur' AND tablename = 'course_quizzes') THEN
    CREATE POLICY "Quizzes: Gestion formateur" ON course_quizzes FOR ALL USING (public.is_trainer());
  END IF;
END $$;

-- 13. BADGES & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_type text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Badges: Lecture personnelle' AND tablename = 'user_badges') THEN
    CREATE POLICY "Badges: Lecture personnelle" ON user_badges FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Notifications: Lecture personnelle' AND tablename = 'notifications') THEN
    CREATE POLICY "Notifications: Lecture personnelle" ON notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Notifications: Modification personnelle' AND tablename = 'notifications') THEN
    CREATE POLICY "Notifications: Modification personnelle" ON notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 14. RECRUTEMENT (Offres & Candidatures)
CREATE TABLE IF NOT EXISTS public.job_offers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  department text NOT NULL,
  location text NOT NULL,
  contract_type text NOT NULL,
  description text NOT NULL,
  requirements text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Job Offers: Lecture publique' AND tablename = 'job_offers') THEN
    CREATE POLICY "Job Offers: Lecture publique" ON job_offers FOR SELECT USING (status = 'open' OR public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Job Offers: Admin full access' AND tablename = 'job_offers') THEN
    CREATE POLICY "Job Offers: Admin full access" ON job_offers FOR ALL USING (public.is_admin());
  END IF;
  -- Explicit DELETE policy for admins
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Job Offers: Admin delete' AND tablename = 'job_offers') THEN
    CREATE POLICY "Job Offers: Admin delete" ON job_offers FOR DELETE USING (public.is_admin());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.job_offers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  resume_url text,
  cover_letter_url text,
  portfolio_url text,
  linkedin_url text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'screening', 'interview', 'technical_test', 'offer', 'hired', 'rejected')),
  notes text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Job Applications: Insertion publique' AND tablename = 'job_applications') THEN
    CREATE POLICY "Job Applications: Insertion publique" ON job_applications FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Job Applications: Lecture personnelle' AND tablename = 'job_applications') THEN
    CREATE POLICY "Job Applications: Lecture personnelle" ON job_applications FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Job Applications: Admin full access' AND tablename = 'job_applications') THEN
    CREATE POLICY "Job Applications: Admin full access" ON job_applications FOR ALL USING (public.is_admin());
  END IF;
  -- Explicit DELETE policy for admins
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Job Applications: Admin delete' AND tablename = 'job_applications') THEN
    CREATE POLICY "Job Applications: Admin delete" ON job_applications FOR DELETE USING (public.is_admin());
  END IF;
END $$;
`}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'settings' && isAdmin && (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-meta-dark dark:text-white mb-8 flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-meta-blue dark:text-blue-400">
                <Settings className="w-6 h-6" />
              </div>
              Modifier les paramètres du site
            </h2>
            {siteSettings && (
              <form onSubmit={handleUpdateSettings} className="space-y-8">
                <div className="grid lg:grid-cols-2 gap-10">
                    <div className="space-y-6 bg-gray-50/50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-meta-dark dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Page d'accueil</h3>
                      <div>
                        <label className="block text-sm font-semibold text-meta-dark dark:text-gray-300 mb-2">Titre principal (Hero)</label>
                        <input
                          type="text"
                          required
                          value={siteSettings.hero_title}
                          onChange={(e) => setSiteSettings({...siteSettings, hero_title: e.target.value})}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-meta-dark dark:text-gray-300 mb-2">Sous-titre (Hero)</label>
                        <textarea
                          required
                          rows={4}
                          value={siteSettings.hero_subtitle}
                          onChange={(e) => setSiteSettings({...siteSettings, hero_subtitle: e.target.value})}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white resize-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-6 bg-gray-50/50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-meta-dark dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Informations de contact</h3>
                      <div>
                        <label className="block text-sm font-semibold text-meta-dark dark:text-gray-300 mb-2">Email de contact</label>
                        <input
                          type="email"
                          required
                          value={siteSettings.contact_email}
                          onChange={(e) => setSiteSettings({...siteSettings, contact_email: e.target.value})}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-meta-dark dark:text-gray-300 mb-2">Téléphone</label>
                        <input
                          type="text"
                          required
                          value={siteSettings.contact_phone}
                          onChange={(e) => setSiteSettings({...siteSettings, contact_phone: e.target.value})}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-meta-dark dark:text-gray-300 mb-2">Adresse physique</label>
                        <textarea
                          required
                          rows={3}
                          value={siteSettings.contact_address}
                          onChange={(e) => setSiteSettings({...siteSettings, contact_address: e.target.value})}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-meta-dark dark:text-gray-300 mb-2">Devise d'affichage (Monnaie)</label>
                        <select
                          value={siteSettings.currency || 'EUR'}
                          onChange={(e) => setSiteSettings({...siteSettings, currency: e.target.value})}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                        >
                          <option value="EUR">Euro (€)</option>
                          <option value="USD">Dollar ($)</option>
                          <option value="CDF">Franc Congolais (FC)</option>
                          <option value="ZAR">Rand (R)</option>
                        </select>
                      </div>
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Mettre à jour tous les cours</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400">Appliquer la devise "{siteSettings.currency}" à toutes les formations existantes.</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleUpdateAllCoursesCurrency}
                            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                          >
                            Appliquer
                          </button>
                        </div>
                      </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="flex justify-center items-center gap-2 rounded-xl bg-meta-blue py-3 px-8 text-sm font-bold text-white hover:bg-blue-700 focus:outline-none transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isSavingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'apps' && (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-meta-blue dark:text-blue-400">
                    <AppWindow className="w-5 h-5" />
                  </div>
                  {editingAppId ? 'Modifier l\'application' : 'Publier une application'}
                </h2>
                <form key={appFormKey} onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                      placeholder="Nom de l'application"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden focus-within:border-meta-blue focus-within:ring-2 focus-within:ring-meta-blue/20 transition-all">
                      <ReactQuill 
                        theme="snow" 
                        value={description} 
                        onChange={setDescription}
                        className="h-32 mb-12 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tag</label>
                    <input
                      type="text"
                      required
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                      placeholder="ex: Application, Service"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Statut</label>
                    <select
                      value={appStatus}
                      onChange={(e) => setAppStatus(e.target.value as 'draft' | 'published')}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                    >
                      <option value="published">Publié</option>
                      <option value="draft">Brouillon</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Image de l'application {editingAppId && '(optionnel)'}</label>
                    <div 
                      {...getAppImageProps()} 
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isAppImageDragActive ? 'border-meta-blue bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-meta-blue/50 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      <input {...getAppImageInputProps()} />
                      {appImageFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-green-500" />
                          <p className="text-sm text-gray-900 dark:text-white font-medium">{appImageFile.name}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-gray-400" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {editingAppId ? 'Nouvelle image pour remplacer' : 'Glissez-déposez ou cliquez'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fichier (.exe, .zip) {editingAppId && '(optionnel)'}</label>
                    <div 
                      {...getAppFileProps()} 
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isAppFileDragActive ? 'border-meta-blue bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-meta-blue/50 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      <input {...getAppFileInputProps()} />
                      {appFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-green-500" />
                          <p className="text-sm text-gray-900 dark:text-white font-medium">{appFile.name}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-8 h-8 text-gray-400" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {editingAppId ? 'Nouveau fichier pour remplacer' : 'Glissez-déposez ou cliquez'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    {editingAppId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAppId(null);
                          setName('');
                          setDescription('');
                          setTag('Application');
                          setAppStatus('published');
                          setAppImageFile(null);
                          setAppFile(null);
                          setAppFormKey(prev => prev + 1);
                        }}
                        className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-2.5 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                      >
                        Annuler
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-meta-blue py-2.5 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-meta-blue/50 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {editingAppId ? 'Mettre à jour' : 'Enregistrer'}</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <AppWindow className="w-5 h-5 text-gray-400" />
                    Applications publiées
                  </h2>
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-meta-blue focus:ring-2 focus:ring-meta-blue/20 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {applications.filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AppWindow className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune application trouvée.</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Essayez de modifier votre recherche ou ajoutez une nouvelle application.</p>
                    </div>
                  ) : (
                    applications.filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase())).map((app) => (
                      <div key={app.id} className="p-6 flex flex-col sm:flex-row items-start gap-5 hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors group">
                        <img src={app.image_url} alt={app.name} className="w-20 h-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{app.name}</h3>
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50">
                              {app.tag}
                            </span>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${app.status !== 'draft' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-800/50' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-800/50'}`}>
                              {app.status !== 'draft' ? 'Publié' : 'Brouillon'}
                            </span>
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: app.description }} />
                          <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                              {new Date(app.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5 text-gray-400" /> 
                              {app.downloads_count || 0} téléchargements
                            </span>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center gap-2 mt-4 sm:mt-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditApp(app)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-meta-blue dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                            title="Modifier"
                          >
                            <UserCog className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-800"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-meta-blue dark:text-blue-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  {editingCourseId ? 'Modifier la formation' : 'Ajouter une formation'}
                </h2>
                <form key={courseFormKey} onSubmit={handleCourseSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Titre</label>
                    <input
                      type="text"
                      required
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                      placeholder="Titre de la formation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Catégorie</label>
                    <input
                      type="text"
                      required
                      value={courseCategory}
                      onChange={(e) => setCourseCategory(e.target.value)}
                      placeholder="ex: Logiciel, Hardware, Data Science..."
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden focus-within:border-meta-blue focus-within:ring-2 focus-within:ring-meta-blue/20 transition-all">
                      <ReactQuill 
                        theme="snow" 
                        value={courseDescription} 
                        onChange={setCourseDescription}
                        className="h-32 mb-12 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Durée</label>
                      <input
                        type="text"
                        required
                        value={courseDuration}
                        onChange={(e) => setCourseDuration(e.target.value)}
                        placeholder="ex: 12 semaines"
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Niveau</label>
                      <input
                        type="text"
                        required
                        value={courseLevel}
                        onChange={(e) => setCourseLevel(e.target.value)}
                        placeholder="ex: Avancé"
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Statut</label>
                    <select
                      value={courseStatus}
                      onChange={(e) => setCourseStatus(e.target.value as 'draft' | 'published')}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                    >
                      <option value="published">Publié</option>
                      <option value="draft">Brouillon</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center h-5">
                      <input
                        id="is_paid"
                        type="checkbox"
                        checked={courseIsPaid}
                        onChange={(e) => setCourseIsPaid(e.target.checked)}
                        className="w-4 h-4 text-meta-blue bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-meta-blue focus:ring-2"
                      />
                    </div>
                    <div className="text-sm">
                      <label htmlFor="is_paid" className="font-medium text-gray-700 dark:text-gray-300">Formation payante</label>
                      <p className="text-gray-500 dark:text-gray-400">Cochez cette case si la formation nécessite un paiement.</p>
                    </div>
                  </div>
                  {courseIsPaid && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prix</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={coursePrice}
                          onChange={(e) => setCoursePrice(parseFloat(e.target.value))}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                          placeholder="ex: 49.99"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Devise (Monnaie)</label>
                        <select
                          value={courseCurrency}
                          onChange={(e) => setCourseCurrency(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                        >
                          <option value="EUR">Euro (€)</option>
                          <option value="USD">Dollar ($)</option>
                          <option value="CDF">Franc Congolais (FC)</option>
                          <option value="ZAR">Rand (R)</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Image d'illustration {editingCourseId && '(optionnel)'}</label>
                    <div 
                      {...getCourseImageProps()} 
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isCourseImageDragActive ? 'border-meta-blue bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-meta-blue/50 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      <input {...getCourseImageInputProps()} />
                      {courseImageFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-green-500" />
                          <p className="text-sm text-gray-900 dark:text-white font-medium">{courseImageFile.name}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-gray-400" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {editingCourseId ? 'Nouvelle image pour remplacer' : 'Glissez-déposez ou cliquez'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Icône (Nom Lucide)</label>
                    <select
                      value={courseIconName}
                      onChange={(e) => setCourseIconName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-white dark:bg-gray-900 dark:text-white"
                    >
                      <option value="Code">Code</option>
                      <option value="Cpu">Cpu (Hardware)</option>
                      <option value="BrainCircuit">BrainCircuit (IA/Data)</option>
                      <option value="Shield">Shield (Sécurité)</option>
                      <option value="GraduationCap">GraduationCap (Général)</option>
                      <option value="BookOpen">BookOpen (Théorie)</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    {editingCourseId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCourseId(null);
                          setCourseTitle('');
                          setCourseCategory('');
                          setCourseDescription('');
                          setCourseDuration('');
                          setCourseLevel('');
                          setCourseStatus('published');
                          setCourseImageFile(null);
                          setCourseIconName('Code');
                          setCourseFormKey(prev => prev + 1);
                        }}
                        className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-2.5 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                      >
                        Annuler
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-meta-blue py-2.5 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-meta-blue/50 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {editingCourseId ? 'Mettre à jour' : 'Ajouter'}</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-gray-400" />
                    Formations proposées
                  </h2>
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-meta-blue focus:ring-2 focus:ring-meta-blue/20 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {courses.filter(course => course.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <GraduationCap className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune formation trouvée.</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Essayez de modifier votre recherche ou ajoutez une nouvelle formation.</p>
                    </div>
                  ) : (
                    courses.filter(course => course.title.toLowerCase().includes(searchTerm.toLowerCase())).map((course) => (
                      <div key={course.id} className="p-6 flex flex-col sm:flex-row items-start gap-5 hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors group">
                        <img src={course.image_url} alt={course.title} className="w-24 h-24 sm:h-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{course.title}</h3>
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50">
                              {course.category}
                            </span>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${course.status !== 'draft' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-800/50' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-800/50'}`}>
                              {course.status !== 'draft' ? 'Publié' : 'Brouillon'}
                            </span>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${course.is_paid ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-800/50'}`}>
                              {course.is_paid ? `${course.price} ${getCurrencySymbol(course.currency || siteSettings?.currency)}` : 'Gratuit'}
                            </span>
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: course.description }} />
                          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                              {new Date(course.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                              {course.duration}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                              {course.level}
                            </span>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center gap-2 mt-4 sm:mt-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/admin/courses/${course.id}/users`}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-meta-blue dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                            title="Gérer les inscrits"
                          >
                            <Users className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/courses/${course.id}`}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-meta-blue dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                            title="Gérer le contenu"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleEditCourse(course)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-meta-blue dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                            title="Modifier"
                          >
                            <UserCog className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCourseDelete(course.id)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-800"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {/* Modal Détails Candidature */}
      {isTrainerAppModalOpen && selectedTrainerApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
          >
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-xl font-bold text-meta-dark dark:text-white flex items-center gap-3">
                <FileText className="w-6 h-6 text-meta-blue" />
                Détails de la candidature
              </h3>
              <button
                onClick={() => setIsTrainerAppModalOpen(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45 text-gray-500" />
              </button>
            </div>
            <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                {selectedTrainerApp.passport_photo_url && (
                  <img 
                    src={selectedTrainerApp.passport_photo_url} 
                    alt="Passport" 
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-xl sm:text-2xl font-bold text-meta-dark dark:text-white mb-1">{selectedTrainerApp.full_name}</h4>
                  <p className="text-sm sm:text-base text-meta-gray dark:text-gray-400 mb-4">{selectedTrainerApp.email}</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-meta-dark dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                      <strong>Tél:</strong> {selectedTrainerApp.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-meta-dark dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                      <strong>Adresse:</strong> {selectedTrainerApp.address}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-bold text-meta-gray dark:text-gray-400 uppercase tracking-wider mb-2">Lettre de Motivation</h5>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-sm text-meta-dark dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {selectedTrainerApp.cover_letter}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-bold text-meta-gray dark:text-gray-400 uppercase tracking-wider mb-2">Bio</h5>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-sm text-meta-dark dark:text-gray-300 whitespace-pre-wrap">
                      {selectedTrainerApp.bio}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-meta-gray dark:text-gray-400 uppercase tracking-wider mb-2">Expérience</h5>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-sm text-meta-dark dark:text-gray-300 whitespace-pre-wrap">
                      {selectedTrainerApp.experience}
                    </div>
                  </div>
                </div>
              </div>

              {selectedTrainerApp.cv_url && (
                <div className="pt-4">
                  <a 
                    href={selectedTrainerApp.cv_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 sm:gap-3 w-full py-3 sm:py-4 bg-meta-blue text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" /> Voir le CV (PDF/Word)
                  </a>
                </div>
              )}
            </div>
            <div className="px-6 sm:px-8 py-4 sm:py-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 bg-gray-50/50 dark:bg-gray-900/50">
              <button
                onClick={() => handleDeleteTrainerApplication(selectedTrainerApp.id)}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-red-600 dark:text-red-400 font-bold hover:underline text-sm sm:text-base mr-auto"
              >
                Supprimer définitivement
              </button>
              {selectedTrainerApp.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleUpdateApplicationStatus(selectedTrainerApp.id, 'rejected');
                      setIsTrainerAppModalOpen(false);
                    }}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 transition-colors text-sm sm:text-base"
                  >
                    Rejeter
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateApplicationStatus(selectedTrainerApp.id, 'approved');
                      setIsTrainerAppModalOpen(false);
                    }}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                  >
                    Approuver
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}
