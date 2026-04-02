import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Course, Enrollment, Profile } from '../types';
import { ArrowLeft, Search, GraduationCap, CheckCircle2, XCircle, Award, Mail, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface EnrollmentWithUser extends Enrollment {
  profile: Profile;
}

export default function AdminCourseUsers() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();
  const SUPER_ADMIN_EMAIL = 'irmerveilkanku@gmail.com';
  const SECONDARY_ADMIN_EMAIL = 'herbestinformatique@gmail.com';

  useEffect(() => {
    if (id) {
      checkAdminAndFetchData();
    }
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

      await fetchCourseAndEnrollments();
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) return;
      console.error('Error checking auth:', error);
      navigate('/');
    }
  }

  async function fetchCourseAndEnrollments() {
    try {
      setLoading(true);
      // Fetch course details
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

      // Fetch enrollments with user profiles
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('course_id', id)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) {
        if (enrollmentsError.message?.includes('AbortError') || enrollmentsError.message?.includes('Lock broken')) {
          return;
        }
        throw enrollmentsError;
      }
      setEnrollments(enrollmentsData as unknown as EnrollmentWithUser[]);
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) return;
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateEnrollmentStatus(enrollmentId: string, status: 'enrolled' | 'completed') {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({ status })
        .eq('id', enrollmentId);

      if (error) throw error;
      toast.success('Statut mis à jour avec succès');
      fetchCourseAndEnrollments();
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('Lock broken')) return;
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  }

  async function handleUpdatePaymentStatus(enrollmentId: string, payment_status: 'pending' | 'paid' | 'free') {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({ payment_status })
        .eq('id', enrollmentId);

      if (error) throw error;
      toast.success('Statut de paiement mis à jour avec succès');
      fetchCourseAndEnrollments();
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('Lock broken')) return;
      console.error('Error updating payment status:', error);
      toast.error('Erreur lors de la mise à jour du statut de paiement');
    }
  }

  async function handleIssueCertificate(enrollment: EnrollmentWithUser) {
    try {
      // Check if certificate already exists
      const { data: existingCert, error: checkError } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', enrollment.user_id)
        .eq('course_id', enrollment.course_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingCert) {
        toast.error('Un certificat a déjà été émis pour cet utilisateur.');
        return;
      }

      // In a real app, you would generate a PDF here and upload it to storage
      // For now, we just create the record
      const { error: insertError } = await supabase
        .from('certificates')
        .insert([{
          user_id: enrollment.user_id,
          course_id: enrollment.course_id,
          certificate_url: 'https://example.com/certificate.pdf' // Placeholder
        }]);

      if (insertError) throw insertError;

      // Update enrollment status to completed if it isn't already
      if (enrollment.status !== 'completed') {
        await supabase
          .from('course_enrollments')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', enrollment.id);
      }

      toast.success('Certificat émis avec succès');
      fetchCourseAndEnrollments();
    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast.error('Erreur lors de l\'émission du certificat');
    }
  }

  const filteredEnrollments = enrollments.filter(enrollment => 
    enrollment.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-meta-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <GraduationCap className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Formation introuvable</h2>
        <Link to="/admin" className="text-meta-blue hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Retour à l'administration
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-4">
              <Link 
                to="/admin"
                className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Inscrits : {course.title}
                </h1>
                <p className="text-sm text-gray-500">
                  Gérez les utilisateurs inscrits à cette formation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-meta-blue" />
              Liste des inscrits ({enrollments.length})
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-meta-blue focus:ring-2 focus:ring-meta-blue/20 transition-all bg-gray-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inscription</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Progression</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  {course.is_paid && (
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Paiement</th>
                  )}
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={course.is_paid ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                      Aucun inscrit trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-meta-blue font-bold">
                            {enrollment.profile?.full_name?.charAt(0) || enrollment.profile?.email?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{enrollment.profile?.full_name || 'Utilisateur inconnu'}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {enrollment.profile?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(enrollment.enrolled_at).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-24">
                            <div 
                              className="h-full bg-meta-blue rounded-full"
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{Math.round(enrollment.progress)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={enrollment.status}
                          onChange={(e) => handleUpdateEnrollmentStatus(enrollment.id, e.target.value as any)}
                          className={`text-sm rounded-full px-3 py-1 font-medium border-0 cursor-pointer focus:ring-2 focus:ring-meta-blue/20 ${
                            enrollment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}
                        >
                          <option value="enrolled">Inscrit</option>
                          <option value="completed">Terminé</option>
                        </select>
                      </td>
                      {course.is_paid && (
                        <td className="px-6 py-4">
                          <select
                            value={enrollment.payment_status}
                            onChange={(e) => handleUpdatePaymentStatus(enrollment.id, e.target.value as any)}
                            className={`text-sm rounded-full px-3 py-1 font-medium border-0 cursor-pointer focus:ring-2 focus:ring-meta-blue/20 ${
                              enrollment.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                              enrollment.payment_status === 'free' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <option value="pending">En attente</option>
                            <option value="paid">Payé</option>
                            <option value="free">Gratuit</option>
                          </select>
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleIssueCertificate(enrollment)}
                          disabled={enrollment.progress < 100 && enrollment.status !== 'completed'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            enrollment.progress >= 100 || enrollment.status === 'completed'
                              ? 'text-meta-blue bg-blue-50 hover:bg-blue-100'
                              : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                          }`}
                          title={enrollment.progress < 100 && enrollment.status !== 'completed' ? "La formation doit être terminée pour émettre un certificat" : "Émettre un certificat"}
                        >
                          <Award className="w-4 h-4" />
                          <span className="hidden sm:inline">Certificat</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
