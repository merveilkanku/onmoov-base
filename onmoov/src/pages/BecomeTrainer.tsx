import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Send, CheckCircle2, Loader2, ArrowLeft, Upload, FileText, UserCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

export default function BecomeTrainer() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      
      const { data, error } = await supabase
        .from('trainer_applications')
        .select('status')
        .eq('user_id', session.user.id)
        .single();
      
      if (data) {
        setHasApplied(true);
      }
    }
    setLoading(false);
  }

  const onPassportPhotoDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setPassportPhoto(acceptedFiles[0]);
    }
  }, []);

  const onCvDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setCvFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps: getPassportProps, getInputProps: getPassportInputProps, isDragActive: isPassportDragActive } = useDropzone({
    onDrop: onPassportPhotoDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  const { getRootProps: getCvProps, getInputProps: getCvInputProps, isDragActive: isCvDragActive } = useDropzone({
    onDrop: onCvDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1
  });

  async function uploadFile(file: File, bucket: string, path: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passportPhoto || !cvFile) {
      toast.error('Veuillez télécharger votre photo passeport et votre CV.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload files
      const userId = user?.id || `guest_${Date.now()}`;
      const passportPhotoUrl = await uploadFile(passportPhoto, 'app-images', `trainers/${userId}/passport`);
      const cvUrl = await uploadFile(cvFile, 'app-files', `trainers/${userId}/cv`);

      const { error } = await supabase
        .from('trainer_applications')
        .insert([
          {
            user_id: user?.id || null,
            full_name: fullName,
            email: email,
            phone: phone,
            address: address,
            bio: bio,
            experience: experience,
            cover_letter: coverLetter,
            passport_photo_url: passportPhotoUrl,
            cv_url: cvUrl,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      setHasApplied(true);
      toast.success('Votre candidature a été envoyée avec succès !');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error('Erreur lors de l\'envoi de la candidature.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-meta-blue" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative pt-12 sm:pt-20 pb-32 overflow-hidden bg-meta-light dark:bg-gray-900">
        <div className="absolute top-0 right-0 w-64 h-64 bg-meta-blue rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <Link to="/formations" className="inline-flex items-center gap-2 text-meta-gray dark:text-gray-400 hover:text-meta-blue dark:hover:text-blue-400 transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" /> Retour aux formations
            </Link>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-meta-blue dark:text-blue-400 text-sm font-medium mb-6">
                <GraduationCap className="w-4 h-4" />
                Rejoignez l'équipe
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-meta-dark dark:text-white mb-6">
                Devenir Formateur
              </h1>
              <p className="text-lg text-meta-gray dark:text-gray-400">
                Partagez votre expertise avec notre communauté et contribuez à former les ingénieurs de demain.
              </p>
            </motion.div>

            {hasApplied ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 p-12 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl text-center"
              >
                <div className="w-20 h-20 bg-green-50 dark:bg-green-900/30 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-meta-dark dark:text-white mb-4">Candidature Envoyée !</h2>
                <p className="text-meta-gray dark:text-gray-400 mb-8">
                  Merci pour votre intérêt. Notre équipe examine actuellement votre candidature. 
                  Vous recevrez une notification dès qu'une décision sera prise.
                </p>
                <Link 
                  to="/formations" 
                  className="inline-flex items-center justify-center px-8 py-3 bg-meta-blue text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Retour aux formations
                </Link>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 p-8 sm:p-12 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl"
              >
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-bold text-meta-dark dark:text-white mb-3">Nom Complet</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm focus:border-meta-blue focus:outline-none focus:ring-4 focus:ring-meta-blue/10 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white"
                        placeholder="Votre nom et prénom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-meta-dark dark:text-white mb-3">Email de contact</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm focus:border-meta-blue focus:outline-none focus:ring-4 focus:ring-meta-blue/10 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white"
                        placeholder="votre@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-meta-dark dark:text-white mb-3">Numéro de téléphone</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm focus:border-meta-blue focus:outline-none focus:ring-4 focus:ring-meta-blue/10 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white"
                        placeholder="+243 ..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-meta-dark dark:text-white mb-3">Adresse de résidence</label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm focus:border-meta-blue focus:outline-none focus:ring-4 focus:ring-meta-blue/10 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white"
                        placeholder="Ville, Quartier, Avenue..."
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-bold text-meta-dark dark:text-white mb-3">Photo Passeport</label>
                      <div 
                        {...getPassportProps()} 
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isPassportDragActive ? 'border-meta-blue bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-meta-blue/50 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        <input {...getPassportInputProps()} />
                        {passportPhoto ? (
                          <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                            <p className="text-sm text-meta-dark dark:text-white font-medium">{passportPhoto.name}</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <UserCircle className="w-8 h-8 text-gray-400" />
                            <p className="text-sm text-meta-gray dark:text-gray-400">
                              Glissez-déposez votre photo passeport ici
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-meta-dark dark:text-white mb-3">CV (PDF, Word)</label>
                      <div 
                        {...getCvProps()} 
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isCvDragActive ? 'border-meta-blue bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-meta-blue/50 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        <input {...getCvInputProps()} />
                        {cvFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                            <p className="text-sm text-meta-dark dark:text-white font-medium">{cvFile.name}</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="w-8 h-8 text-gray-400" />
                            <p className="text-sm text-meta-gray dark:text-gray-400">
                              Glissez-déposez votre CV ici
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-meta-dark dark:text-white mb-3">Lettre de Motivation</label>
                    <textarea
                      required
                      rows={6}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm focus:border-meta-blue focus:outline-none focus:ring-4 focus:ring-meta-blue/10 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white resize-none"
                      placeholder="Expliquez-nous pourquoi vous souhaitez devenir formateur..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-bold text-meta-dark dark:text-white mb-3">Bio / Présentation</label>
                      <textarea
                        required
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm focus:border-meta-blue focus:outline-none focus:ring-4 focus:ring-meta-blue/10 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white resize-none"
                        placeholder="Parlez-nous de vous en quelques mots..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-meta-dark dark:text-white mb-3">Expérience & Domaines d'expertise</label>
                      <textarea
                        required
                        rows={4}
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm focus:border-meta-blue focus:outline-none focus:ring-4 focus:ring-meta-blue/10 transition-all bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white resize-none"
                        placeholder="Quelles sont vos compétences et vos expériences passées ?"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center items-center gap-3 rounded-2xl bg-meta-blue py-5 px-8 text-base font-bold text-white hover:bg-blue-700 focus:outline-none transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        Envoyer ma candidature <Send className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
