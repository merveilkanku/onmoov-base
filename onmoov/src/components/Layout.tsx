import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ChevronRight, Globe, User, LogOut, Award, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/ThemeContext';
import { supabase } from '../lib/supabase';
import AuthModal from './AuthModal';

export default function Layout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [siteSettings, setSiteSettings] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchSiteSettings();

    return () => subscription.unsubscribe();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 selection:bg-meta-blue/20 flex transition-colors duration-200">
      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 bottom-0 w-64 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-colors duration-200 hidden md:flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-10">
            <img src="/logo.svg" alt="onmoov.engineering logo" className="h-8 w-auto object-contain rounded-lg" />
            <span className="font-bold text-xl tracking-tight text-meta-dark dark:text-white">
              onmoov<span className="text-meta-blue">.engineering</span>
            </span>
          </Link>

          <div className="flex flex-col space-y-2">
            <Link to="/solutions" className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive('/solutions') ? 'bg-meta-blue text-white' : 'text-meta-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-meta-dark dark:hover:text-white'}`}>{t('nav.solutions')}</Link>
            <Link to="/innovation" className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive('/innovation') ? 'bg-meta-blue text-white' : 'text-meta-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-meta-dark dark:hover:text-white'}`}>{t('nav.innovation')}</Link>
            <Link to="/formations" className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive('/formations') ? 'bg-meta-blue text-white' : 'text-meta-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-meta-dark dark:hover:text-white'}`}>{t('nav.training')}</Link>
            <Link to="/carrieres" className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive('/carrieres') ? 'bg-meta-blue text-white' : 'text-meta-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-meta-dark dark:hover:text-white'}`}>Carrières</Link>
            <Link to="/forum" className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive('/forum') ? 'bg-meta-blue text-white' : 'text-meta-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-meta-dark dark:hover:text-white'}`}>Forum</Link>
            <Link to="/about" className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive('/about') ? 'bg-meta-blue text-white' : 'text-meta-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-meta-dark dark:hover:text-white'}`}>{t('nav.about')}</Link>
            <Link to="/contact" className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive('/contact') ? 'bg-meta-blue text-white' : 'text-meta-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-meta-dark dark:hover:text-white'}`}>{t('nav.contact')}</Link>
            <Link to="/#applications" className="mt-4 px-4 py-2 bg-meta-blue text-white text-sm font-medium rounded-xl hover:bg-meta-blue-hover transition-colors text-center">
              {t('nav.apps')}
            </Link>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={toggleDarkMode}
              className="text-meta-gray dark:text-gray-400 hover:text-meta-dark dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="relative group">
              <button className="flex items-center gap-1 text-meta-gray dark:text-gray-400 hover:text-meta-dark dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium uppercase">{i18n.language.split('-')[0]}</span>
              </button>
              <div className="absolute bottom-full left-0 mb-2 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100 dark:border-gray-700">
                <button onClick={() => changeLanguage('fr')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Français</button>
                <button onClick={() => changeLanguage('en')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">English</button>
                <button onClick={() => changeLanguage('pt')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Português</button>
                <button onClick={() => changeLanguage('es')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Español</button>
                <button onClick={() => changeLanguage('ja')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">日本語</button>
              </div>
            </div>
          </div>

          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="w-10 h-10 bg-meta-blue/10 dark:bg-meta-blue/20 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-meta-blue dark:text-blue-400" />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
                </div>
              </button>
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100 dark:border-gray-700">
                <Link to="/accomplissements" className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Award className="w-4 h-4" /> Accomplissements
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 text-meta-dark dark:text-white text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Connexion
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 md:hidden h-16 px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="onmoov.engineering logo" className="h-8 w-auto object-contain rounded-lg" />
          <span className="font-bold text-lg tracking-tight text-meta-dark dark:text-white">
            onmoov<span className="text-meta-blue">.engineering</span>
          </span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-meta-dark dark:text-white p-2">
          <Menu className="w-6 h-6" />
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 p-6 flex flex-col">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 mb-10">
              <img src="/logo.svg" alt="onmoov.engineering logo" className="h-8 w-auto object-contain rounded-lg" />
              <span className="font-bold text-lg tracking-tight text-meta-dark dark:text-white">
                onmoov<span className="text-meta-blue">.engineering</span>
              </span>
            </Link>
            
            <div className="flex flex-col space-y-2 flex-grow">
              <Link to="/solutions" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-meta-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">{t('nav.solutions')}</Link>
              <Link to="/innovation" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-meta-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">{t('nav.innovation')}</Link>
              <Link to="/formations" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-meta-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">{t('nav.training')}</Link>
              <Link to="/carrieres" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-meta-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Carrières</Link>
              <Link to="/forum" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-meta-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Forum</Link>
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-meta-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">{t('nav.about')}</Link>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-meta-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">{t('nav.contact')}</Link>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={toggleDarkMode} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button className="flex items-center gap-1 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase">{i18n.language.split('-')[0]}</span>
                </button>
              </div>
              {user ? (
                <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50">
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              ) : (
                <button onClick={() => { setIsMobileMenuOpen(false); setIsAuthModalOpen(true); }} className="w-full py-2 px-4 bg-meta-blue text-white text-sm font-medium rounded-xl">
                  Connexion
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col md:pl-64 min-w-0">
        <main className="flex-grow pt-16 md:pt-0">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-900 text-meta-dark dark:text-white py-12 border-t border-gray-100 dark:border-gray-800 mt-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-6">
                <img src="/logo.svg" alt="onmoov.engineering logo" className="h-6 w-auto object-contain rounded-md" />
                <span className="font-bold text-lg tracking-tight text-meta-dark dark:text-white">
                  onmoov<span className="text-meta-blue">.engineering</span>
                </span>
              </Link>
              <p className="text-meta-gray dark:text-gray-400 text-sm mb-6">
                {t('footer.description')}
              </p>
              <Link to="/login" className="inline-flex items-center gap-1 text-meta-blue font-medium hover:underline text-sm">
                {t('nav.admin')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-meta-dark dark:text-gray-100">{t('footer.company')}</h4>
              <ul className="space-y-2 text-sm text-meta-gray dark:text-gray-400">
                <li><Link to="/about" className="hover:text-meta-dark dark:hover:text-white transition-colors">{t('nav.about')}</Link></li>
                <li><Link to="/innovation" className="hover:text-meta-dark dark:hover:text-white transition-colors">{t('nav.innovation')}</Link></li>
                <li><Link to="/formations" className="hover:text-meta-dark dark:hover:text-white transition-colors">{t('nav.training')}</Link></li>
                <li><Link to="/carrieres" className="hover:text-meta-dark dark:hover:text-white transition-colors">Carrières</Link></li>
                <li><Link to="/forum" className="hover:text-meta-dark dark:hover:text-white transition-colors">Forum</Link></li>
                <li><Link to="/contact" className="hover:text-meta-dark dark:hover:text-white transition-colors">{t('nav.contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-meta-dark dark:text-gray-100">{t('footer.solutions')}</h4>
              <ul className="space-y-2 text-sm text-meta-gray dark:text-gray-400">
                <li><Link to="/solutions#hardware" className="hover:text-meta-dark dark:hover:text-white transition-colors">{t('solutions.hw_title')}</Link></li>
                <li><Link to="/solutions#software" className="hover:text-meta-dark dark:hover:text-white transition-colors">{t('solutions.sw_title')}</Link></li>
                <li><Link to="/solutions#consulting" className="hover:text-meta-dark dark:hover:text-white transition-colors">{t('solutions.consulting_title')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-meta-dark dark:text-gray-100">{t('footer.legal')}</h4>
              <ul className="space-y-2 text-sm text-meta-gray dark:text-gray-400">
                <li><Link to="/privacy" className="hover:text-meta-dark dark:hover:text-white transition-colors">{t('footer.privacy')}</Link></li>
                <li><Link to="/terms" className="hover:text-meta-dark dark:hover:text-white transition-colors">{t('footer.terms')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-meta-dark dark:text-gray-100">Contact</h4>
              <ul className="space-y-2 text-sm text-meta-gray dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="font-medium text-meta-dark dark:text-gray-200">Email:</span>
                  <a href={`mailto:${siteSettings?.contact_email || 'onmoov.engineering@outlook.be'}`} className="hover:text-meta-blue transition-colors truncate">
                    {siteSettings?.contact_email || 'onmoov.engineering@outlook.be'}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium text-meta-dark dark:text-gray-200">Tél:</span>
                  <a href={`tel:${siteSettings?.contact_phone || '+33123456789'}`} className="hover:text-meta-blue transition-colors">
                    {siteSettings?.contact_phone || '+33 (0)1 23 45 67 89'}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium text-meta-dark dark:text-gray-200 shrink-0">Adresse:</span>
                  <span className="whitespace-pre-line">{siteSettings?.contact_address || "123 Avenue de l'Innovation\n75001 Paris, France"}</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-meta-gray dark:text-gray-500">
            &copy; {new Date().getFullYear()} onmoov.engineering. {t('footer.rights')}
          </div>
        </div>
      </footer>

      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => setIsAuthModalOpen(false)} 
        allowSignup={false}
      />
    </div>
  );
}
