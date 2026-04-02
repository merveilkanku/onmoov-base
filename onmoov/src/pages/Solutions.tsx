import { motion } from 'motion/react';
import { Cpu, Shield, Zap, Server, Code, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';

export default function Solutions() {
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
              {t('solutions.title')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-meta-gray dark:text-gray-400"
            >
              {t('solutions.subtitle')}
            </motion.p>
          </div>

          {/* Hardware Section */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            id="hardware" 
            className="mb-32 scroll-mt-24"
          >
            <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-center">
              <div className="flex-1">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-blue-100 dark:border-blue-800">
                  <Cpu className="w-8 h-8 text-meta-blue dark:text-blue-400" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-meta-dark dark:text-white mb-6">{t('solutions.hw_title')}</h2>
                <p className="text-lg text-meta-gray dark:text-gray-400 mb-8 leading-relaxed">
                  {t('solutions.hw_desc')}
                </p>
                <ul className="space-y-4 text-meta-gray dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 bg-meta-light dark:bg-gray-800 p-1 rounded-full"><Zap className="w-4 h-4 text-meta-blue dark:text-blue-400" /></div>
                    <span className="text-lg">{t('solutions.hw_1')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 bg-meta-light dark:bg-gray-800 p-1 rounded-full"><Zap className="w-4 h-4 text-meta-blue dark:text-blue-400" /></div>
                    <span className="text-lg">{t('solutions.hw_2')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 bg-meta-light dark:bg-gray-800 p-1 rounded-full"><Zap className="w-4 h-4 text-meta-blue dark:text-blue-400" /></div>
                    <span className="text-lg">{t('solutions.hw_3')}</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-meta-blue/20 to-transparent rounded-3xl transform translate-x-4 translate-y-4 -z-10"></div>
                <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800" alt="Hardware Engineering" className="rounded-3xl shadow-xl w-full object-cover aspect-[4/3]" />
              </div>
            </div>
          </motion.section>

          {/* Software Section */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            id="software" 
            className="mb-32 scroll-mt-24"
          >
            <div className="flex flex-col md:flex-row-reverse gap-12 lg:gap-20 items-center">
              <div className="flex-1">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-blue-100 dark:border-blue-800">
                  <Code className="w-8 h-8 text-meta-blue dark:text-blue-400" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-meta-dark dark:text-white mb-6">{t('solutions.sw_title')}</h2>
                <p className="text-lg text-meta-gray dark:text-gray-400 mb-8 leading-relaxed">
                  {t('solutions.sw_desc')}
                </p>
                <ul className="space-y-4 text-meta-gray dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 bg-meta-light dark:bg-gray-800 p-1 rounded-full"><Zap className="w-4 h-4 text-meta-blue dark:text-blue-400" /></div>
                    <span className="text-lg">{t('solutions.sw_1')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 bg-meta-light dark:bg-gray-800 p-1 rounded-full"><Zap className="w-4 h-4 text-meta-blue dark:text-blue-400" /></div>
                    <span className="text-lg">{t('solutions.sw_2')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 bg-meta-light dark:bg-gray-800 p-1 rounded-full"><Zap className="w-4 h-4 text-meta-blue dark:text-blue-400" /></div>
                    <span className="text-lg">{t('solutions.sw_3')}</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-tl from-meta-blue/20 to-transparent rounded-3xl transform -translate-x-4 translate-y-4 -z-10"></div>
                <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800" alt="Software Development" className="rounded-3xl shadow-xl w-full object-cover aspect-[4/3]" />
              </div>
            </div>
          </motion.section>

          {/* Consulting Section */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            id="consulting" 
            className="scroll-mt-24"
          >
            <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-center">
              <div className="flex-1">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-blue-100 dark:border-blue-800">
                  <Lightbulb className="w-8 h-8 text-meta-blue dark:text-blue-400" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-meta-dark dark:text-white mb-6">{t('solutions.consulting_title')}</h2>
                <p className="text-lg text-meta-gray dark:text-gray-400 mb-8 leading-relaxed">
                  {t('solutions.consulting_desc')}
                </p>
                <ul className="space-y-4 text-meta-gray dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 bg-meta-light dark:bg-gray-800 p-1 rounded-full"><Zap className="w-4 h-4 text-meta-blue dark:text-blue-400" /></div>
                    <span className="text-lg">{t('solutions.consulting_1')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 bg-meta-light dark:bg-gray-800 p-1 rounded-full"><Zap className="w-4 h-4 text-meta-blue dark:text-blue-400" /></div>
                    <span className="text-lg">{t('solutions.consulting_2')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 bg-meta-light dark:bg-gray-800 p-1 rounded-full"><Zap className="w-4 h-4 text-meta-blue dark:text-blue-400" /></div>
                    <span className="text-lg">{t('solutions.consulting_3')}</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-meta-blue/20 to-transparent rounded-3xl transform translate-x-4 translate-y-4 -z-10"></div>
                <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=800" alt="Consulting" className="rounded-3xl shadow-xl w-full object-cover aspect-[4/3]" />
              </div>
            </div>
          </motion.section>

        </div>
      </div>
    </Layout>
  );
}
