import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, FileBadge, Loader2, Download, CheckCircle, Shield, Star, Zap, Trophy, Crown, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';

export default function Achievements() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const AVAILABLE_BADGES = [
    {
      id: 'first_course',
      name: 'Premier Pas',
      description: 'Avoir complété une première formation',
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      condition: (enrollments: any[]) => enrollments.length >= 1
    },
    {
      id: 'three_courses',
      name: 'Apprenti Assidu',
      description: 'Avoir complété 3 formations',
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      condition: (enrollments: any[]) => enrollments.length >= 3
    },
    {
      id: 'five_courses',
      name: 'Expert en Devenir',
      description: 'Avoir complété 5 formations',
      icon: Trophy,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      condition: (enrollments: any[]) => enrollments.length >= 5
    },
    {
      id: 'certified',
      name: 'Certifié',
      description: 'Avoir obtenu un certificat professionnel',
      icon: FileBadge,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      condition: (enrollments: any[]) => enrollments.some(e => e.course?.is_paid)
    },
    {
      id: 'fast_learner',
      name: 'Étoile Montante',
      description: 'Avoir complété 10 formations',
      icon: Crown,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      condition: (enrollments: any[]) => enrollments.length >= 10
    }
  ];

  useEffect(() => {
    fetchAchievements();
  }, []);

  async function fetchAchievements() {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single();
      
      setUserProfile(profile);

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('user_id', session.session.user.id)
        .eq('status', 'completed');

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Erreur lors du chargement de vos accomplissements');
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadCertificate = (courseName: string, date: string) => {
    toast.success(`Génération du certificat pour ${courseName}...`);
    
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Background color
      doc.setFillColor(245, 247, 250);
      doc.rect(0, 0, 297, 210, 'F');

      // Border
      doc.setDrawColor(0, 100, 224); // Meta blue
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190);

      // Inner border
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(15, 15, 267, 180);

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(40);
      doc.setTextColor(28, 43, 51); // Meta dark
      doc.text('CERTIFICAT DE RÉUSSITE', 148.5, 50, { align: 'center' });

      // Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.setTextColor(101, 103, 107); // Meta gray
      doc.text('Ce certificat est fièrement décerné à', 148.5, 75, { align: 'center' });

      // Student Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(32);
      doc.setTextColor(0, 100, 224); // Meta blue
      const studentName = userProfile?.full_name || userProfile?.email || 'Étudiant';
      doc.text(studentName, 148.5, 100, { align: 'center' });

      // Course text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.setTextColor(101, 103, 107);
      doc.text('pour avoir complété avec succès la formation :', 148.5, 120, { align: 'center' });

      // Course Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(28, 43, 51);
      
      // Split course name if too long
      const splitTitle = doc.splitTextToSize(courseName, 200);
      doc.text(splitTitle, 148.5, 140, { align: 'center' });

      // Date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(101, 103, 107);
      const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Délivré le ${formattedDate}`, 148.5, 175, { align: 'center' });

      // Signature / Logo area
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(28, 43, 51);
      doc.text('onmoov.engineering', 148.5, 190, { align: 'center' });

      // Save the PDF
      doc.save(`Certificat_${courseName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center pt-20 bg-gray-50 dark:bg-gray-900">
          <Loader2 className="w-12 h-12 animate-spin text-meta-blue dark:text-blue-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pt-32 pb-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 bg-meta-blue/10 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
              <Award className="w-8 h-8 text-meta-blue dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-meta-dark dark:text-white">Mes Accomplissements</h1>
              <p className="text-meta-gray dark:text-gray-400 mt-2">Retrouvez vos badges et certificats de réussite</p>
            </div>
          </div>

          {/* Badges Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-meta-dark dark:text-white mb-6">Collection de Badges</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {AVAILABLE_BADGES.map((badge, index) => {
                const isEarned = badge.condition(enrollments);
                const Icon = badge.icon;
                
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative p-6 rounded-3xl border ${isEarned ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-70'} flex flex-col items-center text-center transition-all`}
                  >
                    {!isEarned && (
                      <div className="absolute top-4 right-4">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isEarned ? badge.bgColor : 'bg-gray-200 dark:bg-gray-700'}`}>
                      <Icon className={`w-8 h-8 ${isEarned ? badge.color : 'text-gray-400 dark:text-gray-500'}`} />
                    </div>
                    <h3 className={`font-bold mb-2 ${isEarned ? 'text-meta-dark dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {badge.name}
                    </h3>
                    <p className="text-xs text-meta-gray dark:text-gray-500">
                      {badge.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Certificates Section */}
          <div>
            <h2 className="text-2xl font-bold text-meta-dark dark:text-white mb-6">Certificats & Formations complétées</h2>
            {enrollments.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-12 h-12 text-gray-300 dark:text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold text-meta-dark dark:text-white mb-4">Aucun certificat pour le moment</h2>
                <p className="text-meta-gray dark:text-gray-400 mb-8 max-w-md mx-auto">
                  Terminez des formations pour débloquer des certificats professionnels.
                </p>
                <Link 
                  to="/formations"
                  className="inline-flex items-center justify-center px-8 py-4 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-xl font-bold transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  Découvrir les formations
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {enrollments.map((enrollment, index) => {
                const isPaid = enrollment.course.is_paid;
                
                return (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className={`h-32 ${isPaid ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gradient-to-br from-meta-blue to-blue-600'} relative overflow-hidden flex items-center justify-center`}>
                      <div className="absolute inset-0 bg-black/10"></div>
                      {isPaid ? (
                        <FileBadge className="w-16 h-16 text-white/90 relative z-10 drop-shadow-md" />
                      ) : (
                        <Shield className="w-16 h-16 text-white/90 relative z-10 drop-shadow-md" />
                      )}
                    </div>
                    
                    <div className="p-8">
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${isPaid ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                          {isPaid ? 'Certificat Professionnel' : 'Badge de Réussite'}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-meta-dark dark:text-white mb-2 line-clamp-2">
                        {enrollment.course.title}
                      </h3>
                      
                      <p className="text-sm text-meta-gray dark:text-gray-400 mb-6">
                        Obtenu le {new Date(enrollment.completed_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      
                      {isPaid ? (
                        <button 
                          onClick={() => handleDownloadCertificate(enrollment.course.title, enrollment.completed_at)}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-meta-dark dark:text-white rounded-xl font-semibold transition-colors border border-gray-200 dark:border-gray-600"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger le certificat
                        </button>
                      ) : (
                        <div className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl font-semibold border border-green-100 dark:border-green-900/50">
                          <CheckCircle className="w-4 h-4" />
                          Badge débloqué
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
