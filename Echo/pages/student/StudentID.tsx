import React from 'react';
import { User } from '../../types';
import { Download, Printer, ShieldCheck, Mail, Phone, MapPin, BadgeCheck, UserCheck } from 'lucide-react';
import QRCode from 'react-qr-code';

const LOGO_URL = "https://raw.githubusercontent.com/Golgrax/randompublicimagefreetouse/refs/heads/main/logo.png";

const StudentID: React.FC<{ user: User }> = ({ user }) => {
  const pfp = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1A237E&color=fff&size=512`;
  
  // Calculate School Year (e.g., June 2024 starts AY 2024-2025)
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const schoolYear = month >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  
  // Generate Data Hash
  // Format: Name|LRN|Section|SY
  const rawData = `${user.name}|${user.lrn || 'N/A'}|${user.section || 'N/A'}|${schoolYear}`;
  // Simple Base64 "Hash" for portability and basic obfuscation
  const qrHash = btoa(rawData);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-black text-school-navy dark:text-white tracking-tight uppercase">Digital Student ID</h1>
        <p className="text-slate-500 mt-2 font-medium">Official identity card for Academic Year {schoolYear}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Front of Card */}
        <div className="relative w-full aspect-auto md:aspect-[1.586/1] rounded-[3rem] bg-gradient-to-br from-school-navy via-[#283593] to-[#1A237E] text-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] p-10 overflow-hidden group hover:scale-[1.02] transition-all duration-700 border border-white/10 flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <img src={LOGO_URL} className="rotate-12 translate-x-1/4 -translate-y-1/4 w-[300px] grayscale brightness-200" alt="" />
          </div>
          
          <div className="flex items-center gap-5 mb-8 relative z-10">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl overflow-hidden shrink-0">
              <img src={LOGO_URL} className="w-full h-full object-contain" alt="Sto. Niño Logo" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter uppercase leading-none">Santo Niño</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-school-gold">Elementary School</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 relative z-10 items-end sm:items-start">
             <div className="w-32 h-32 bg-white/20 backdrop-blur-xl rounded-[2rem] border-2 border-white/30 overflow-hidden shadow-2xl relative shrink-0 mx-auto sm:mx-0">
               <img 
                src={pfp} 
                alt="Student Photo" 
                className="w-full h-full object-cover"
               />
               {!user.avatar && (
                 <div className="absolute inset-0 flex items-center justify-center bg-school-navy/40">
                   <p className="text-[8px] font-black uppercase text-white/60 tracking-widest text-center px-4">Official Learner View</p>
                 </div>
               )}
             </div>
             <div className="flex-1 flex flex-col justify-end pb-2 w-full text-center sm:text-left">
                <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-school-gold">Active Student</p>
                  <BadgeCheck size={14} className="text-emerald-400" />
                </div>
                <h3 className="text-3xl font-black tracking-tight leading-none uppercase mb-2">{user.name}</h3>
                <p className="text-sm font-bold text-white/60 uppercase tracking-widest">{user.gradeLevel || 'Grade 4'} - {user.section || 'Sampaguita'}</p>
                
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-[9px] font-black uppercase text-white/40 mb-1">Learner No. (LRN)</p>
                  <p className="text-xl font-black tracking-widest text-school-gold">{user.lrn || '2024-SNES-0000'}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Back of Card / QR Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-12 shadow-sm flex flex-col items-center text-center">
          <div className="p-6 bg-white rounded-[2.5rem] mb-8 shadow-inner border border-slate-100 relative overflow-hidden group">
             <QRCode 
              value={qrHash} 
              size={180} 
              fgColor="#1A237E" 
              bgColor="#FFFFFF"
              level="H"
             />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-school-navy dark:text-school-gold mb-8">Scan to Authenticate</p>
          
          <div className="w-full space-y-4 text-left mb-10">
            <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
              <Mail className="text-slate-400" size={20} />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{user.email}</p>
            </div>
            <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
              <MapPin className="text-slate-400" size={20} />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{user.address || 'Sto. Niño Village, Ph'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button className="flex items-center justify-center gap-3 py-4.5 bg-school-navy text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 active:scale-95 transition-all shadow-xl shadow-school-navy/10">
              <Download size={18} /> Download
            </button>
            <button className="flex items-center justify-center gap-3 py-4.5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all">
              <Printer size={18} /> Print Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentID;