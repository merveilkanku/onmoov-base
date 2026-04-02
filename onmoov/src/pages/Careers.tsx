import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, Search, Filter, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { JobOffer } from '../types';

import Layout from '../components/Layout';

export default function Careers() {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const { data, error } = await supabase
        .from('job_offers')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  const departments = ['All', ...Array.from(new Set(jobs.map(job => job.department)))];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All' || job.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-12 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <Link to="/" className="inline-flex items-center gap-2 text-meta-blue dark:text-blue-400 hover:underline mb-8 transition-colors font-bold text-lg">
            <ArrowLeft className="w-5 h-5" /> Retour à l'accueil
          </Link>

          {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-meta-dark dark:text-white mb-6"
          >
            Rejoignez notre équipe
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-300"
          >
            Découvrez nos offres d'emploi et participez à notre mission de transformer l'éducation technologique en Afrique.
          </motion.p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-10 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un poste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-meta-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-meta-blue/20"
            />
          </div>
          <div className="relative md:w-64">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-meta-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-meta-blue/20 appearance-none"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept === 'All' ? 'Tous les départements' : dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Job List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meta-blue"></div>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid gap-6">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-meta-blue dark:text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">
                        {job.department}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Publié le {new Date(job.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-meta-dark dark:text-white mb-4 group-hover:text-meta-blue transition-colors">
                      {job.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        {job.contract_type}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        Temps plein
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Link
                      to={`/carrieres/${job.id}`}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-meta-blue hover:bg-blue-700 text-white rounded-xl font-medium transition-colors w-full md:w-auto"
                    >
                      Voir l'offre <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-meta-dark dark:text-white mb-2">Aucune offre trouvée</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Nous n'avons pas d'offres correspondant à vos critères pour le moment.
            </p>
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
}
