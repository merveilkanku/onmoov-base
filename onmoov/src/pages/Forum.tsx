import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Search, User, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Forum() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'Général' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Général', 'Entraide', 'Projets', 'Ressources'];

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:user_id(full_name, email),
          forum_comments(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Erreur lors du chargement des discussions');
    } finally {
      setLoading(false);
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast.error('Veuillez vous connecter pour publier');
        return;
      }

      const { error } = await supabase
        .from('forum_posts')
        .insert({
          user_id: session.session.user.id,
          title: newPost.title.trim(),
          content: newPost.content.trim(),
          category: newPost.category
        });

      if (error) throw error;
      
      toast.success('Discussion créée avec succès');
      setIsNewPostOpen(false);
      setNewPost({ title: '', content: '', category: 'Général' });
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Erreur lors de la création de la discussion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="pt-12 sm:pt-24 pb-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold text-meta-dark dark:text-white flex items-center gap-3">
                <MessageSquare className="w-10 h-10 text-meta-blue" />
                Forum Communautaire
              </h1>
              <p className="text-meta-gray dark:text-gray-400 mt-2 text-lg">
                Échangez, posez vos questions et partagez vos projets avec la communauté.
              </p>
            </div>
            
            <button
              onClick={() => setIsNewPostOpen(!isNewPostOpen)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Nouvelle discussion
            </button>
          </div>

          {isNewPostOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-8"
            >
              <h2 className="text-xl font-bold text-meta-dark dark:text-white mb-6">Créer une nouvelle discussion</h2>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
                  <input
                    type="text"
                    required
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-meta-blue outline-none dark:text-white"
                    placeholder="De quoi voulez-vous discuter ?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-meta-blue outline-none dark:text-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenu</label>
                  <textarea
                    required
                    rows={5}
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-meta-blue outline-none dark:text-white resize-none"
                    placeholder="Détaillez votre message ici..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsNewPostOpen(false)}
                    className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newPost.title.trim() || !newPost.content.trim()}
                    className="px-6 py-2 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                    Publier
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher une discussion..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-meta-blue outline-none dark:text-white"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-meta-blue dark:text-blue-400" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                Aucune discussion trouvée.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-meta-blue dark:text-blue-400 text-xs font-bold rounded-full">
                            {post.category}
                          </span>
                          <h3 className="text-xl font-bold text-meta-dark dark:text-white">
                            {post.title}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <User className="w-3 h-3" />
                            </div>
                            {post.profiles?.full_name || 'Utilisateur'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(post.created_at).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {post.forum_comments?.[0]?.count || 0} réponses
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
