import { motion } from 'motion/react';
import { Users, Building2, MapPin, Award } from 'lucide-react';
import Layout from '../components/Layout';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-meta-dark dark:text-white mb-6"
            >
              {t('about.title')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-meta-gray dark:text-gray-400"
            >
              {t('about.subtitle')}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 lg:gap-24 mb-32 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-meta-dark dark:text-white mb-6">{t('about.history_title')}</h2>
              <div className="w-20 h-1.5 bg-meta-blue rounded-full mb-8"></div>
              <p className="text-lg text-meta-gray dark:text-gray-400 mb-6 leading-relaxed">
                {t('about.history_p1')}
              </p>
              <p className="text-lg text-meta-gray dark:text-gray-400 leading-relaxed">
                {t('about.history_p2')}
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 gap-6"
            >
              <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 text-center hover:shadow-xl transition-all duration-300 group">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-meta-blue dark:text-blue-400" />
                </div>
                <h3 className="text-4xl font-bold text-meta-dark dark:text-white mb-2">50+</h3>
                <p className="text-meta-gray dark:text-gray-400 font-medium">{t('about.stat_experts')}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 text-center hover:shadow-xl transition-all duration-300 group translate-y-8">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-8 h-8 text-meta-blue dark:text-blue-400" />
                </div>
                <h3 className="text-4xl font-bold text-meta-dark dark:text-white mb-2">100+</h3>
                <p className="text-meta-gray dark:text-gray-400 font-medium">{t('about.stat_projects')}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 text-center hover:shadow-xl transition-all duration-300 group">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-8 h-8 text-meta-blue dark:text-blue-400" />
                </div>
                <h3 className="text-4xl font-bold text-meta-dark dark:text-white mb-2">3</h3>
                <p className="text-meta-gray dark:text-gray-400 font-medium">{t('about.stat_offices')}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 text-center hover:shadow-xl transition-all duration-300 group translate-y-8">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-8 h-8 text-meta-blue dark:text-blue-400" />
                </div>
                <h3 className="text-4xl font-bold text-meta-dark dark:text-white mb-2">15</h3>
                <p className="text-meta-gray dark:text-gray-400 font-medium">{t('about.stat_awards')}</p>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-meta-dark text-white rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-meta-blue rounded-full blur-[120px] opacity-30 pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-[120px] opacity-20 pointer-events-none transform -translate-x-1/3 translate-y-1/3"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-8">{t('about.join_title')}</h2>
              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                {t('about.join_desc')}
              </p>
              <button className="px-10 py-4 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-full font-semibold transition-colors text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transform duration-300">
                {t('about.join_btn')}
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </Layout>
  );
}
