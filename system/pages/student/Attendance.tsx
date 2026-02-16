
import React, { useState, useEffect } from 'react';
import { User, AttendanceRecord } from '../../types';
import { api } from '../../src/api';
import { CheckCircle, XCircle, Clock, Calendar, BarChart as BarChartIcon, Trophy, Info, Sparkles, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AttendancePage: React.FC<{ user: User }> = ({ user }) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Fetching attendance for user:', user.id);
    api.getAttendance(user.id).then(data => {
      console.log('Attendance Data Received:', data);
      setAttendance(data);
      setLoading(false);
    });
  }, [user.id]);

  if (loading) return null;

  // Process data for Chart
  const chartData = attendance
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((record, index) => ({
      name: `Day ${index + 1}`,
      present: attendance.slice(0, index + 1).filter(r => r.status === 'present').length,
    }));

  // Calculate Summary
  const totalPresent = attendance.filter(a => a.status === 'present').length;
  const totalLate = attendance.filter(a => a.status === 'late').length;
  const totalAbsent = attendance.filter(a => a.status === 'absent' || a.status === 'excused').length;

  // Helper to check status for a specific day (assuming current month for visual demo, 
  // or simple mapping if we had full calendar logic. For "legit" list, simpler is better, 
  // but preserving the grid UI requires mapping dates. 
  // We'll map the *last 31 days* or just fetched records if they match the day number.)
  
  const getStatusColor = (day: number) => {
      // Find record for this day by string matching to avoid timezone issues
      // a.date format is YYYY-MM-DD
      const record = attendance.find(a => {
          if (!a.date) return false;
          const parts = a.date.split('-'); // [YYYY, MM, DD]
          const recordDay = parseInt(parts[2], 10);
          return recordDay === day;
      });

      if (!record) return 'bg-slate-50 dark:bg-slate-800 text-slate-300';
      if (record.status === 'present') return 'bg-emerald-500 text-white shadow-lg';
      if (record.status === 'late') return 'bg-amber-400 text-white shadow-lg';
      if (record.status === 'absent' || record.status === 'excused') return 'bg-rose-500 text-white shadow-lg';
      return 'bg-slate-50 dark:bg-slate-800 text-slate-300';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Presence Tracker</h1>
          <p className="text-slate-500 mt-2 font-medium">Daily attendance consistency and punctuality log.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm">
             <h3 className="text-lg font-black mb-8 flex items-center gap-2">Summary</h3>
             <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <span className="text-base font-black uppercase tracking-widest text-slate-400">Total Present</span>
                  <span className="text-3xl font-black text-emerald-500">{totalPresent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-black uppercase tracking-widest text-slate-400">Late Days</span>
                  <span className="text-3xl font-black text-amber-500">{totalLate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-black uppercase tracking-widest text-slate-400">Absent/Excused</span>
                  <span className="text-3xl font-black text-indigo-500">{totalAbsent}</span>
                </div>
             </div>
           </div>

           <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
                  <Activity size={16} className="text-indigo-600" /> Presence Growth
                </h4>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">Live Data</div>
              </div>
              
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="present" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorAtt)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-6 text-center uppercase tracking-widest">Cumulative Attendance Volume</p>
           </div>
        </div>

        <div className="lg:col-span-3">
           <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm">
             <h3 className="text-lg font-black mb-10 flex items-center gap-2">Monthly Consistency</h3>
             {attendance.length > 0 ? (
                 <div className="grid grid-cols-7 gap-4">
                    {Array.from({ length: 31 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`aspect-square rounded-2xl flex items-center justify-center text-xl font-black transition-all ${getStatusColor(i + 1)}`}
                      >
                        {i + 1}
                      </div>
                    ))}
                 </div>
             ) : (
                 <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                     No attendance records found for this period.
                 </div>
             )}
             
             <div className="mt-12 flex flex-wrap gap-8 pt-8 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-3">
                   <div className="w-5 h-5 rounded-full bg-emerald-500" />
                   <span className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Present</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-5 h-5 rounded-full bg-amber-400" />
                   <span className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Late</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-5 h-5 rounded-full bg-rose-500" />
                   <span className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Absent</span>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
