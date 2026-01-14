import React, { useState, useEffect } from 'react';
import { api } from '../src/api';
import { Building2, Calendar, CheckCircle2, AlertCircle, Clock, Loader2, MapPin } from 'lucide-react';

const FacilitiesPage: React.FC = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const data = await api.getFacilities();
        setFacilities(data);
      } catch (error) {
        console.error("Failed to fetch facilities:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFacilities();
  }, []);

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-school-navy" size={40} />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Campus Facilities</h1>
          <p className="text-slate-500 mt-2 font-medium">Real-time status of school rooms and common areas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facilities.map((fac) => (
          <div key={fac.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
             {/* Status Badge */}
             <div className="absolute top-6 right-6">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  fac.status === 'available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  fac.status === 'maintenance' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                  'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {fac.status}
                </span>
             </div>

             <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 size={24} />
             </div>

             <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{fac.name}</h3>
             
             <div className="space-y-3 mt-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-3 text-slate-500">
                   <Calendar size={14} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Last Cleaned: {fac.lastCleaned || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                   <MapPin size={14} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Main Building</span>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacilitiesPage;