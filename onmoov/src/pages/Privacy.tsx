import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-meta-dark dark:text-white mb-8">{t('legal.privacy_title')}</h1>
          <div className="prose prose-blue dark:prose-invert max-w-none text-meta-gray dark:text-gray-400">
            <p className="mb-6">
              {t('legal.last_updated')} {new Date().toLocaleDateString()}
            </p>
            <h2 className="text-2xl font-semibold text-meta-dark dark:text-white mt-10 mb-4">{t('legal.privacy_content.intro_title')}</h2>
            <p className="mb-6">
              {t('legal.privacy_content.intro_text')}
            </p>
            
            <h2 className="text-2xl font-semibold text-meta-dark dark:text-white mt-10 mb-4">{t('legal.privacy_content.data_title')}</h2>
            <p className="mb-4">{t('legal.privacy_content.data_text')}</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>{t('legal.privacy_content.data_1')}</li>
              <li>{t('legal.privacy_content.data_2')}</li>
              <li>{t('legal.privacy_content.data_3')}</li>
            </ul>

            <h2 className="text-2xl font-semibold text-meta-dark dark:text-white mt-10 mb-4">{t('legal.privacy_content.usage_title')}</h2>
            <p className="mb-4">{t('legal.privacy_content.usage_text')}</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>{t('legal.privacy_content.usage_1')}</li>
              <li>{t('legal.privacy_content.usage_2')}</li>
              <li>{t('legal.privacy_content.usage_3')}</li>
              <li>{t('legal.privacy_content.usage_4')}</li>
            </ul>

            <h2 className="text-2xl font-semibold text-meta-dark dark:text-white mt-10 mb-4">{t('legal.privacy_content.sharing_title')}</h2>
            <p className="mb-6">
              {t('legal.privacy_content.sharing_text')}
            </p>

            <h2 className="text-2xl font-semibold text-meta-dark dark:text-white mt-10 mb-4">{t('legal.privacy_content.security_title')}</h2>
            <p className="mb-6">
              {t('legal.privacy_content.security_text')}
            </p>

            <h2 className="text-2xl font-semibold text-meta-dark dark:text-white mt-10 mb-4">{t('legal.privacy_content.rights_title')}</h2>
            <p className="mb-4">{t('legal.privacy_content.rights_text')}</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>{t('legal.privacy_content.rights_1')}</li>
              <li>{t('legal.privacy_content.rights_2')}</li>
              <li>{t('legal.privacy_content.rights_3')}</li>
              <li>{t('legal.privacy_content.rights_4')}</li>
              <li>{t('legal.privacy_content.rights_5')}</li>
            </ul>
            
            <p className="mt-10">
              {t('legal.privacy_content.contact_text')} <a href="mailto:onmoov.engineering@outlook.be" className="text-meta-blue dark:text-blue-400 hover:underline">onmoov.engineering@outlook.be</a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
