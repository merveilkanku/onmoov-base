import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { SiteSettings } from '../types';
import Layout from '../components/Layout';
import { useTranslation } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation();
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
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
              {t('contact.title')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-meta-gray dark:text-gray-400"
            >
              {t('contact.subtitle')}
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 mb-32">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-meta-dark dark:text-white mb-8">{t('contact.info_title')}</h2>
              <div className="space-y-8">
                <div className="flex items-start gap-6 group">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-8 h-8 text-meta-blue dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-meta-dark dark:text-white mb-2">{t('contact.hq')}</h3>
                    <p className="text-lg text-meta-gray dark:text-gray-400 whitespace-pre-line leading-relaxed">{siteSettings?.contact_address || "123 Avenue de l'Innovation\n75001 Paris, France"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-6 group">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform duration-300">
                    <Phone className="w-8 h-8 text-meta-blue dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-meta-dark dark:text-white mb-2">{t('contact.phone')}</h3>
                    <p className="text-lg text-meta-gray dark:text-gray-400">{siteSettings?.contact_phone || "+33 (0)1 23 45 67 89"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-6 group">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-8 h-8 text-meta-blue dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-meta-dark dark:text-white mb-2">{t('contact.email')}</h3>
                    <p className="text-lg text-meta-gray dark:text-gray-400">{siteSettings?.contact_email || "onmoov.engineering@outlook.be"}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-10 md:p-12 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-meta-blue/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
              <h2 className="text-3xl font-bold text-meta-dark dark:text-white mb-8">{t('contact.send_message')}</h2>
              <form className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-meta-dark dark:text-gray-300 mb-2">{t('contact.first_name')}</label>
                    <input type="text" id="firstName" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-base focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white" placeholder={t('contact.placeholder_first_name')} />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-meta-dark dark:text-gray-300 mb-2">{t('contact.last_name')}</label>
                    <input type="text" id="lastName" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-base focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white" placeholder={t('contact.placeholder_last_name')} />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-meta-dark dark:text-gray-300 mb-2">{t('contact.email')}</label>
                  <input type="email" id="email" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-base focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white" placeholder={t('contact.placeholder_email')} />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-meta-dark dark:text-gray-300 mb-2">{t('contact.subject')}</label>
                  <input type="text" id="subject" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-base focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white" placeholder={t('contact.placeholder_subject')} />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-meta-dark dark:text-gray-300 mb-2">{t('contact.message')}</label>
                  <textarea id="message" rows={5} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-base focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white resize-none" placeholder={t('contact.placeholder_message')}></textarea>
                </div>
                <button type="submit" className="w-full flex justify-center items-center gap-3 rounded-xl bg-meta-blue py-4 px-6 text-base font-bold text-white hover:bg-meta-blue-hover focus:outline-none transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 group">
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  {t('contact.send_btn')}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
