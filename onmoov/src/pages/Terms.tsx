import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';

export default function Terms() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-meta-dark dark:text-white mb-8">{t('legal.terms_title')}</h1>
          <div className="prose prose-blue dark:prose-invert max-w-none text-meta-gray dark:text-gray-400">
            <p className="mb-6">
              {t('legal.last_updated')} {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-2xl font-semibold text-meta-dark dark:text-white mt-10 mb-4">{t('legal.terms_content.intro_title')}</h2>
            <p className="mb-6">
              {t('legal.terms_content.intro_text')}
            </p>

            <h2 className="text-2xl font-semibold text-meta-dark dark:text-white mt-10 mb-4">{t('legal.terms_content.usage_title')}</h2>
            <p className="mb-6">
              {t('legal.terms_content.usage_text')}
            </p>

            <h2 className="text-2xl font-semibold text-meta-dark dark:text-white mt-10 mb-4">{t('legal.terms_content.ip_title')}</h2>
            <p className="mb-6">
              {t('legal.terms_content.ip_text')}
            </p>

            <h2 className="text-2xl font-semibold text-meta-dark dark:text-white mt-10 mb-4">{t('legal.terms_content.liability_title')}</h2>
            <p className="mb-6">
              {t('legal.terms_content.liability_text')}
            </p>

            <h2 className="text-2xl font-semibold text-meta-dark dark:text-white mt-10 mb-4">{t('legal.terms_content.links_title')}</h2>
            <p className="mb-6">
              {t('legal.terms_content.links_text')}
            </p>

            <h2 className="text-2xl font-semibold text-meta-dark dark:text-white mt-10 mb-4">{t('legal.terms_content.modifications_title')}</h2>
            <p className="mb-6">
              {t('legal.terms_content.modifications_text')}
            </p>

            <p className="mt-10">
              {t('legal.terms_content.contact_text')} <a href="mailto:onmoov.engineering@outlook.be" className="text-meta-blue dark:text-blue-400 hover:underline">onmoov.engineering@outlook.be</a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
