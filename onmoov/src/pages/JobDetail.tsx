import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase, MapPin, Clock, ArrowLeft, Upload, CheckCircle2, Loader2, FileText, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { JobOffer } from '../types';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobOffer | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    resumeUrl: '',
    coverLetterUrl: '',
    portfolioUrl: '',
    linkedinUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (id) fetchJob();
    
    // Pre-fill user data if logged in
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setFormData(prev => ({
          ...prev,
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || ''
        }));
      }
    }
    getSession();
  }, [id]);

  async function fetchJob() {
    try {
      const { data, error } = await supabase
        .from('job_offers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Offre introuvable');
      navigate('/carrieres');
    } finally {
      setLoading(false);
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          user_id: session?.session?.user?.id || null,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          resume_url: formData.resumeUrl,
          cover_letter_url: formData.coverLetterUrl,
          portfolio_url: formData.portfolioUrl,
          linkedin_url: formData.linkedinUrl,
          status: 'new'
        });

      if (error) throw error;
      
      setSubmitted(true);
      toast.success('Candidature envoyée avec succès !');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Erreur lors de l\'envoi de la candidature');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-meta-blue" />
        </div>
      </Layout>
    );
  }

  if (!job) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-12 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <Link to="/carrieres" className="inline-flex items-center gap-2 text-meta-blue dark:text-blue-400 hover:underline mb-8 transition-colors font-bold text-lg">
            <ArrowLeft className="w-5 h-5" /> Retour aux offres
          </Link>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-meta-blue dark:text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">
                  {job.department}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-meta-dark dark:text-white mb-6">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-300 pb-8 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  {job.location}
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  {job.contract_type}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  Temps plein
                </div>
              </div>

              <div className="pt-8 prose prose-lg dark:prose-invert max-w-none">
                <h3 className="text-xl font-bold text-meta-dark dark:text-white mb-4">Description du poste</h3>
                <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-300 mb-8">
                  {job.description}
                </div>

                <h3 className="text-xl font-bold text-meta-dark dark:text-white mb-4">Prérequis & Compétences</h3>
                <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                  {job.requirements}
                </div>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm sticky top-24">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-meta-dark dark:text-white mb-4">Candidature envoyée !</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-8">
                    Merci pour votre intérêt. Notre équipe RH examinera votre profil et vous contactera prochainement.
                  </p>
                  <Link
                    to="/carrieres"
                    className="inline-block w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-meta-dark dark:text-white rounded-xl font-medium transition-colors"
                  >
                    Voir d'autres offres
                  </Link>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-meta-dark dark:text-white mb-6">Postuler maintenant</h3>
                  <form onSubmit={handleApply} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prénom *</label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom *</label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Téléphone *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lien CV (Drive, Dropbox, etc.) *</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          required
                          placeholder="https://"
                          value={formData.resumeUrl}
                          onChange={(e) => setFormData({...formData, resumeUrl: e.target.value})}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 pl-10 pr-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lettre de motivation (Lien)</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          placeholder="https://"
                          value={formData.coverLetterUrl}
                          onChange={(e) => setFormData({...formData, coverLetterUrl: e.target.value})}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 pl-10 pr-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Portfolio / Site web</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          placeholder="https://"
                          value={formData.portfolioUrl}
                          onChange={(e) => setFormData({...formData, portfolioUrl: e.target.value})}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 pl-10 pr-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Profil LinkedIn</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          placeholder="https://linkedin.com/in/..."
                          value={formData.linkedinUrl}
                          onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 pl-10 pr-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-meta-blue hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-70 mt-4"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer ma candidature'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
}
