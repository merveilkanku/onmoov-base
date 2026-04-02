import { motion } from 'motion/react';
import { Rocket, Sparkles, Target, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';

export default function Innovation() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="py-20 bg-meta-light dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-meta-dark dark:text-white mb-6"
            >
              {t('innovation.title')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-meta-gray dark:text-gray-400"
            >
              {t('innovation.subtitle')}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 mb-32">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="bg-white dark:bg-gray-800 p-10 lg:p-12 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-500 group"
            >
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-blue-100 dark:border-blue-800">
                <Rocket className="w-10 h-10 text-meta-blue dark:text-blue-400" />
              </div>
              <h3 className="text-3xl font-bold text-meta-dark dark:text-white mb-6">{t('innovation.rd_title')}</h3>
              <p className="text-lg text-meta-gray dark:text-gray-400 leading-relaxed">
                {t('innovation.rd_desc')}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-10 lg:p-12 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-500 group"
            >
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-blue-100 dark:border-blue-800">
                <Sparkles className="w-10 h-10 text-meta-blue dark:text-blue-400" />
              </div>
              <h3 className="text-3xl font-bold text-meta-dark dark:text-white mb-6">{t('innovation.tech_title')}</h3>
              <p className="text-lg text-meta-gray dark:text-gray-400 leading-relaxed">
                {t('innovation.tech_desc')}
              </p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-meta-dark dark:bg-gray-800 text-white rounded-[3rem] p-12 md:p-24 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-meta-blue rounded-full blur-[120px] opacity-30 pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-[120px] opacity-20 pointer-events-none transform -translate-x-1/3 translate-y-1/3"></div>
            
            <div className="relative z-10 max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('innovation.future_title')}</h2>
                <p className="text-xl text-gray-300 dark:text-gray-400 max-w-2xl mx-auto">
                  {t('innovation.future_desc')}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-12">
                <div className="flex items-start gap-6 bg-white/5 dark:bg-gray-700/50 p-8 rounded-3xl backdrop-blur-sm border border-white/10 dark:border-gray-600 hover:bg-white/10 dark:hover:bg-gray-700 transition-colors">
                  <div className="bg-meta-blue/20 dark:bg-blue-900/40 p-4 rounded-2xl flex-shrink-0">
                    <Target className="w-8 h-8 text-blue-300 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-2xl mb-3">{t('innovation.goals_title')}</h4>
                    <p className="text-gray-300 dark:text-gray-400 leading-relaxed">{t('innovation.goals_desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-6 bg-white/5 dark:bg-gray-700/50 p-8 rounded-3xl backdrop-blur-sm border border-white/10 dark:border-gray-600 hover:bg-white/10 dark:hover:bg-gray-700 transition-colors">
                  <div className="bg-meta-blue/20 dark:bg-blue-900/40 p-4 rounded-2xl flex-shrink-0">
                    <Globe className="w-8 h-8 text-blue-300 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-2xl mb-3">{t('innovation.impact_title')}</h4>
                    <p className="text-gray-300 dark:text-gray-400 leading-relaxed">{t('innovation.impact_desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </Layout>
  );
}
