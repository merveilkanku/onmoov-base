import { motion } from 'motion/react';
import { Cpu, Shield, Zap, ChevronRight, Download, Loader2, Search } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Application, SiteSettings } from '../types';
import Layout from '../components/Layout';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function Home() {
  const { t, i18n } = useTranslation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchApplications();
    fetchSiteSettings();
  }, []);

  async function fetchSiteSettings() {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (!error && data) {
        setSiteSettings(data);
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  }

  async function fetchApplications() {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .neq('status', 'draft')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredApplications = applications.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = async (e: React.MouseEvent, app: Application) => {
    e.preventDefault();
    
    // 1. Optimistically update the local state immediately
    setApplications(apps => apps.map(a => 
      a.id === app.id ? { ...a, downloads_count: (a.downloads_count || 0) + 1 } : a
    ));
    
    // 2. Déclencher le téléchargement
    try {
      let url = app.download_url;
      try {
        const urlObj = new URL(url);
        urlObj.searchParams.set('download', '');
        url = urlObj.toString();
      } catch (e) {
        // Ignorer si l'URL est invalide
      }
      
      // Utiliser un lien invisible pour forcer le téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', '');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erreur lors du déclenchement du téléchargement:', err);
    }
    
    // 3. Incrémenter le compteur en arrière-plan dans la base de données
    try {
      const { error } = await supabase.rpc('increment_download_count', { app_id: app.id });
      
      if (error) {
        console.error('RPC failed, falling back to standard update:', error);
        // Fallback if RPC is not available (e.g., if the user hasn't run the SQL script yet)
        const { error: fallbackError } = await supabase
          .from('applications')
          .update({ downloads_count: (app.downloads_count || 0) + 1 })
          .eq('id', app.id);
          
        if (fallbackError) {
          console.error('Fallback update failed:', fallbackError);
          // We don't throw here because the download itself succeeded
          // and we don't want to show a confusing error message to the user.
        }
      }
    } catch (error) {
      console.error('Error updating download count:', error);
      // No toast.error here because the download succeeded
    }
  };

  // Déterminer si on utilise le texte personnalisé ou la traduction
  const isDefaultFrTitle = siteSettings?.hero_title === "Construisons le futur ensemble.";
  const displayTitle = siteSettings?.hero_title && !isDefaultFrTitle && i18n.language.startsWith('fr') 
    ? siteSettings.hero_title 
    : t('home.hero_title');

  const isDefaultFrSubtitle = siteSettings?.hero_subtitle === "Découvrez nos équipements d'ingénierie de pointe et nos solutions logicielles conçues pour repousser les limites de la technologie.";
  const displaySubtitle = siteSettings?.hero_subtitle && !isDefaultFrSubtitle && i18n.language.startsWith('fr') 
    ? siteSettings.hero_subtitle 
    : t('home.hero_subtitle');

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-7xl font-bold tracking-tight text-meta-dark dark:text-white mb-6"
            >
              <span dangerouslySetInnerHTML={{ __html: displayTitle.replace('ensemble.', '<br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-meta-blue to-blue-400">ensemble.</span>').replace('together.', '<br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-meta-blue to-blue-400">together.</span>').replace('juntos.', '<br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-meta-blue to-blue-400">juntos.</span>').replace('ましょう。', '<br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-meta-blue to-blue-400">ましょう。</span>') }} />
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg md:text-xl text-meta-gray dark:text-gray-400 mb-10"
            >
              {displaySubtitle}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a href="#applications" className="w-full sm:w-auto px-8 py-3 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-full font-medium transition-colors flex items-center justify-center gap-2">
                {t('home.explore_apps')}
                <Download className="w-4 h-4" />
              </a>
              <Link to="/contact" className="w-full sm:w-auto px-8 py-3 bg-meta-light dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-meta-dark dark:text-white rounded-full font-medium transition-colors flex items-center justify-center">
                {t('home.contact_experts')}
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl -z-10 opacity-50 pointer-events-none"></div>
      </section>

      {/* Partners Section */}
      <section className="py-12 border-t border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-meta-gray dark:text-gray-500 uppercase tracking-wider mb-8">
            {t('home.trusted_by')}
          </p>
          <div className="flex justify-center items-center gap-12 md:gap-24 opacity-50 dark:opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholder logos for partners */}
            <div className="text-2xl font-bold font-mono text-meta-dark dark:text-white">TECHCORP</div>
            <div className="text-2xl font-bold font-serif italic text-meta-dark dark:text-white">Innovate.io</div>
            <div className="text-2xl font-bold tracking-tighter text-meta-dark dark:text-white">GLOBAL<span className="text-meta-blue">SYS</span></div>
            <div className="text-2xl font-bold font-sans text-meta-dark dark:text-white">NEXUS</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="solutions-preview" className="py-24 bg-meta-light dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-meta-dark dark:text-white mb-4">{t('home.features_title')}</h2>
            <p className="text-meta-gray dark:text-gray-400 max-w-2xl mx-auto">{t('home.features_subtitle')}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Cpu, title: t('home.feature_1_title'), desc: t('home.feature_1_desc') },
              { icon: Shield, title: t('home.feature_2_title'), desc: t('home.feature_2_desc') },
              { icon: Zap, title: t('home.feature_3_title'), desc: t('home.feature_3_desc') }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-meta-blue dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-meta-dark dark:text-white mb-3">{feature.title}</h3>
                <p className="text-meta-gray dark:text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="applications" className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-meta-dark dark:text-white mb-2">{t('home.latest_apps')}</h2>
              <p className="text-meta-gray dark:text-gray-400">{t('home.latest_apps_subtitle')}</p>
            </div>
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('home.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-meta-blue focus:border-meta-blue sm:text-sm transition-colors dark:text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-meta-blue" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-meta-gray dark:text-gray-400">{t('home.no_apps')}</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-meta-gray dark:text-gray-400">{t('home.no_apps_match')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredApplications.map((product, idx) => (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative overflow-hidden bg-meta-light dark:bg-gray-700 aspect-[4/3]">
                    <img 
                      src={product.image_url || "https://picsum.photos/seed/software/600/400"} 
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="flex flex-col flex-grow p-6">
                    <div className="flex justify-between items-center w-full mb-3">
                      <span className="px-3 py-1 text-xs font-bold text-meta-blue dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full uppercase tracking-wider">{product.tag}</span>
                      <span className="text-xs font-medium text-meta-gray dark:text-gray-400 flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md">
                        <Download className="w-3.5 h-3.5" />
                        {product.downloads_count || 0}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-meta-dark dark:text-white mb-2 group-hover:text-meta-blue dark:group-hover:text-blue-400 transition-colors">{product.name}</h3>
                    <div className="text-sm text-meta-gray dark:text-gray-400 mb-6 line-clamp-2" dangerouslySetInnerHTML={{ __html: product.description }} />
                    
                    <a 
                      href={product.download_url}
                      onClick={(e) => handleDownload(e, product)}
                      className="mt-auto w-full py-3 bg-meta-light dark:bg-gray-700 hover:bg-meta-blue dark:hover:bg-meta-blue hover:text-white text-meta-dark dark:text-white rounded-xl font-semibold transition-all duration-300 text-sm flex items-center justify-center gap-2 group/btn"
                    >
                      <Download className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                      {t('home.download')}
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      {/* Testimonials Section */}
      <section className="py-24 bg-meta-light dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-meta-dark dark:text-white mb-4">{t('home.testimonials_title')}</h2>
            <p className="text-meta-gray dark:text-gray-400 max-w-2xl mx-auto">{t('home.testimonials_desc')}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 relative shadow-sm"
            >
              <div className="text-4xl text-meta-blue dark:text-blue-400 opacity-20 absolute top-6 left-6">"</div>
              <p className="text-meta-dark dark:text-gray-200 text-lg italic mb-6 relative z-10 pt-4">
                "{t('home.testimonial_1')}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100" alt="Client" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-semibold text-meta-dark dark:text-white">{t('home.testimonial_1_author')}</h4>
                  <p className="text-sm text-meta-gray dark:text-gray-400">{t('home.testimonial_1_role')}</p>
                </div>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 relative shadow-sm"
            >
              <div className="text-4xl text-meta-blue dark:text-blue-400 opacity-20 absolute top-6 left-6">"</div>
              <p className="text-meta-dark dark:text-gray-200 text-lg italic mb-6 relative z-10 pt-4">
                "{t('home.testimonial_2')}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" alt="Client" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-semibold text-meta-dark dark:text-white">{t('home.testimonial_2_author')}</h4>
                  <p className="text-sm text-meta-gray dark:text-gray-400">{t('home.testimonial_2_role')}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-meta-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-meta-blue rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('home.cta_title')}</h2>
          <p className="text-xl text-gray-300 mb-10">
            {t('home.cta_desc')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/contact" className="px-8 py-4 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-full font-medium transition-colors text-lg">
              {t('home.contact_experts')}
            </Link>
            <Link to="/solutions" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors text-lg backdrop-blur-sm">
              {t('home.discover_solutions')}
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
