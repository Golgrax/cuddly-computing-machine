import React, { useState, useEffect } from 'react';
import { User, ScheduleItem } from '../types';
import { api } from '../src/api'; // Changed from mockApiService
import { Clock, Book, User as UserIcon, MapPin, Calendar, Loader2 } from 'lucide-react';

const SchedulePage: React.FC<{ user: User }> = ({ user }) => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const data = await api.getSchedule();
        setSchedule(data);
      } catch (error) {
        console.error("Failed to fetch schedule:", error);
      }
      setLoading(false);
    };
    fetchSchedule();
  }, []);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-school-navy" size={40} />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Class Schedule</h1>
        <p className="text-slate-500 mt-2 font-medium">Weekly academic timetable and instructional assignments.</p>
      </div>

      <div className="space-y-10">
        {days.map(day => (
          <div key={day} className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none">
                 <Calendar size={20} />
               </div>
               <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{day}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schedule.filter(s => s.day === day).length > 0 ? (
                schedule.filter(s => s.day === day).map(item => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-6">
                       <span className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700">
                         {item.time}
                       </span>
                       <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                         <Book size={20} />
                       </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tight">{item.subject}</h3>
                    
                    <div className="space-y-3 pt-6 border-t border-slate-50 dark:border-slate-800">
                       <div className="flex items-center gap-3 text-slate-500">
                          <UserIcon size={14} className="text-slate-300" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.instructor}</span>
                       </div>
                       <div className="flex items-center gap-3 text-slate-500">
                          <MapPin size={14} className="text-slate-300" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.room}</span>
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-10 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-center">
                   <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">No scheduled classes</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchedulePage;