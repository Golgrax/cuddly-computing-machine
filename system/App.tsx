import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, GraduationCap, BookOpen, FileText, 
  ClipboardList, LogOut, Bell, Search, Menu, X, 
  Activity, Sun, Moon, QrCode, 
  ShieldAlert, ClipboardCheck,
  Type, Eye, Users, FolderCheck, Presentation, Database,
  Clock, Edit, ShieldCheck,
  CheckCircle, UserCircle, Building2, MessageSquare
} from 'lucide-react';
import { User, UserRole, Theme } from './types';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import SchedulePage from './pages/Schedule';
import GradesPage from './pages/Grades';
import ModulesPage from './pages/Modules';
import AssignmentsPage from './pages/Assignments';
// import EnrollmentPage from './pages/Enrollment';
import FacultyAnnouncements from './pages/faculty/FacultyAnnouncements';
import Masterlist from './pages/faculty/Masterlist';
// import TransfereeStatus from './pages/transferee/Status';
import StudentID from './pages/student/StudentID';
import FacultyRequests from './pages/faculty/FacultyRequests';
import AIAssistant from './components/AIAssistant';
import AdminUserManagement from './pages/admin/UserManagement';
import StudentSubmissions from './pages/faculty/StudentSubmissions';
import DatabaseViewer from './pages/admin/DatabaseViewer';
import ClearancePage from './pages/student/Clearance';
import AttendancePage from './pages/student/Attendance';
import DropoutRequestPage from './pages/student/DropoutRequest';
import ProfilePage from './pages/Profile';
import AdminFacilities from './pages/admin/Facilities';
import FacilitiesPage from './pages/Facilities'; // New Import
import FacultyEmail from './pages/faculty/FacultyEmail';
import RequestDocs from './pages/student/RequestDocs';
import AttendanceSheet from './pages/faculty/AttendanceSheet';
import Inbox from './pages/Inbox';
import VerifyEmail from './pages/VerifyEmail';
import SecretAdmission from './pages/admin/SecretAdmission';
import { api } from './src/api';

const LOGO_URL = "https://raw.githubusercontent.com/Golgrax/randompublicimagefreetouse/refs/heads/main/logo.png";

interface UIPreferences {
  dyslexic: boolean;
  highContrast: boolean;
}

const UIContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  prefs: UIPreferences;
  setPrefs: (p: Partial<UIPreferences>) => void;
}>({ 
  theme: 'light', 
  setTheme: () => {}, 
  prefs: { dyslexic: false, highContrast: false }, 
  setPrefs: () => {} 
});

export const useUI = () => useContext(UIContext);

const PendingApproval: React.FC<{ onLogout: () => void, user: User }> = ({ onLogout, user }) => {
  const handleResendEmail = async () => {
    try {
      // Assuming a backend endpoint exists or we reuse the signup logic conceptually,
      // but typically we need a specific endpoint. 
      // Since I haven't created a specific 'resend-verify' endpoint yet, 
      // I will assume for this task I should just add the button and maybe mock the alert or 
      // if I need to implement the backend, I should do that too. 
      // The user asked "add a button resend email".
      // I will implement the button and a basic fetch call.
      // I'll need to create the endpoint in server.js next.
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      if (response.ok) {
        alert('Verification email sent! Please check your inbox.');
      } else {
        alert('Failed to send email. Please try again later.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('An error occurred. Please check your connection.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-white dark:bg-slate-900 p-3 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-pulse overflow-hidden">
        <img src={LOGO_URL} className="w-full h-full object-contain" alt="Sto. Niño Logo" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Verification Pending</h1>
      <p className="text-slate-500 font-medium max-w-md leading-relaxed mb-10">
        Hello, <span className="text-slate-900 dark:text-white font-black">{user.name}</span>. Your account has been created, but a system administrator must approve your access level before you can use the school features.
      </p>
      <div className="flex gap-4">
        <button onClick={() => window.location.reload()} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Check Status</button>
        <button onClick={handleResendEmail} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Resend Email</button>
        <button onClick={onLogout} className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-700 shadow-sm">Sign Out</button>
      </div>
    </div>
  );
};

const Sidebar: React.FC<{ user: User, isOpen: boolean, onClose: () => void, onLogout: () => void, onUpdateUser: (u: User) => void }> = ({ user, isOpen, onClose, onLogout, onUpdateUser }) => {
  const location = useLocation();

  const menuItems = {
    [UserRole.STUDENT]: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Inbox', path: '/inbox', icon: MessageSquare },
      { name: 'SF9 Card', path: '/grades', icon: ClipboardList },
      { name: 'Attendance', path: '/attendance', icon: CheckCircle },
      { name: 'Clearance', path: '/clearance', icon: ShieldCheck },
      { name: 'Modules', path: '/modules', icon: BookOpen },
      { name: 'Assignments', path: '/assignments', icon: FolderCheck }, // Added Assignments here too as implicit
      { name: 'Official Requests', path: '/requests', icon: FileText },
      { name: 'My ID', path: '/id-card', icon: QrCode },
      { name: 'Transfer-Out', path: '/transfer-out', icon: ShieldAlert },
    ],
    [UserRole.TEACHER]: [
      { name: 'Registry (SF1)', path: '/masterlist', icon: Presentation },
      { name: 'Inbox', path: '/inbox', icon: MessageSquare },
      { name: 'Attendance Sheet', path: '/faculty/attendance', icon: CheckCircle },
      { name: 'SF9 Grading', path: '/grades', icon: ClipboardList },
      { name: 'Modules', path: '/modules', icon: BookOpen },
      { name: 'Submissions', path: '/faculty/submissions', icon: FolderCheck },
      { name: 'Facilities', path: '/facilities', icon: Building2 }, // New Facility Link
      { name: 'Email Alerts', path: '/faculty/email', icon: MessageSquare },
    ],
    [UserRole.FACULTY]: [],
    [UserRole.TRANSFEREE]: [
      // { name: 'Gateway', path: '/', icon: LayoutDashboard },
      // { name: 'Admission Form', path: '/enrollment', icon: GraduationCap },
      // { name: 'Status', path: '/status', icon: Activity },
    ],
    [UserRole.ADMIN]: [
      { name: 'System Core', path: '/', icon: LayoutDashboard },
      { name: 'Inbox', path: '/inbox', icon: MessageSquare },
      { name: 'Admissions', path: '/faculty-requests', icon: ClipboardCheck },
      { name: 'Learner Registry', path: '/masterlist', icon: Users },
      { name: 'User Control', path: '/admin/users', icon: Users },
      { name: 'Database Forge', path: '/admin/database', icon: Database },
      { name: 'Facilities', path: '/admin/facilities', icon: Building2 },
      { name: 'Email Alerts', path: '/faculty/email', icon: MessageSquare },
    ],
    [UserRole.PENDING]: []
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div className={`fixed inset-0 bg-school-navy/40 backdrop-blur-sm z-[55] lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-500 lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-lg p-1.5 overflow-hidden">
                <img src={LOGO_URL} className="w-full h-full object-contain" alt="Sto. Niño Logo" />
              </div>
              <div>
                <h1 className="font-black text-school-navy dark:text-slate-100 text-base leading-none uppercase tracking-tighter">SNES Portal</h1>
                <p className="text-school-gold text-[8px] font-black uppercase tracking-widest mt-1 leading-none">Public Unified System</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={20} /></button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
            {(menuItems[user.role] || []).map((item) => {
              const isAllowed = user.emailVerified || item.path === '/' || item.path === '/profile';
              return (
                <Link 
                  key={item.path} 
                  to={isAllowed ? item.path : '#'} 
                  onClick={(e) => {
                    if (!isAllowed) e.preventDefault();
                    else onClose();
                  }} 
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${
                    isActive(item.path) 
                      ? 'bg-school-navy text-white shadow-xl dark:bg-school-gold dark:text-school-navy' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-school-navy'
                  } ${!isAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <item.icon size={18} />
                  <span className="font-bold text-xs tracking-tight">{item.name}</span>
                  {!isAllowed && <ShieldAlert size={12} className="ml-auto text-amber-500" />}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
             <Link to="/profile" onClick={onClose} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-4 cursor-pointer group hover:bg-slate-100 transition-all">
               <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-black text-indigo-600 relative overflow-hidden">
                 <img 
                    src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : user.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${(user.role === UserRole.TEACHER || user.role === UserRole.FACULTY) ? '9f1239' : user.role === UserRole.ADMIN ? '1e293b' : user.role === UserRole.TRANSFEREE ? '064e3b' : '1A237E'}&color=fff`} 
                    className="w-full h-full object-cover" 
                    alt="PFP"
                 />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Edit size={14} className="text-white" /></div>
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-xs font-black truncate dark:text-slate-200 uppercase">{user.name.split(' ')[0]}</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{user.role}</p>
               </div>
             </Link>
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all uppercase tracking-widest"><LogOut size={16} /> Sign Out</button>
          </div>
        </div>
      </aside>
    </>
  );
};

const Header: React.FC<{ onMenuClick: () => void, user: User }> = ({ onMenuClick, user }) => {
  const { theme, setTheme, prefs, setPrefs } = useUI();
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 lg:pl-72">
      <div className="flex items-center justify-between h-20 px-6">
        <button onClick={onMenuClick} className="lg:hidden p-3 text-school-navy dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"><Menu size={24} /></button>
        <div className="hidden md:flex flex-1 max-w-xl items-center bg-slate-100 dark:bg-slate-900 rounded-2xl px-6 py-3 mx-4">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Search official records..." className="bg-transparent border-none focus:ring-0 text-sm ml-3 w-full outline-none font-medium dark:text-white" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
            <button onClick={() => setPrefs({ dyslexic: !prefs.dyslexic })} className={`p-2 rounded-xl transition-all ${prefs.dyslexic ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}><Type size={18} /></button>
            <button onClick={() => setPrefs({ highContrast: !prefs.highContrast })} className={`p-2 rounded-xl transition-all ${prefs.highContrast ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}><Eye size={18} /></button>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl ml-2">
            <button onClick={() => setTheme('light')} className={`p-2 rounded-xl transition-all ${theme === 'light' ? 'bg-white shadow-sm text-school-gold' : 'text-slate-400'}`}><Sun size={18} /></button>
            <button onClick={() => setTheme('dark')} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-800 shadow-sm text-school-gold' : 'text-slate-400'}`}><Moon size={18} /></button>
          </div>
        </div>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('app_theme') as Theme) || 'light');
  const [prefs, setPrefsState] = useState<UIPreferences>(() => ({
    dyslexic: localStorage.getItem('prefs_dyslexic') === 'true',
    highContrast: localStorage.getItem('prefs_contrast') === 'true'
  }));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('school_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        
        // MIGRATION FIX: Handle referenceNo -> id
        if (!parsedUser.id && parsedUser.referenceNo) {
            console.log("Migrating user session: referenceNo -> id");
            parsedUser.id = parsedUser.referenceNo;
            localStorage.setItem('school_user', JSON.stringify(parsedUser));
        }

        console.log("Restoring session for:", parsedUser.id);

        // Validate session with backend
        api.getUser(parsedUser.id)
          .then(validUser => {
            setUser(validUser);
            // Update local storage with fresh data
            localStorage.setItem('school_user', JSON.stringify(validUser));
          })
          .catch(err => {
            console.warn("Session expired or invalid:", err);
            localStorage.removeItem('school_user');
            setUser(null);
          })
          .finally(() => setIsSessionLoading(false));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('school_user');
        setUser(null);
        setIsSessionLoading(false);
      }
    } else {
        setIsSessionLoading(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('dyslexic-mode', prefs.dyslexic);
    document.body.classList.toggle('high-contrast-mode', prefs.highContrast);
    localStorage.setItem('app_theme', theme);
  }, [theme, prefs]);

  const setPrefs = (p: Partial<UIPreferences>) => setPrefsState(prev => ({ ...prev, ...p }));
  const handleLogin = (u: User) => { setUser(u); localStorage.setItem('school_user', JSON.stringify(u)); };
  const handleLogout = () => { localStorage.removeItem('school_user'); setUser(null); };

  useEffect(() => {
    const root = document.documentElement;
    const role = user?.role || UserRole.STUDENT;
    
    const themes = {
      [UserRole.STUDENT]: {
        navy: '#1A237E', accent: '#6366f1',
        50: '#eff6ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b'
      },
      [UserRole.TEACHER]: {
        navy: '#9f1239', accent: '#f43f5e',
        50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519'
      },
      [UserRole.FACULTY]: {
        navy: '#9f1239', accent: '#f43f5e',
        50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519'
      },
      [UserRole.ADMIN]: {
        navy: '#1e293b', accent: '#64748b',
        50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617'
      },
      [UserRole.TRANSFEREE]: {
        navy: '#064e3b', accent: '#10b981',
        50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22'
      },
      [UserRole.PENDING]: {
        navy: '#1A237E', accent: '#6366f1',
        50: '#eff6ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b'
      }
    };

    const theme = themes[role] || themes[UserRole.STUDENT];
    root.style.setProperty('--school-navy', theme.navy);
    root.style.setProperty('--school-accent', theme.accent);
    Object.entries(theme).forEach(([key, value]) => {
      if (key !== 'navy' && key !== 'accent') {
        root.style.setProperty(`--theme-${key}`, value as string);
      }
    });
  }, [user?.role]);

  if (isSessionLoading) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <UIContext.Provider value={{ theme, setTheme, prefs, setPrefs }}>
      <BrowserRouter>
        {!user ? (
          <Routes>
            <Route path="/" element={<Login onLogin={handleLogin} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : user.role === UserRole.PENDING ? (
          <PendingApproval user={user} onLogout={handleLogout} />
        ) : (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            {(!user.emailVerified && user.role !== UserRole.ADMIN) && (
              <div className="bg-amber-500 text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-widest sticky top-0 z-[60] flex items-center justify-center gap-4">
                <span>⚠ Please verify your email address to unlock all features. Check your inbox.</span>
              </div>
            )}
            <Sidebar user={user} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onLogout={handleLogout} onUpdateUser={setUser} />
            <Header onMenuClick={() => setIsSidebarOpen(true)} user={user} />
            <main className="lg:pl-72 p-6 lg:p-10 max-w-7xl mx-auto pb-24">
              <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/inbox" element={<Inbox user={user} />} />
                <Route path="/profile" element={<ProfilePage user={user} onUpdateUser={setUser} />} />
                <Route path="/schedule" element={<SchedulePage user={user} />} />
                <Route path="/grades" element={<GradesPage user={user} />} />
                <Route path="/modules" element={<ModulesPage user={user} />} />
                <Route path="/assignments" element={<AssignmentsPage user={user} />} />
                <Route path="/clearance" element={<ClearancePage user={user} />} />
                <Route path="/attendance" element={<AttendancePage user={user} />} />
                <Route path="/requests" element={<RequestDocs user={user} />} />
                <Route path="/transfer-out" element={<DropoutRequestPage user={user} />} />
                {/* <Route path="/enrollment" element={user.role === UserRole.TRANSFEREE ? <EnrollmentPage user={user} /> : <Navigate to="/" />} /> */}
                <Route path="/id-card" element={<StudentID user={user} />} />
                <Route path="/announcements" element={<FacultyAnnouncements user={user} />} />
                <Route path="/masterlist" element={[UserRole.FACULTY, UserRole.ADMIN, UserRole.TEACHER].includes(user.role) ? <Masterlist user={user} /> : <Navigate to="/" />} />
                {/* <Route path="/status" element={<TransfereeStatus user={user} />} /> */}
                <Route path="/faculty-requests" element={[UserRole.FACULTY, UserRole.ADMIN].includes(user.role) ? <FacultyRequests user={user} /> : <Navigate to="/" />} />
                <Route path="/faculty/submissions" element={[UserRole.TEACHER, UserRole.ADMIN].includes(user.role) ? <StudentSubmissions user={user} /> : <Navigate to="/" />} />
                <Route path="/faculty/email" element={[UserRole.FACULTY, UserRole.TEACHER, UserRole.ADMIN].includes(user.role) ? <FacultyEmail user={user} /> : <Navigate to="/" />} />
                <Route path="/faculty/attendance" element={[UserRole.TEACHER, UserRole.FACULTY].includes(user.role) ? <AttendanceSheet user={user} /> : <Navigate to="/" />} />
                <Route path="/admin/users" element={user.role === UserRole.ADMIN ? <AdminUserManagement /> : <Navigate to="/" />} />
                <Route path="/admin/database" element={user.role === UserRole.ADMIN ? <DatabaseViewer /> : <Navigate to="/" />} />
                <Route path="/admin/facilities" element={user.role === UserRole.ADMIN ? <AdminFacilities /> : <Navigate to="/" />} />
                <Route path="/admission" element={user.role === UserRole.ADMIN ? <SecretAdmission user={user} /> : <Navigate to="/" />} />
                <Route path="/facilities" element={<FacilitiesPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        )}
      </BrowserRouter>
    </UIContext.Provider>
  );
};

export default App;