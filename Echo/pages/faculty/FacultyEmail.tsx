import React, { useState, useEffect } from 'react';
import { User, EmailLog } from '../../types';
import { api } from '../../src/api'; 
import { Mail, Send, Clock, CheckCircle2, AlertCircle, Users, Loader2, X, AtSign } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import RecipientSelector, { RecipientTarget } from '../../components/RecipientSelector';

const FacultyEmail: React.FC<{ user: User }> = ({ user }) => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [targets, setTargets] = useState<RecipientTarget[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [toast, setToast] = useState<string | null>(null);
  const location = useLocation();

  const loadData = async () => {
    try {
      // Fetch logs and users to resolve email if needed
      const [logsData, usersData] = await Promise.all([
        api.getEmailLogs(),
        api.getUsers()
      ]);

      setLogs(logsData);

      // Handle direct navigation with recipient email
      const stateRecipientEmail = location.state?.recipientEmail;
      if (stateRecipientEmail) {
          const targetUser = usersData.find((u: User) => u.email === stateRecipientEmail);
          if (targetUser) {
              setTargets([{ 
                  type: 'user', 
                  value: targetUser.id, 
                  label: `${targetUser.name} (${targetUser.role})` 
              }]);
          }
      }

    } catch (error) {
      console.error("Failed to load data:", error);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !subject || targets.length === 0) return;

    setSending(true);
    try {
      await api.sendEmailBroadcast({
        targets: targets,
        subject: subject,
        message: message
      });
      setMessage('');
      setSubject('');
      setTargets([]);
      setToast('Broadcast Sent Successfully');
      setTimeout(() => setToast(null), 3000);
      loadData(); // Reload logs
    } catch (error) {
      console.error("Failed to send Email:", error);
      alert("Failed to send Email.");
    }
    setSending(false);
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-24 right-8 z-[100] bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10">
          <CheckCircle2 className="text-emerald-400" />
          <span className="font-black text-xs uppercase tracking-widest">{toast}</span>
        </div>
      )}

      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Email Broadcast Center</h1>
        <p className="text-slate-500 mt-2 font-medium">Send official announcements and newsletters via secure email channels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm sticky top-28">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <Mail className="text-indigo-600" /> New Message
            </h2>
            <form onSubmit={handleSend} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Recipients</label>
                <RecipientSelector user={user} selected={targets} onChange={setTargets} />
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Subject Line</label>
                <div className="relative">
                  <AtSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" required
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Urgent Meeting Notice"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Message Body</label>
                <textarea 
                  rows={8} required
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-medium text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Compose your official correspondence here..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>
              <button 
                disabled={sending || targets.length === 0}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                {sending ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18}/> Send Email</>}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight ml-2">Transmission Logs</h2>
          {logs.length > 0 ? logs.map(log => (
            <div key={log.id} className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group">
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <Clock size={24} />
                     </div>
                     <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{log.subject}</h3>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{log.recipient} • {log.timestamp}</p>
                     </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    log.status === 'sent' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {log.status}
                  </span>
               </div>
               <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-transparent group-hover:border-slate-100 transition-all">
                 {log.message}
               </p>
            </div>
          )) : (
            <div className="p-32 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[4rem]">
               <Mail className="mx-auto mb-4 text-slate-200" size={48} />
               <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No email history found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyEmail;
