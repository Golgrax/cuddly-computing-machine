import React, { useState, useEffect } from 'react';
import { Facility } from '../../types';
import { api } from '../../src/api';
import { 
  Box, Clock, Loader2
} from 'lucide-react';

const StudentFacilities: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const facilitiesData = await api.getFacilities();
      setFacilities(facilitiesData);
    } catch (error) {
      console.error("Failed to fetch facilities:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-school-navy" size={40} />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Facilities</h1>
        <p className="text-slate-500 mt-2 font-medium">View the status of school facilities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {facilities.map(f => (
          <div key={f.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${
              f.status === 'available' ? 'bg-emerald-50 text-emerald-600' :
              f.status === 'reserved' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <Box size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">{f.name}</h3>
            
            <div
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all mb-8 flex items-center gap-2 ${
                f.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                f.status === 'reserved' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <Clock size={12} />
              {f.status}
            </div>

            <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                 <Clock size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Sanitized: {f.lastCleaned}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentFacilities;
