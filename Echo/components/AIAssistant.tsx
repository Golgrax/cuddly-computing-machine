
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { marked } from 'marked';
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2, Minimize2 } from 'lucide-react';
import { User as AppUser } from '../types';

const AIAssistant: React.FC<{ user: AppUser }> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: `Hi **${user.name.split(' ')[0]}**! I'm Niño, your school AI assistant. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
          systemInstruction: `You are 'Niño', a friendly and helpful elementary school AI assistant for Santo Niño Elementary School. 
          Your tone is encouraging, simple enough for grades 1-6 students to understand, but professional for faculty. 
          Use Markdown to format your responses (bold, lists, tables when appropriate).
          Always prioritize school values: Kindness, Excellence, and Integrity. 
          The user is currently logged in as a ${user.role} named ${user.name}.`,
        },
      });

      const aiText = response.text || "I'm sorry, I'm having trouble thinking right now. Please try again!";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "I encountered an error connecting to the campus brain. Please check your internet connection." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessageContent = (msg: { role: 'ai' | 'user', text: string }) => {
    if (msg.role === 'ai') {
      const html = marked.parse(msg.text) as string;
      return (
        <div 
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: html }} 
        />
      );
    }
    return msg.text;
  };

  if (!isOpen) return (
    <button 
      onClick={() => setIsOpen(true)}
      className="fixed bottom-8 right-8 w-16 h-16 bg-school-navy dark:bg-school-gold text-white dark:text-school-navy rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100] group"
    >
      <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />
      <div className="absolute -top-2 -right-2 bg-rose-500 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
    </button>
  );

  return (
    <div className={`fixed bottom-8 right-8 w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 z-[100] overflow-hidden flex flex-col transition-all duration-300 ${isMinimized ? 'h-20' : 'h-[600px] max-h-[80vh]'}`}>
      {/* Header */}
      <div className="bg-school-navy dark:bg-slate-950 p-6 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-school-gold rounded-2xl flex items-center justify-center text-school-navy">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-black text-sm tracking-widest uppercase leading-none">Niño AI</h3>
            <p className="text-[10px] font-bold text-school-gold/80 tracking-widest uppercase mt-1">Academic Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <Minimize2 size={18} />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-school-navy text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'
                }`}>
                  {renderMessageContent(msg)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl rounded-tl-none border border-slate-100 dark:border-slate-700">
                  <Loader2 size={18} className="animate-spin text-school-gold" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about school..."
              className="flex-1 px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-school-navy dark:focus:ring-school-gold transition-all"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 bg-school-navy dark:bg-school-gold text-white dark:text-school-navy rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default AIAssistant;
