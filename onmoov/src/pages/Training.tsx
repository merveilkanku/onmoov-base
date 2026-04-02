import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Code, Cpu, Shield, BrainCircuit, GraduationCap, Clock, Users, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import type { Course, SiteSettings } from '../types';
import Layout from '../components/Layout';

const iconMap: Record<string, any> = {
  Code,
  Cpu,
  BrainCircuit,
  Shield,
  GraduationCap,
  BookOpen
};

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

export default function Training() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    await Promise.all([
      fetchCourses(),
      fetchSiteSettings()
    ]);
    setLoading(false);
  }

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

  async function fetchCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .neq('status', 'draft')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-32 overflow-hidden bg-meta-light dark:bg-gray-900">
        <div className="absolute top-0 right-0 w-64 h-64 bg-meta-blue rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-meta-blue dark:text-blue-400 text-sm font-medium mb-6"
            >
              <GraduationCap className="w-4 h-4" />
              onmoov.academy
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold tracking-tight text-meta-dark dark:text-white mb-6"
              dangerouslySetInnerHTML={{ __html: t('training.title').replace('&', '<span class="text-transparent bg-clip-text bg-gradient-to-r from-meta-blue to-blue-400">&</span>') }}
            />
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-meta-gray dark:text-gray-400 mb-10"
            >
              {t('training.subtitle')}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-24 bg-white dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-meta-dark dark:text-white mb-4">{t('training.programs_title')}</h2>
            <p className="text-lg text-meta-gray dark:text-gray-400 max-w-2xl mx-auto">{t('training.programs_subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-meta-blue" />
              </div>
            ) : courses.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-lg text-meta-gray dark:text-gray-400">{t('training.no_courses')}</p>
              </div>
            ) : (
              courses.map((course, idx) => {
                const IconComponent = iconMap[course.icon_name] || BookOpen;
                return (
                  <motion.div 
                    key={course.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="group flex flex-col bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500"
                  >
                    <div className="relative h-56 overflow-hidden bg-meta-light dark:bg-gray-700">
                      <img 
                        src={course.image_url} 
                        alt={course.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute top-4 left-4 px-4 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full text-xs font-bold text-meta-blue dark:text-blue-400 uppercase tracking-wider shadow-sm">
                        {course.category}
                      </div>
                    </div>
                    
                    <div className="p-8 flex-grow flex flex-col">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-meta-blue dark:text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-meta-dark dark:text-white group-hover:text-meta-blue dark:group-hover:text-blue-400 transition-colors line-clamp-2">{course.title}</h3>
                      </div>
                      
                      <div 
                        className="text-meta-gray dark:text-gray-400 mb-8 flex-grow line-clamp-3 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: course.description }}
                      />
                      
                      <div className="flex flex-wrap items-center gap-y-3 gap-x-6 pt-6 border-t border-gray-100 dark:border-gray-700 mb-8">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                          <Clock className="w-4 h-4 text-meta-blue dark:text-blue-400" />
                          <span className="font-medium">{t('training.duration')}:</span> {course.duration}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                          <Users className="w-4 h-4 text-meta-blue dark:text-blue-400" />
                          <span className="font-medium">{t('training.level')}:</span> {course.level}
                        </div>
                        {course.is_paid && (
                          <div className="flex items-center gap-2 text-sm font-bold text-meta-blue dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg ml-auto">
                            {course.price} {getCurrencySymbol(course.currency || siteSettings?.currency)}
                          </div>
                        )}
                      </div>
                      
                      <Link 
                        to={`/formations/${course.id}`} 
                        className="mt-auto inline-flex items-center justify-center gap-2 w-full py-3.5 bg-meta-light dark:bg-gray-700 hover:bg-meta-blue dark:hover:bg-meta-blue hover:text-white text-meta-dark dark:text-white rounded-xl font-semibold transition-all duration-300 group/btn"
                      >
                        {t('training.view_details')} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-24 bg-meta-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-meta-blue rounded-full blur-[120px] opacity-20 pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-[120px] opacity-10 pointer-events-none transform -translate-x-1/3 translate-y-1/3"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">{t('training.why_title')}</h2>
              <p className="text-gray-300 mb-10 text-lg leading-relaxed">
                {t('training.why_subtitle')}
              </p>
              <ul className="space-y-8">
                {[
                  { title: t('training.why_1_title'), desc: t('training.why_1_desc') },
                  { title: t('training.why_2_title'), desc: t('training.why_2_desc') },
                  { title: t('training.why_3_title'), desc: t('training.why_3_desc') }
                ].map((item, idx) => (
                  <motion.li 
                    key={idx} 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className="flex gap-5 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-meta-blue/20 transition-colors duration-300">
                      <div className="w-3 h-3 rounded-full bg-meta-blue group-hover:scale-150 transition-transform duration-300"></div>
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-2 text-white group-hover:text-blue-300 transition-colors">{item.title}</h4>
                      <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative lg:ml-auto w-full max-w-lg"
            >
              <div className="aspect-square rounded-full bg-gradient-to-tr from-meta-blue/30 to-transparent absolute -inset-8 blur-3xl opacity-50"></div>
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800" 
                alt="Étudiants travaillant sur un projet" 
                className="rounded-[2.5rem] relative z-10 border border-white/10 shadow-2xl object-cover aspect-[4/5] w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>
      {/* Become a Trainer Section */}
      <section className="py-24 bg-white dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-meta-blue to-blue-600 rounded-[3rem] p-8 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/30"
              >
                <GraduationCap className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Devenez Formateur sur onmoov.academy</h2>
              <p className="text-blue-50 text-lg mb-10 leading-relaxed">
                Vous êtes un expert dans votre domaine ? Partagez vos connaissances, inspirez les autres et gagnez en visibilité en rejoignant notre équipe de formateurs passionnés.
              </p>
              <Link 
                to="/devenir-formateur" 
                className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-white text-meta-blue rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 group"
              >
                Postuler maintenant <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
