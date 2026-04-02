import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  allowSignup?: boolean;
}

export default function AuthModal({ isOpen, onClose, onSuccess, allowSignup = true }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Force login mode if signup is not allowed
  React.useEffect(() => {
    if (!allowSignup) {
      setIsLogin(true);
    }
  }, [allowSignup, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Connexion réussie !');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        setIsLogin(true);
        return; // Don't call onSuccess yet if they just signed up and need to confirm or login
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8">
              <h2 className="text-2xl font-bold text-meta-dark mb-2">
                {isLogin ? 'Connexion' : 'Créer un compte'}
              </h2>
              <p className="text-meta-gray mb-6">
                {isLogin 
                  ? 'Connectez-vous pour accéder à vos formations.' 
                  : 'Créez un compte pour vous inscrire aux formations.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-meta-blue focus:border-meta-blue outline-none transition-all text-gray-900"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-meta-blue focus:border-meta-blue outline-none transition-all text-gray-900"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-6"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isLogin ? 'Se connecter' : 'S\'inscrire'}
                </button>
              </form>

              <div className="mt-6 text-center">
                {allowSignup && (
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-meta-blue hover:underline text-sm font-medium"
                  >
                    {isLogin 
                      ? 'Pas encore de compte ? S\'inscrire' 
                      : 'Déjà un compte ? Se connecter'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
