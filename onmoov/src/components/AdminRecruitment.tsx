import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, Trash2, Search, Briefcase, MapPin, Clock, CheckCircle2, XCircle, FileText, Link as LinkIcon, Loader2, Eye, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { JobOffer, JobApplication } from '../types';
import toast from 'react-hot-toast';

export default function AdminRecruitment() {
  const [activeTab, setActiveTab] = useState<'offers' | 'applications'>('offers');
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [isEditingOffer, setIsEditingOffer] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<Partial<JobOffer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Application view state
  const [viewingApplication, setViewingApplication] = useState<JobApplication | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'offers') {
        const { data, error } = await supabase
          .from('job_offers')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching job offers:', error);
          throw error;
        }
        setOffers(data || []);
      } else {
        const { data, error } = await supabase
          .from('job_applications')
          .select(`
            *,
            job_offers (title)
          `)
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching job applications:', error);
          throw error;
        }
        setApplications(data || []);
      }
    } catch (error: any) {
      console.error('Fetch data error details:', error);
      toast.error(`Erreur lors du chargement des données: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentOffer.id) {
        const { error } = await supabase
          .from('job_offers')
          .update({
            title: currentOffer.title,
            department: currentOffer.department,
            location: currentOffer.location,
            contract_type: currentOffer.contract_type,
            description: currentOffer.description,
            requirements: currentOffer.requirements,
            status: currentOffer.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentOffer.id);
        if (error) throw error;
        toast.success('Offre mise à jour');
      } else {
        const { error } = await supabase
          .from('job_offers')
          .insert({
            title: currentOffer.title,
            department: currentOffer.department,
            location: currentOffer.location,
            contract_type: currentOffer.contract_type,
            description: currentOffer.description,
            requirements: currentOffer.requirements,
            status: currentOffer.status || 'draft'
          });
        if (error) throw error;
        toast.success('Offre créée');
      }
      setIsEditingOffer(false);
      setCurrentOffer({});
      fetchData();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) return;
    try {
      const { error } = await supabase.from('job_offers').delete().eq('id', id);
      if (error) throw error;
      toast.success('Offre supprimée');
      fetchData();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleUpdateApplicationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success('Statut mis à jour');
      
      // Update local state if viewing
      if (viewingApplication && viewingApplication.id === id) {
        setViewingApplication({ ...viewingApplication, status: status as any });
      }
      
      // Refresh list
      fetchData();
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette candidature ?')) return;
    try {
      const { error } = await supabase.from('job_applications').delete().eq('id', id);
      if (error) throw error;
      toast.success('Candidature supprimée');
      if (viewingApplication?.id === id) setViewingApplication(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredOffers = offers.filter(offer => 
    offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApplications = applications.filter(app => {
    return `${app.first_name} ${app.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.job_offers?.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'closed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'screening': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'interview': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'technical_test': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'offer': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400';
      case 'hired': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouverte';
      case 'closed': return 'Fermée';
      case 'draft': return 'Brouillon';
      case 'new': return 'Nouvelle';
      case 'screening': return 'En revue';
      case 'interview': return 'Entretien';
      case 'technical_test': return 'Test technique';
      case 'offer': return 'Offre faite';
      case 'hired': return 'Embauché(e)';
      case 'rejected': return 'Rejetée';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'offers' 
                ? 'bg-white dark:bg-gray-700 text-meta-dark dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-meta-dark dark:hover:text-white'
            }`}
          >
            Offres d'emploi
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'applications' 
                ? 'bg-white dark:bg-gray-700 text-meta-dark dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-meta-dark dark:hover:text-white'
            }`}
          >
            Candidatures
          </button>
        </div>

        {activeTab === 'offers' && !isEditingOffer && (
          <button
            onClick={() => {
              setCurrentOffer({ status: 'draft' });
              setIsEditingOffer(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-meta-blue text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Nouvelle offre
          </button>
        )}
      </div>

      {/* Search */}
      {!isEditingOffer && !viewingApplication && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'offers' ? "Rechercher une offre..." : "Rechercher un candidat..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-meta-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-meta-blue/20"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-meta-blue" />
        </div>
      ) : (
        <>
          {/* OFFERS TAB */}
          {activeTab === 'offers' && (
            isEditingOffer ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-meta-dark dark:text-white">
                    {currentOffer.id ? 'Modifier l\'offre' : 'Nouvelle offre d\'emploi'}
                  </h3>
                  <button
                    onClick={() => setIsEditingOffer(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSaveOffer} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Titre du poste *</label>
                      <input
                        type="text"
                        required
                        value={currentOffer.title || ''}
                        onChange={(e) => setCurrentOffer({...currentOffer, title: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Département *</label>
                      <input
                        type="text"
                        required
                        value={currentOffer.department || ''}
                        onChange={(e) => setCurrentOffer({...currentOffer, department: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                        placeholder="ex: Ingénierie, Marketing, RH..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Localisation *</label>
                      <input
                        type="text"
                        required
                        value={currentOffer.location || ''}
                        onChange={(e) => setCurrentOffer({...currentOffer, location: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                        placeholder="ex: Kinshasa, Distanciel..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type de contrat *</label>
                      <select
                        required
                        value={currentOffer.contract_type || ''}
                        onChange={(e) => setCurrentOffer({...currentOffer, contract_type: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                      >
                        <option value="">Sélectionner...</option>
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Stage">Stage</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description du poste *</label>
                    <textarea
                      required
                      rows={6}
                      value={currentOffer.description || ''}
                      onChange={(e) => setCurrentOffer({...currentOffer, description: e.target.value})}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white resize-y"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prérequis & Compétences *</label>
                    <textarea
                      required
                      rows={4}
                      value={currentOffer.requirements || ''}
                      onChange={(e) => setCurrentOffer({...currentOffer, requirements: e.target.value})}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white resize-y"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Statut</label>
                    <select
                      value={currentOffer.status || 'draft'}
                      onChange={(e) => setCurrentOffer({...currentOffer, status: e.target.value as any})}
                      className="w-full md:w-1/3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-white dark:bg-gray-900 dark:text-white"
                    >
                      <option value="draft">Brouillon</option>
                      <option value="open">Ouverte (Publiée)</option>
                      <option value="closed">Fermée</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setIsEditingOffer(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-2 bg-meta-blue text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                        <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Poste</th>
                        <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Département</th>
                        <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                        <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Date</th>
                        <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOffers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                            Aucune offre trouvée
                          </td>
                        </tr>
                      ) : (
                        filteredOffers.map((offer) => (
                          <tr key={offer.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="p-4">
                              <div className="font-medium text-meta-dark dark:text-white">{offer.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                <MapPin className="w-3 h-3" /> {offer.location} • {offer.contract_type}
                              </div>
                            </td>
                            <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{offer.department}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                                {getStatusLabel(offer.status)}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                              {new Date(offer.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setCurrentOffer(offer);
                                    setIsEditingOffer(true);
                                  }}
                                  className="p-2 text-gray-400 hover:text-meta-blue transition-colors"
                                  title="Modifier"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOffer(offer.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            viewingApplication ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <button
                      onClick={() => setViewingApplication(null)}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-meta-blue mb-4 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Retour à la liste
                    </button>
                    <h2 className="text-2xl font-bold text-meta-dark dark:text-white">
                      {viewingApplication.first_name} {viewingApplication.last_name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Candidature pour : <span className="font-semibold">{viewingApplication.job_offers?.title}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteApplication(viewingApplication.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(viewingApplication.status)}`}>
                        {getStatusLabel(viewingApplication.status)}
                      </span>
                    </div>
                    <select
                      value={viewingApplication.status}
                      onChange={(e) => handleUpdateApplicationStatus(viewingApplication.id, e.target.value)}
                      className="mt-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-meta-dark dark:text-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-meta-blue/20"
                    >
                      <option value="new">Nouvelle</option>
                      <option value="screening">En revue</option>
                      <option value="interview">Entretien</option>
                      <option value="technical_test">Test technique</option>
                      <option value="offer">Offre faite</option>
                      <option value="hired">Embauché(e)</option>
                      <option value="rejected">Rejetée</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Contact</h3>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                          <a href={`mailto:${viewingApplication.email}`} className="text-sm font-medium text-meta-blue hover:underline">
                            {viewingApplication.email}
                          </a>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Téléphone</span>
                          <a href={`tel:${viewingApplication.phone}`} className="text-sm font-medium text-meta-dark dark:text-white hover:text-meta-blue">
                            {viewingApplication.phone}
                          </a>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Date de candidature</span>
                          <span className="text-sm font-medium text-meta-dark dark:text-white">
                            {new Date(viewingApplication.created_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Documents & Liens</h3>
                      <div className="space-y-3">
                        {viewingApplication.resume_url && (
                          <a href={viewingApplication.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-meta-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-white dark:group-hover:bg-gray-700">
                              <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-meta-blue" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-meta-dark dark:text-white group-hover:text-meta-blue">CV / Resume</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{viewingApplication.resume_url}</div>
                            </div>
                          </a>
                        )}
                        {viewingApplication.cover_letter_url && (
                          <a href={viewingApplication.cover_letter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-meta-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-white dark:group-hover:bg-gray-700">
                              <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-meta-blue" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-meta-dark dark:text-white group-hover:text-meta-blue">Lettre de motivation</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{viewingApplication.cover_letter_url}</div>
                            </div>
                          </a>
                        )}
                        {viewingApplication.portfolio_url && (
                          <a href={viewingApplication.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-meta-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-white dark:group-hover:bg-gray-700">
                              <LinkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-meta-blue" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-meta-dark dark:text-white group-hover:text-meta-blue">Portfolio</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{viewingApplication.portfolio_url}</div>
                            </div>
                          </a>
                        )}
                        {viewingApplication.linkedin_url && (
                          <a href={viewingApplication.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-meta-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-white dark:group-hover:bg-gray-700">
                              <LinkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-meta-blue" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-meta-dark dark:text-white group-hover:text-meta-blue">LinkedIn</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{viewingApplication.linkedin_url}</div>
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Notes internes (Admin)</h3>
                    <textarea
                      rows={8}
                      placeholder="Ajouter des notes sur ce candidat..."
                      defaultValue={viewingApplication.notes || ''}
                      onBlur={async (e) => {
                        const newNotes = e.target.value;
                        if (newNotes !== viewingApplication.notes) {
                          try {
                            await supabase
                              .from('job_applications')
                              .update({ notes: newNotes })
                              .eq('id', viewingApplication.id);
                            setViewingApplication({...viewingApplication, notes: newNotes});
                            toast.success('Notes sauvegardées');
                          } catch (err) {
                            toast.error('Erreur lors de la sauvegarde des notes');
                          }
                        }
                      }}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 bg-gray-50 dark:bg-gray-900 dark:text-white resize-y"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                        <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Candidat</th>
                        <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Poste</th>
                        <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                        <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Date</th>
                        <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                            Aucune candidature trouvée
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map((app) => (
                          <tr key={app.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="p-4">
                              <div className="font-medium text-meta-dark dark:text-white">{app.first_name} {app.last_name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{app.email}</div>
                            </td>
                            <td className="p-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                              {app.job_offers?.title}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                {getStatusLabel(app.status)}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                              {new Date(app.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setViewingApplication(app)}
                                  className="inline-flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 hover:bg-meta-blue hover:text-white text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
                                  title="Voir les détails"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteApplication(app.id)}
                                  className="inline-flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 hover:bg-red-500 hover:text-white text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
