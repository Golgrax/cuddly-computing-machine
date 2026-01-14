
import React, { useState, useEffect } from 'react';
import { User, UserRole, LockoutInfo } from '../types';
import { 
  ArrowRight, ShieldCheck, GraduationCap, 
  User as UserIcon, Key, ChevronRight,
  ShieldAlert, UserPlus, Presentation, 
  Mail, Clock, ShieldBan
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUI } from '../App';
import { api } from '../src/api';

interface LoginProps {
  onLogin: (user: User) => void;
}

const LOGO_URL = "https://raw.githubusercontent.com/Golgrax/randompublicimagefreetouse/refs/heads/main/logo.png";
const BG_URL = "https://raw.githubusercontent.com/Golgrax/randompublicimagefreetouse/refs/heads/main/login-background.png";

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockout, setLockout] = useState<LockoutInfo | null>(null);
  const [hasPendingApp, setHasPendingApp] = useState(false);

  useEffect(() => {
    setLockout(api.getLockoutInfo());
    
    // Check for existing pending application on this device
    const pendingApp = localStorage.getItem('pending_application');
    if (pendingApp) {
        const timestamp = parseInt(pendingApp, 10);
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (now - timestamp < oneDay) {
            setHasPendingApp(true);
        } else {
            localStorage.removeItem('pending_application'); // Expired
        }
    }
  }, []);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignup) {
        if (hasPendingApp) {
            setError("You have a pending application. Only one account per device is allowed until approved or 24h passes.");
            setIsLoading(false);
            return;
        }
        // If Applicant (Transferee), use that role. Otherwise use PENDING for Student/Teacher approval.
        // Actually, logic: Students/Teachers need approval (PENDING). Applicants need to fill form (TRANSFEREE).
        // If selectedRole is TRANSFEREE, use it. Else PENDING.
        const signupRole = selectedRole === UserRole.TRANSFEREE ? UserRole.TRANSFEREE : UserRole.PENDING;
        
        const user = await api.signup(name, email, password, signupRole);
        localStorage.setItem('pending_application', Date.now().toString());
        onLogin(user);
      } else {
        const user = await api.login(email, password);
        if (user) {
          if (user.role !== selectedRole && user.role !== UserRole.ADMIN && user.role !== UserRole.PENDING) {
             setError(`Invalid credentials for ${selectedRole} portal.`);
          } else {
            if (user.role !== UserRole.PENDING) {
                localStorage.removeItem('pending_application'); // Approved, clear restriction
            }
            onLogin(user);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Connection error. Please try again.');
      setLockout(api.getLockoutInfo());
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { id: UserRole.STUDENT, title: 'Students', desc: 'View grades & modules', icon: <GraduationCap size={32} />, color: 'from-indigo-600 to-blue-700' },
    { id: UserRole.TEACHER, title: 'Teachers', desc: 'Manage sections & grading', icon: <Presentation size={32} />, color: 'from-cyan-600 to-blue-700' },
    { id: UserRole.TRANSFEREE, title: 'Applicants', desc: 'New student registration', icon: <UserPlus size={32} />, color: 'from-emerald-600 to-teal-700' },
    { id: UserRole.ADMIN, title: 'Admin', desc: 'System setup & control', icon: <ShieldAlert size={32} />, color: 'from-rose-600 to-red-800' }
  ];

  const isSuspended = lockout?.suspendedUntil && Date.now() < lockout.suspendedUntil;
  const currentRoleConfig = roles.find(r => r.id === selectedRole);

  return (
    <div 
      className="min-h-screen w-full bg-cover bg-center bg-fixed relative flex items-center justify-center overflow-hidden transition-all duration-700"
      style={{ backgroundImage: `url('${BG_URL}')` }}
    >
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[3px] transition-all duration-700"></div>

      <div className="w-full h-full relative z-10">
        {!selectedRole ? (
          <div className="min-h-screen flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-1000">
            <div className="w-full max-w-6xl space-y-12">
              <div className="text-center space-y-4">
                <div className="w-32 h-32 bg-white p-2 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(255,255,255,0.15)] animate-float overflow-hidden">
                  <img src={LOGO_URL} alt="Sto. Niño Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-2xl">
                  Sto. Niño <br className="md:hidden"/> <span className="text-school-gold">Portal</span>
                </h1>
                <p className="text-white/60 font-bold uppercase tracking-[0.4em] text-[10px]">Unified Academic Access System</p>
              </div>

              <div className="flex flex-wrap justify-center gap-4 px-4 w-full max-w-full mx-auto">
                {roles.map(role => (
                  <button 
                    key={role.id}
                    onClick={() => { setSelectedRole(role.id); setIsSignup(false); setError(''); }}
                    className="p-6 w-full md:w-56 lg:w-60 rounded-[2.5rem] border-2 border-white/10 hover:border-school-gold hover:scale-[1.05] hover:-translate-y-2 transition-all group text-left shadow-2xl flex flex-col items-start relative overflow-hidden bg-white/10 backdrop-blur-xl"
                  >
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/20 rounded-full opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className={`w-16 h-16 bg-gradient-to-br ${role.color} text-white rounded-2xl flex items-center justify-center mb-8 shadow-xl`}>
                      {role.icon}
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">{role.title}</h3>
                    <p className="text-[11px] text-white/60 font-semibold leading-relaxed mb-8">{role.desc}</p>
                    <div className="mt-auto flex items-center gap-2 text-school-gold font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Open Portal <ChevronRight size={14} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-screen flex flex-col md:flex-row animate-in slide-in-from-right duration-500 overflow-hidden">
            <div className={`md:w-5/12 relative bg-gradient-to-br ${currentRoleConfig?.color} bg-opacity-90 flex flex-col justify-center p-12 lg:p-24 text-white overflow-hidden shadow-2xl`}>
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                 <img src={LOGO_URL} className="absolute -bottom-40 -right-40 rotate-12 w-[600px] grayscale brightness-200" alt="" />
              </div>
              <div className="relative z-10">
                <button onClick={() => setSelectedRole(null)} className="text-white/60 hover:text-white font-bold text-xs flex items-center gap-2 mb-16 transition-colors uppercase tracking-widest group">
                  <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={18} /> Exit Portal
                </button>
                <div className="w-24 h-24 bg-white p-3 rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl animate-float overflow-hidden">
                   <img src={LOGO_URL} alt="Sto. Niño Logo" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mb-8">
                  {selectedRole.toLowerCase()} <br/> Authorization
                </h2>
                <p className="text-xl text-white/80 font-medium max-w-sm leading-relaxed">
                  Protecting learner records and institutional integrity. Identity verification is required.
                </p>
              </div>
            </div>

            <div className="md:w-7/12 flex items-center justify-center p-8 lg:p-24">
              <div className="w-full max-w-md space-y-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-school-gold" size={32} />
                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase">
                      {isSignup ? 'Create Profile' : 'Authenticate'}
                    </h3>
                  </div>
                  <p className="text-white/50 font-medium text-lg">
                    {isSignup ? 'Register for your official school identity.' : 'Provide your secured credentials below.'}
                  </p>
                </div>

                {isSuspended ? (
                  <div className="p-10 bg-rose-500/10 border-2 border-rose-500/20 backdrop-blur-xl rounded-[3rem] text-center space-y-6 animate-in zoom-in-95">
                     <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-500">
                        <ShieldBan size={40} />
                     </div>
                     <h4 className="text-xl font-black text-rose-400 uppercase tracking-tight">Security Lockout</h4>
                     <p className="text-sm font-bold text-rose-300 leading-relaxed">
                       Access from this device has been suspended for 10 hours after 3 incorrect attempts.
                     </p>
                     <div className="flex items-center justify-center gap-2 text-rose-400 font-black text-xs uppercase tracking-widest bg-rose-500/10 py-3 rounded-2xl">
                       <Clock size={16} /> Restricted Access
                     </div>
                     <button onClick={() => setSelectedRole(null)} className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-rose-400 transition-colors">Return to Menu</button>
                  </div>
                ) : (
                  <form className="space-y-8" onSubmit={handleAction}>
                    {error && (
                      <div className="bg-rose-500/10 text-rose-400 px-8 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest border-2 border-rose-500/20 flex items-center gap-4 animate-shake">
                        <ShieldAlert size={20} className="shrink-0" /> {error}
                      </div>
                    )}
                    
                    {isSignup && (
                      <div className="space-y-3">
                        <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-white/40 ml-3">Legal Name</label>
                        <div className="relative flex items-center">
                          <UserIcon className="absolute left-6 text-white/20" size={24} />
                          <input 
                            type="text" required value={name} onChange={(e) => setName(e.target.value)}
                            className="w-full pl-16 pr-8 py-6 rounded-[2rem] bg-white/5 backdrop-blur-xl border-2 border-white/5 focus:border-school-gold outline-none font-bold text-white shadow-xl transition-all"
                            placeholder="Juan Dela Cruz"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-white/40 ml-3">System Email</label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-6 text-white/20" size={24} />
                        <input 
                          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-16 pr-8 py-6 rounded-[2rem] bg-white/5 backdrop-blur-xl border-2 border-white/5 focus:border-school-gold outline-none font-bold text-white shadow-xl transition-all"
                          placeholder="yourname@gmail.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-3">
                        <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Security Key</label>
                        <Link to="/forgot-password" title="Recover Account" className="text-[10px] font-black uppercase text-school-gold tracking-widest opacity-60 hover:opacity-100">Forgot?</Link>
                      </div>
                      <div className="relative flex items-center">
                        <Key className="absolute left-6 text-white/20" size={24} />
                        <input 
                          type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-16 pr-8 py-6 rounded-[2rem] bg-white/5 backdrop-blur-xl border-2 border-white/5 focus:border-school-gold outline-none font-bold text-white shadow-xl transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <button 
                      disabled={isLoading}
                      className="w-full bg-white text-slate-900 font-black py-6 rounded-[2rem] hover:bg-school-gold hover:text-school-navy transition-all flex items-center justify-center gap-4 group uppercase tracking-[0.2em] text-xs shadow-2xl disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : isSignup ? 'Create Profile' : 'Authenticate Device'}
                      {!isLoading && <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />}
                    </button>

                    <div className="text-center pt-6">
                       <button 
                        type="button" 
                        onClick={() => { setIsSignup(!isSignup); setError(''); }}
                        className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-school-gold transition-colors"
                       >
                         {isSignup ? 'Already registered? Login' : 'No account? Create profile'}
                       </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
