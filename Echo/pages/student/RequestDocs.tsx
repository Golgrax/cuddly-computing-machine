import React, { useState, useEffect } from 'react';
import { User, DocumentRequest } from '../../types';
import { api } from '../../src/api'; // Changed from mockApiService
import { FileText, Send, Clock, CheckCircle2, AlertCircle, Info, Loader2, X } from 'lucide-react';

const RequestDocs: React.FC<{ user: User }> = ({ user }) => {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    documentType: 'Certificate of Enrollment' as DocumentRequest['documentType'],
    purpose: ''
  });
  const [toast, setToast] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const data = await api.getDocRequests(user.id);
      setRequests(data);
    } catch (error) {
      console.error("Failed to load requests:", error);
    }
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.purpose) return;
    
    setSubmitting(true);
    try {
      await api.requestDoc({
        studentId: user.id,
        studentName: user.name,
        documentType: formData.documentType,
        purpose: formData.purpose
      });
      setFormData({ ...formData, purpose: '' });
      setToast('Request Submitted Successfully');
      setTimeout(() => setToast(null), 3000);
      loadRequests();
    } catch (error) {
      console.error("Failed to submit request:", error);
      alert("Failed to submit request.");
    }
    setSubmitting(false);
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
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Official Requests</h1>
        <p className="text-slate-500 mt-2 font-medium">Request institutional documents and academic certifications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm sticky top-28">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <FileText className="text-indigo-600" /> New Request
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Document Type</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                  value={formData.documentType}
                  onChange={e => setFormData({...formData, documentType: e.target.value as any})}
                >
                  <option>Certificate of Enrollment</option>
                  <option>Good Moral</option>
                  <option>Form 137</option>
                  <option>Diploma Replacement</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Purpose</label>
                <textarea 
                  rows={4} required
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-medium text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="State the purpose of this request..."
                  value={formData.purpose}
                  onChange={e => setFormData({...formData, purpose: e.target.value})}
                />
              </div>
              <button 
                disabled={submitting}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18}/> Submit Request</>}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight ml-2">Request History</h2>
          {requests.length > 0 ? requests.map(req => (
            <div key={req.id} className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group">
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-2xl ${req.status === 'ready' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {req.status === 'ready' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{req.documentType}</h3>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Requested on {req.dateRequested}</p>
                     </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    req.status === 'ready' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                    {req.status}
                  </span>
               </div>
               <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent group-hover:border-slate-100 transition-all">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Purpose of Request</p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{req.purpose}"
                  </p>
               </div>
            </div>
          )) : (
            <div className="p-32 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[4rem]">
               <Info className="mx-auto mb-4 text-slate-200" size={48} />
               <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No requests found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDocs;