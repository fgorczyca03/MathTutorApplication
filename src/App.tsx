import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Send, RefreshCcw, User, Sparkles, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { analyzeMathProblem, chatWithTutor } from './services/gemini';

interface Message {
  role: 'user' | 'model';
  content: string;
  image?: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setSelectedImage(base64String);
        setMimeType(file.type);
        
        // Automatically start analysis when image is uploaded
        startInitialAnalysis(base64String, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const startInitialAnalysis = async (image: string, type: string) => {
    setIsLoading(true);
    setMessages([{ role: 'user', content: "I've uploaded a math problem. Can you help me?", image: `data:${type};base64,${image}` }]);
    
    try {
      const response = await analyzeMathProblem(image, type);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "I'm sorry, I had trouble seeing that image. Could you try uploading it again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      
      const response = await chatWithTutor(userMessage, history);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "I'm sorry, my thoughts are a bit scattered. Could you repeat that?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetTutor = () => {
    setMessages([]);
    setSelectedImage(null);
    setMimeType(null);
    setInput('');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <header className="mb-12 text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warm-accent text-white mb-6 shadow-lg"
        >
          <Sparkles size={32} />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-6xl font-serif italic mb-4 text-warm-ink"
        >
          Socrates
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-warm-accent/70 font-medium tracking-wide uppercase text-xs"
        >
          Your Compassionate Math Guide
        </motion.p>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-white rounded-[32px] shadow-xl shadow-warm-accent/5 border border-warm-accent/10 overflow-hidden relative">
        
        {/* Chat Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-12">
              <div className="max-w-md space-y-4">
                <h2 className="text-3xl font-serif italic text-warm-ink">Welcome, seeker of knowledge.</h2>
                <p className="text-warm-ink/60 leading-relaxed">
                  Upload a photo of a calculus or algebra problem you're working on. 
                  I won't just give you the answer—I'll help you find it yourself, step by step.
                </p>
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="group flex items-center space-x-3 bg-warm-accent text-white px-8 py-4 rounded-full hover:bg-warm-accent/90 transition-all shadow-md hover:shadow-lg"
              >
                <Camera size={20} />
                <span className="font-medium">Upload a Problem</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] flex space-x-4 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                      msg.role === 'user' ? 'bg-warm-accent text-white' : 'bg-warm-bg border border-warm-accent/20 text-warm-accent'
                    }`}>
                      {msg.role === 'user' ? <User size={18} /> : <Sparkles size={18} />}
                    </div>
                    
                    <div className={`space-y-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.image && (
                        <div className="rounded-2xl overflow-hidden border border-warm-accent/10 shadow-sm mb-2 inline-block max-w-full">
                          <img src={msg.image} alt="Uploaded problem" className="max-h-64 object-contain" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div className={`p-5 rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-warm-accent text-white rounded-tr-none' 
                          : 'bg-warm-bg border border-warm-accent/10 rounded-tl-none text-warm-ink shadow-sm'
                      }`}>
                        <div className="markdown-body prose prose-slate max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkMath]} 
                            rehypePlugins={[rehypeKatex]}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex space-x-4">
                    <div className="w-10 h-10 rounded-full bg-warm-bg border border-warm-accent/20 flex items-center justify-center text-warm-accent animate-pulse">
                      <Sparkles size={18} />
                    </div>
                    <div className="bg-warm-bg border border-warm-accent/10 p-5 rounded-2xl rounded-tl-none shadow-sm">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-warm-accent/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-warm-accent/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-warm-accent/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-warm-accent/10 bg-warm-bg/50 backdrop-blur-sm">
          <form onSubmit={handleSendMessage} className="relative flex items-center space-x-4">
            <button 
              type="button"
              onClick={resetTutor}
              className="p-3 text-warm-accent/60 hover:text-warm-accent hover:bg-warm-accent/10 rounded-full transition-colors"
              title="Start New Problem"
            >
              <RefreshCcw size={20} />
            </button>
            
            <div className="flex-1 relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={messages.length === 0 ? "Upload a photo to begin..." : "Ask a question or share your next step..."}
                disabled={isLoading || messages.length === 0}
                className="w-full bg-white border border-warm-accent/20 rounded-full px-6 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-warm-accent/20 focus:border-warm-accent transition-all disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading || messages.length === 0}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-warm-accent text-white rounded-full hover:bg-warm-accent/90 disabled:opacity-50 disabled:hover:bg-warm-accent transition-all"
              >
                <Send size={18} />
              </button>
            </div>

            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-warm-accent/10 text-warm-accent hover:bg-warm-accent/20 rounded-full transition-colors"
              title="Upload Image"
            >
              <Camera size={20} />
            </button>
          </form>
          
          <div className="mt-4 flex items-center justify-center space-x-6 text-[10px] uppercase tracking-widest text-warm-accent/40 font-bold">
            <div className="flex items-center space-x-1">
              <Info size={10} />
              <span>Socratic Method</span>
            </div>
            <div className="flex items-center space-x-1">
              <Sparkles size={10} />
              <span>Patient Guidance</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center text-warm-accent/30 text-xs font-medium">
        <p>&copy; {new Date().getFullYear()} Socrates Math Tutor. Guided by wisdom, powered by AI.</p>
      </footer>
    </div>
  );
}
