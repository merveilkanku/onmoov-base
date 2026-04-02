import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { ThemeProvider } from './lib/ThemeContext';
import { supabase } from './lib/supabase';
import Home from './pages/Home';
import Login from './pages/Login';
import Careers from './pages/Careers';
import JobDetail from './pages/JobDetail';
import Admin from './pages/Admin';
import Solutions from './pages/Solutions';
import Innovation from './pages/Innovation';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Training from './pages/Training';
import BecomeTrainer from './pages/BecomeTrainer';
import CourseDetail from './pages/CourseDetail';
import CoursePlayer from './pages/CoursePlayer';
import AdminCourseContent from './pages/AdminCourseContent';
import AdminCourseUsers from './pages/AdminCourseUsers';
import AdminLessonQuizzes from './pages/AdminLessonQuizzes';
import Achievements from './pages/Achievements';
import Forum from './pages/Forum';

export default function App() {
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('site_settings').select('id').limit(1);
        if (error && error.message === 'Failed to fetch') {
          setIsSupabaseConnected(false);
        } else {
          setIsSupabaseConnected(true);
        }
      } catch (err: any) {
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          setIsSupabaseConnected(false);
        } else if (err?.message === 'Failed to fetch') {
          setIsSupabaseConnected(false);
        } else {
          setIsSupabaseConnected(true);
        }
      }
    };
    checkConnection();
  }, []);

  if (isSupabaseConnected === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isSupabaseConnected === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Database className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Database Connection Failed</h1>
          <p className="text-gray-600 mb-6">
            The application could not connect to Supabase. This usually happens when:
          </p>
          <ul className="text-left text-gray-600 mb-6 space-y-2 list-disc list-inside">
            <li>Your Supabase project is paused due to inactivity.</li>
            <li>The Supabase URL or Anon Key is incorrect.</li>
            <li>You are experiencing network issues.</li>
          </ul>
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm text-left">
            <strong>How to fix:</strong><br /><br />
            1. Go to your <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Supabase Dashboard</a>.<br />
            2. Unpause your project if it is paused.<br />
            3. Check your <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in the AI Studio Secrets or <code>.env</code> file.
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/carrieres" element={<Careers />} />
          <Route path="/carrieres/:id" element={<JobDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/courses/:id" element={<AdminCourseContent />} />
          <Route path="/admin/courses/:id/users" element={<AdminCourseUsers />} />
          <Route path="/admin/lessons/:lessonId/quizzes" element={<AdminLessonQuizzes />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/innovation" element={<Innovation />} />
          <Route path="/about" element={<About />} />
          <Route path="/formations" element={<Training />} />
          <Route path="/devenir-formateur" element={<BecomeTrainer />} />
          <Route path="/formations/:id" element={<CourseDetail />} />
          <Route path="/formations/:id/learn" element={<CoursePlayer />} />
          <Route path="/accomplissements" element={<Achievements />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
