import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, ArrowLeft, Lock, Mail, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../lib/ThemeContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-meta-blue/5 dark:bg-blue-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-meta-blue/5 dark:bg-blue-900/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-between items-start mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-meta-gray dark:text-gray-400 hover:text-meta-blue dark:hover:text-blue-400 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Retour au site
          </Link>
          <button 
            onClick={toggleDarkMode}
            className="text-meta-gray dark:text-gray-400 hover:text-meta-dark dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center p-4">
            <img src="/logo.svg" alt="onmoov.engineering logo" className="w-full h-full object-contain dark:invert" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-meta-dark dark:text-white">
          Espace Collaborateur
        </h2>
        <p className="mt-2 text-center text-base text-meta-gray dark:text-gray-400">
          Accès réservé à l'équipe Onmoov Engineering
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 py-10 px-6 shadow-xl sm:rounded-3xl sm:px-12 border border-gray-100 dark:border-gray-700 relative">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-800 flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400 flex-shrink-0"></div>
                {error}
              </motion.div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-meta-dark dark:text-gray-300 mb-2">
                Email professionnel
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-600 pl-11 pr-4 py-3.5 text-base focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white"
                  placeholder="prenom.nom@onmoov.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-meta-dark dark:text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-600 pl-11 pr-4 py-3.5 text-base focus:border-meta-blue focus:outline-none focus:ring-2 focus:ring-meta-blue/20 transition-all bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-xl bg-meta-blue py-4 px-4 text-base font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-meta-blue-hover focus:outline-none transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
