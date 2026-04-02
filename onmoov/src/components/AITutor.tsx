import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

interface AITutorProps {
  lessonTitle: string;
  lessonContent: string;
}

export default function AITutor({ lessonTitle, lessonContent }: AITutorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: `Bonjour ! Je suis votre tuteur IA. Avez-vous des questions sur la leçon "${lessonTitle}" ?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [{ text: `Tu es un tuteur expert pour la plateforme Onmoov Academy. 
Ton but est d'aider les étudiants à comprendre leurs leçons.
Voici le contexte de la leçon actuelle :
Titre : ${lessonTitle}
Contenu : ${lessonContent}

Réponds à la question suivante de l'étudiant de manière pédagogique et concise :
${userMessage}` }]
          }
        ],
        config: {
          systemInstruction: "Tu es un tuteur pédagogique bienveillant. Tu aides les étudiants à comprendre les concepts complexes en les expliquant simplement. Tu réponds toujours en français.",
        }
      });

      const text = response.text;
      
      if (text) {
        setMessages(prev => [...prev, { role: 'model', text: text }]);
      } else {
         setMessages(prev => [...prev, { role: 'model', text: "Désolé, je n'ai pas pu générer de réponse." }]);
      }
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      setMessages(prev => [...prev, { role: 'model', text: `Erreur: Impossible de contacter le tuteur IA. Veuillez vérifier votre connexion.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-meta-blue p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <h3 className="font-bold">Tuteur IA</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-meta-blue text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl p-3 ${msg.role === 'user' ? 'bg-meta-blue text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none shadow-sm'}`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-meta-blue" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Le tuteur réfléchit...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez votre question..."
                  className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-meta-blue outline-none dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 bg-meta-blue hover:bg-meta-blue-hover text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
