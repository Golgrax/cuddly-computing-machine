import React, { useState, useEffect } from 'react';
import { User, DropoutRequest } from '../../types';
import { api } from '../../src/api'; // Changed from mockApiService
import { ShieldAlert, Send, Clock, CheckCircle2, XCircle, Info } from 'lucide-react';

const DropoutRequestPage: React.FC<{ user: User }> = ({ user }) => {
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState<DropoutRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await api.getDropoutRequests();
      setRequests(data.filter((r: DropoutRequest) => r.studentId === user.id));
    } catch (error) {
      console.error("Failed to load requests:", error);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    setLoading(true);
    try {
      await api.submitDropoutRequest({ studentId: user.id, studentName: user.name, reason });
      setReason('');
      setToast('Withdrawal Request Submitted');
      setTimeout(() => setToast(null), 3000);
      load();
    } catch (error) {
      console.error("Failed to submit request:", error);
      alert("Failed to submit request.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {toast && (
        <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="text-emerald-400" />
          <span className="font-black text-xs uppercase tracking-widest">{toast}</span>
        </div>
      )}

      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Transfer-Out Form</h1>
        <p className="text-slate-500 mt-2 font-medium">Official request for student withdrawal or transfer to another institution.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            <ShieldAlert className="text-rose-500" /> Request Details
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl flex items-start gap-4 border border-amber-100 dark:border-amber-800">
              <Info className="text-amber-600 flex-shrink-0" size={20} />
              <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Processing this request requires valid parent/guardian consent. Your adviser will call your guardian once submitted.</p>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Reason for Withdrawal</label>
              <textarea 
                rows={5} required
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-medium text-sm focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                placeholder="Please state clearly the reason (e.g., Transferring to another city, Financial reasons...)"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
            <button 
              disabled={loading}
              className="w-full py-5 bg-slate-900 dark:bg-rose-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:opacity-90 shadow-xl"
            >
              {loading ? 'Processing...' : <><Send size={18}/> Submit Withdrawal Request</>}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight">Recent Requests</h2>
          {requests.length > 0 ? requests.map(r => (
            <div key={r.id} className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm">
               <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${r.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : r.status === 'denied' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                      {r.status === 'pending' ? <Clock size={20}/> : r.status === 'approved' ? <CheckCircle2 size={20}/> : <XCircle size={20}/>}
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">{r.status}</span>
                 </div>
                 <span className="text-[10px] font-bold text-slate-400">{r.timestamp}</span>
               </div>
               <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">"{r.reason}"</p>
            </div>
          )) : (
            <div className="p-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
               <Info className="mx-auto mb-4 text-slate-200" size={48} />
               <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No active requests</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DropoutRequestPage;