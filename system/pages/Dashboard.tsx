import React, { useState, useEffect } from 'react';
import { User, Announcement, UserRole, ActivityLog } from '../types';
import { api } from '../src/api';
import { 
  Bell, Clock, Star, 
  GraduationCap, 
  Users, ClipboardCheck, ShieldCheck, QrCode, Plus, X,
  Database, ShieldAlert, Heart, TrendingUp,
  History, Terminal, CheckCircle, Sparkles,
  BarChart3, PieChart as PieChartIcon, Activity as ActivityIcon, ArrowUpRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const LOGO_URL = "https://raw.githubusercontent.com/Golgrax/randompublicimagefreetouse/refs/heads/main/logo.png";

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const getRoleColorHex = () => {
    switch (user.role) {
      case UserRole.TEACHER:
      case UserRole.FACULTY: return '#e11d48'; // rose-600
      case UserRole.ADMIN: return '#475569'; // slate-600
      case UserRole.TRANSFEREE: return '#059669'; // emerald-600
      default: return '#1A237E'; // school-navy
    }
  };

  const CHART_COLORS = [getRoleColorHex(), '#00A36C', '#EAB308', '#E11D48', '#6366F1', '#8B5CF6'];

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    pendingApps: 0, 
    activeStudents: 0,
    is4PsCount: 0,
    roleData: [] as any[],
    gradeData: [] as any[],
    appStatusData: [] as any[],
    activityData: [] as any[]
  });
  const navigate = useNavigate();

  const load = async () => {
    const [anns, allUsers, apps, activityLogs] = await Promise.all([
      api.getAnnouncements(),
      api.getUsers(),
      api.getEnrollmentApplications(),
      api.getLogs()
    ]);
    
    // User Role Distribution
    const roleCounts = allUsers.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const roleData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

    // Grade Level Distribution
    const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
    const gradeData = grades.map(g => ({
      name: g,
      value: allUsers.filter(u => u.role === UserRole.STUDENT && u.gradeLevel === g).length
    }));

    // App Status Distribution
    const statusCounts = apps.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const appStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Activity by Category
    const catCounts = activityLogs.reduce((acc, l) => {
      acc[l.category] = (acc[l.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const activityData = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

    setAnnouncements(anns);
    setLogs(activityLogs.slice(0, 3)); 
    setStats({
      totalUsers: allUsers.length,
      activeStudents: allUsers.filter(u => u.role === UserRole.STUDENT).length,
      is4PsCount: allUsers.filter(u => u.is4Ps).length,
      pendingApps: apps.filter(a => a.status === 'pending').length,
      roleData,
      gradeData,
      appStatusData,
      activityData
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user.id]);

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-school-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const isAdmin = user.role === UserRole.ADMIN;
  const isAdminOrFaculty = user.role === UserRole.ADMIN || user.role === UserRole.FACULTY;

  // Calculate School Year
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); 
  const schoolYear = month >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Hero Section - Hidden for Admin/Faculty */}
      {!isAdminOrFaculty && (
      <div className={`relative p-12 lg:p-20 rounded-[4rem] overflow-hidden shadow-2xl border border-white/10 ${
        user.role === UserRole.STUDENT ? 'bg-gradient-to-br from-school-navy via-indigo-900 to-indigo-950 text-white' : 
        isAdminOrFaculty ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white' : 
        user.role === UserRole.TEACHER ? 'bg-gradient-to-br from-rose-700 via-rose-800 to-rose-950 text-white' :
        'bg-gradient-to-br from-indigo-700 to-indigo-900 text-white'
      }`}>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-6 opacity-70">
              <div className="w-8 h-8 bg-white rounded-lg p-1">
                <img src={LOGO_URL} className="w-full h-full object-contain" alt="Sto. Niño Logo" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em]">
                Sto. Niño Elementary School Registry
              </span>
            </div>
            <h1 className="text-5xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
              Identity Management
            </h1>
            <p className="text-xl font-medium opacity-80 leading-relaxed max-w-lg mb-10">
              {isAdminOrFaculty 
                ? "Unified portal for DepEd record compliance and masterlist verification."
                : user.role === UserRole.STUDENT && user.honorStatus !== 'None' ? 
                  `Excellence recognized: You are tagged as ${user.honorStatus}. Keep inspiring!` : 
                  "Empowering learners through integrity, honor, and quality education."
              }
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => navigate(isAdminOrFaculty ? "/admin/users" : "/profile")}
                className="px-12 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl"
              >
                {isAdminOrFaculty ? 'User Registry' : 'My Account'}
              </button>
            </div>
          </div>
          
          {user.role === UserRole.STUDENT && (
            <div className="glass p-10 rounded-[3rem] min-w-[360px] shadow-2xl border-white/20 animate-float">
               <div className="flex justify-between items-start mb-10">
                 <div>
                   <p className="text-[11px] font-black uppercase text-white/50 tracking-[0.3em] mb-2">Learner Reference No.</p>
                   <p className="text-3xl font-black text-school-gold tracking-widest leading-none">{user.lrn}</p>
                 </div>
               </div>
               <div className="grid grid-cols-5 gap-4">
                 <div className="space-y-1 col-span-3">
                   <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Grade and Section</p>
                   <p className="text-sm font-black uppercase whitespace-nowrap">{user.gradeLevel} - {user.section || 'N/A'}</p>
                 </div>
                 <div className="space-y-1 text-right col-span-2">
                   <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">School Year</p>
                   <p className="text-sm font-black uppercase">{schoolYear}</p>
                 </div>
               </div>
            </div>
          )}
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 scale-150 pointer-events-none">
          {isAdminOrFaculty ? <TrendingUp size={600} /> : <img src={LOGO_URL} className="w-[600px] grayscale brightness-200" alt="" />}
        </div>
      </div>
      )}

      {/* Stats Section */}
      {isAdminOrFaculty && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
            <StatCard icon={<Users/>} label="Total Registry" value={stats.totalUsers} color="text-indigo-600" />
            <StatCard icon={<GraduationCap/>} label="Active Learners" value={stats.activeStudents} color="text-school-navy" />
            <StatCard icon={<Heart/>} label="4Ps Beneficiary" value={stats.is4PsCount} color="text-rose-600" />
            <StatCard icon={<ClipboardCheck/>} label="Pending Apps" value={stats.pendingApps} color="text-amber-600" />
          </div>

          {/* Detailed Analytics Section for Admin */}
          {isAdmin && (
            <div className="space-y-10 px-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-school-gold/10 text-school-gold rounded-2xl">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">System Analytics</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Real-time data visualization of school operations</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Role Distribution */}
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[400px]">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                    <PieChartIcon size={16} /> User Role Distribution
                  </h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.roleData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.roleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Students per Grade Level */}
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[400px]">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                    <BarChart3 size={16} /> Students per Grade Level
                  </h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.gradeData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" fill={getRoleColorHex()} radius={[10, 10, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Activity Category Breakdown */}
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[400px]">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                    <ActivityIcon size={16} /> Activity by Category
                  </h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.activityData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={getRoleColorHex()} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={getRoleColorHex()} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="value" stroke={getRoleColorHex()} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Enrollment Application Overview */}
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[400px]">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                    <ClipboardCheck size={16} /> Application Status Overview
                  </h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.appStatusData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} width={80} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={30}>
                          {stats.appStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'approved' ? '#00A36C' : entry.name === 'pending' ? '#EAB308' : '#E11D48'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* System Logs for Admin */}
          {isAdmin && (
             <section className="bg-slate-950 border border-slate-800 rounded-[4rem] p-12 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
                   <Terminal size={150} className="text-school-gold" />
                </div>
                <div className="flex items-center justify-between mb-10 relative z-10">
                   <h2 className="text-2xl font-black flex items-center gap-4 text-white uppercase tracking-tighter">
                     <History className="text-school-gold" /> Audit Trail
                   </h2>
                   <div className="flex items-center gap-4">
                      <span className="hidden sm:inline text-[10px] font-black text-school-gold/50 uppercase tracking-[0.4em]">Live Security Protocol</span>
                      <button 
                        onClick={() => navigate("/admin/database", { state: { initialTable: 'activity_logs' } })}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border border-white/10 flex items-center gap-2"
                      >
                        View Full Logs <ArrowUpRight size={12}/>
                      </button>
                   </div>
                </div>
                <div className="space-y-4 relative z-10">
                   {logs.map(log => (
                     <div key={log.id} className="flex gap-5 items-start p-6 bg-white/5 rounded-[2rem] border border-white/5 group hover:bg-white/10 transition-all cursor-default">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-[11px] font-black ${
                          log.category === 'Security' ? 'bg-rose-500/20 text-rose-500' :
                          log.category === 'Academic' ? 'bg-indigo-500/20 text-indigo-500' :
                          'bg-emerald-500/20 text-emerald-500'
                        }`}>
                           {log.category.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-medium text-slate-300">
                             <span className="text-white font-black">{log.userName}</span> {log.action}
                           </p>
                           <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">{log.timestamp} • {log.category}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </section>
          )}

          {/* Action Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-2">
            {user.role === UserRole.STUDENT ? (
              <>
                <QuickTile to="/grades" icon={<Star/>} label="SF9 Card" color="bg-rose-100 text-rose-600" />
                <QuickTile to="/clearance" icon={<ShieldCheck/>} label="Clearance" color="bg-emerald-100 text-emerald-600" />
                <QuickTile to="/attendance" icon={<CheckCircle/>} label="Attendance" color="bg-sky-100 text-sky-600" />
                <QuickTile to="/id-card" icon={<QrCode/>} label="Student ID" color="bg-indigo-100 text-indigo-700" />
              </>
            ) : isAdminOrFaculty ? (
              <>
                <QuickTile to="/admin/users" icon={<Users/>} label="Admissions" color="bg-rose-100 text-rose-600" />
                <QuickTile to="/admin/database" icon={<Database/>} label="Masterfile" color="bg-indigo-100 text-indigo-700" />
                <QuickTile to="/masterlist" icon={<GraduationCap/>} label="SF1 Registry" color="bg-amber-100 text-amber-600" />
                <QuickTile to="/faculty-requests" icon={<ClipboardCheck/>} label="Validation" color="bg-emerald-100 text-emerald-600" />
              </>
            ) : null}
          </div>

          {/* Bulletin Section */}
          <section className="glass rounded-[4rem] p-12 shadow-xl border-slate-200 dark:border-slate-800">
            <h2 className="text-4xl font-black flex items-center gap-5 text-slate-800 dark:text-slate-100 mb-10 uppercase tracking-tighter">
              <Bell className="text-school-accent" size={40} /> School Bulletin
            </h2>
            <div className="space-y-8">
              {announcements.length > 0 ? announcements.map(ann => (
                <div key={ann.id} className="p-10 bg-white/50 dark:bg-slate-800/40 rounded-[3rem] border border-slate-100 dark:border-slate-700 hover:border-school-accent transition-all group shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                    <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100 group-hover:text-school-accent transition-colors">{ann.title}</h3>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full w-fit ${
                      ann.category === 'Notice' ? 'bg-indigo-100 text-indigo-600' : 
                      ann.category === 'Brigada Eskwela' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}>{ann.category}</span>
                  </div>
                  <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{ann.content}</p>
                  <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <span>Author: {ann.author}</span>
                     <span>{ann.date}</span>
                  </div>
                </div>
              )) : (
                <div className="p-32 text-center text-slate-300">
                  <Bell size={64} className="mx-auto mb-6 opacity-20" />
                  <p className="font-black uppercase tracking-[0.5em] text-xs">No Official Updates</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-10">
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: number, color: string }> = ({ icon, label, value, color }) => (
  <div className="glass border-slate-100 dark:border-slate-800 p-10 rounded-[3rem] shadow-sm flex items-center gap-8 group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
    <div className={`p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800 ${color} group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 36 })}
    </div>
    <div>
      <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
    </div>
  </div>
);

const QuickTile: React.FC<{ to: string, icon: React.ReactNode, label: string, color: string }> = ({ to, icon, label, color }) => (
  <Link to={to} className={`flex flex-col items-center justify-center p-8 rounded-[3rem] shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 group border border-white/5 ${color}`}>
     <div className="mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
       {React.cloneElement(icon as React.ReactElement<any>, { size: 40 })}
     </div>
     <span className="text-[11px] font-black uppercase tracking-[0.2em] text-center leading-tight">{label}</span>
  </Link>
);

export default Dashboard;
