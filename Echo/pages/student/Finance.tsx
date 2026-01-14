import React, { useState, useEffect } from 'react';
import { User, FeeRecord } from '../../types';
import { api } from '../../src/api'; // Changed from mockApiService
import { 
  Wallet, Receipt, ArrowUpRight, 
  Clock, CheckCircle2, AlertCircle, 
  Printer, Download, Loader2, Info
} from 'lucide-react';

const FinancePage: React.FC<{ user: User }> = ({ user }) => {
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinances = async () => {
      try {
        const data = await api.getFinances(user.id);
        setRecords(data);
      } catch (error) {
        console.error("Failed to fetch finances:", error);
      }
      setLoading(false);
    };
    fetchFinances();
  }, [user.id]);

  const totalBalance = records.reduce((acc, curr) => curr.status === 'pending' ? acc + curr.amount : acc, 0);

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-school-navy" size={40} />
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Finance Ledger</h1>
          <p className="text-slate-500 mt-2 font-medium">Track school contributions, PTA dues, and miscellaneous fees.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-100 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-sm">
              <Printer size={16} /> Statement
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-school-navy p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
              <Wallet className="absolute top-0 right-0 p-8 text-white/5 -rotate-12 translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform" size={220} />
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Outstanding</p>
                 <h2 className="text-5xl font-black tracking-tighter mb-10">₱{totalBalance.toLocaleString()}</h2>
                 <button className="w-full py-4 bg-white text-school-navy rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
                    Pay via Gcash / Maya
                 </button>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[3rem] shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6">Payment Guide</h3>
              <div className="space-y-4">
                 <PaymentMethod icon={<Receipt/>} label="Cash via Registrar" />
                 <PaymentMethod icon={<ArrowUpRight/>} label="Bank Transfer" />
              </div>
           </div>
        </div>

        <div className="lg:col-span-2">
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Details</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {records.length > 0 ? records.map(fee => (
                    <tr key={fee.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="px-8 py-8">
                         <p className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{fee.description}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{fee.category} • {fee.date}</p>
                      </td>
                      <td className="px-8 py-8">
                         <span className="font-black text-lg text-slate-800 dark:text-white tracking-tighter">₱{fee.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-8 text-right">
                         <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                           fee.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                         }`}>
                           {fee.status}
                         </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="p-32 text-center">
                         <Info className="mx-auto mb-4 text-slate-200" size={48} />
                         <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No financial records</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};

const PaymentMethod = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-slate-100 transition-all cursor-pointer">
     <div className="text-indigo-600">{icon}</div>
     <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{label}</span>
  </div>
);

export default FinancePage;
