import React, { useState, useEffect } from 'react';
import { User, ClearanceItem } from '../../types';
import { api } from '../../src/api'; // Changed from mockApiService
import { ShieldCheck, Clock, AlertCircle, CheckCircle2, ChevronRight, Info, Loader2 } from 'lucide-react';

const ClearancePage: React.FC<{ user: User }> = ({ user }) => {
  const [items, setItems] = useState<ClearanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClearance = async () => {
      try {
        const data = await api.getClearance(user.id);
        setItems(data);
      } catch (error) {
        console.error("Failed to fetch clearance:", error);
      }
      setLoading(false);
    };
    fetchClearance();
  }, [user.id]);

  const allCleared = items.length > 0 && items.every(i => i.status === 'cleared');

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-school-navy" size={40} />
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Learner Clearance</h1>
          <p className="text-slate-500 mt-2 font-medium">End-of-term departmental verification and property return status.</p>
        </div>
        <div className={`px-8 py-4 rounded-3xl flex items-center gap-4 border-2 transition-all ${
          allCleared ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'
        }`}>
           {allCleared ? <CheckCircle2 size={24} /> : <Clock size={24} className="animate-pulse" />}
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Overall Status</p>
              <p className="text-sm font-black uppercase tracking-widest leading-none">{allCleared ? 'Officialy Cleared' : 'Pending Verification'}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[3rem] shadow-sm hover:shadow-xl transition-all group">
             <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{item.department}</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Administrative Unit</p>
                </div>
                <div className={`p-3 rounded-2xl ${
                  item.status === 'cleared' ? 'bg-emerald-50 text-emerald-600' :
                  item.status === 'blocked' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {item.status === 'cleared' ? <ShieldCheck size={24} /> : 
                   item.status === 'blocked' ? <AlertCircle size={24} /> : <Clock size={24} />}
                </div>
             </div>

             <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-8 border border-transparent group-hover:border-slate-100 transition-all">
                <div className="flex items-center gap-3 text-slate-400 mb-2">
                   <Info size={14} />
                   <span className="text-[9px] font-black uppercase tracking-widest">Registrar Remarks</span>
                </div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  {item.remarks || "No pending issues recorded. Verification ongoing."}
                </p>
             </div>

             <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${
                  item.status === 'cleared' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  item.status === 'blocked' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {item.status}
                </span>
                <ChevronRight className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" size={20} />
             </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden">
         <div className="relative z-10">
            <h4 className="text-xl font-black uppercase tracking-tighter mb-2">Clearance Protocol</h4>
            <p className="text-sm text-white/60 font-medium max-w-2xl leading-relaxed">
              Once all departments have verified your status, a downloadable digital clearance certificate will be generated here. This document is required for end-of-year enrollment and SF10 requests.
            </p>
         </div>
         <ShieldCheck size={180} className="absolute top-0 right-0 p-8 text-white/5 -rotate-12 translate-x-1/4 -translate-y-1/4" />
      </div>
    </div>
  );
};

export default ClearancePage;
