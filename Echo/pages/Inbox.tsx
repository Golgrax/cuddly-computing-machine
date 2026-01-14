import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../src/api';
import { Mail, Loader2, Inbox as InboxIcon, Calendar, User as UserIcon } from 'lucide-react';

const Inbox: React.FC<{ user: User }> = ({ user }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  useEffect(() => {
    api.getMessages(user.id).then(data => {
      setMessages(data);
      setLoading(false);
    });
  }, [user.id]);

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-school-navy" size={40} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">My Inbox</h1>
          <p className="text-slate-500 mt-2 font-medium">Official communications and announcements.</p>
        </div>
        <div className="px-6 py-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-widest text-slate-500">
          {messages.length} Messages
        </div>
      </div>

      <div className="flex gap-8 flex-1 min-h-0">
        {/* Message List */}
        <div className={`w-full lg:w-1/3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col ${selectedMessage ? 'hidden lg:flex' : ''}`}>
           <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
             <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">All Messages</h3>
           </div>
           <div className="overflow-y-auto flex-1 p-4 space-y-2">
             {messages.length > 0 ? messages.map(msg => (
               <div 
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                  selectedMessage?.id === msg.id 
                    ? 'bg-indigo-600 text-white shadow-lg border-indigo-600' 
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-transparent'
                }`}
               >
                 <div className="flex justify-between items-start mb-2">
                   <h4 className={`font-bold text-sm truncate ${selectedMessage?.id === msg.id ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                     {msg.sender || 'System'}
                   </h4>
                   <span className={`text-[10px] font-mono opacity-70 ${selectedMessage?.id === msg.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                     {msg.timestamp.split(',')[0]}
                   </span>
                 </div>
                 <p className={`text-xs font-medium truncate ${selectedMessage?.id === msg.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                   {msg.subject}
                 </p>
               </div>
             )) : (
               <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                 <InboxIcon size={32} className="mb-4 opacity-50" />
                 <span className="text-[10px] font-black uppercase tracking-widest">No messages</span>
               </div>
             )}
           </div>
        </div>

        {/* Message Content */}
        <div className={`w-full lg:w-2/3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col ${!selectedMessage ? 'hidden lg:flex' : ''}`}>
           {selectedMessage ? (
             <>
               <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/30 dark:bg-slate-800/30">
                 <div>
                   <button 
                    onClick={() => setSelectedMessage(null)}
                    className="lg:hidden mb-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600"
                   >
                     ← Back
                   </button>
                   <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{selectedMessage.subject}</h2>
                   <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                     <span className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                       <UserIcon size={14} /> {selectedMessage.sender || 'School Admin'}
                     </span>
                     <span className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                       <Calendar size={14} /> {selectedMessage.timestamp}
                     </span>
                   </div>
                 </div>
               </div>
               <div className="p-8 overflow-y-auto flex-1 prose dark:prose-invert max-w-none">
                 <p className="whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                   {selectedMessage.content}
                 </p>
               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10">
               <Mail size={64} className="mb-6 opacity-20" />
               <p className="text-sm font-black uppercase tracking-widest">Select a message to read</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;