import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { api } from '../src/api'; 
import { 
  User as UserIcon, Mail, Phone, MapPin, 
  ShieldCheck, Heart, Award, Edit3, 
  Save, X, Camera, BadgeCheck, 
  UserCircle, FileText, PhoneCall, Info,
  History, GraduationCap, QrCode as QrIcon,
  CheckCircle2, AlertCircle, UserCheck, Loader2, Image as ImageIcon
} from 'lucide-react';
import QRCode from 'react-qr-code';

const ProfilePage: React.FC<{ user: User, onUpdateUser: (u: User) => void }> = ({ user, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Calculate School Year
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); 
  const schoolYear = month >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  
  // QR Data
  const qrHash = btoa(`${user.name}|${user.lrn || 'N/A'}|${user.section || 'N/A'}|${schoolYear}`);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.updateUser(user.id, formData);
      onUpdateUser(formData);
      // Sync with localStorage
      localStorage.setItem('school_user', JSON.stringify(formData));
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile.");
    }
    setLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setLoading(true);
          try {
              const res = await api.uploadAvatar(user.id, e.target.files[0]);
              const newAvatarUrl = res.avatarUrl;
              setFormData(prev => ({ ...prev, avatar: newAvatarUrl })); 
              onUpdateUser({ ...user, avatar: newAvatarUrl }); // Update global user state immediately
              localStorage.setItem('school_user', JSON.stringify({ ...user, avatar: newAvatarUrl }));
          } catch (err) {
              console.error("Upload failed", err);
              alert("Failed to upload image.");
          } finally {
              setLoading(false);
              // Reset file input so the same file can be selected again if needed
              if (fileInputRef.current) {
                  fileInputRef.current.value = '';
              }
          }
      }
  };

  // Parse dynamic data
  let academicHistory: { year: string; grade: string; school: string }[] = [];
  try {
      if ((user as any).academicHistory) {
          academicHistory = typeof (user as any).academicHistory === 'string' ? JSON.parse((user as any).academicHistory) : (user as any).academicHistory;
      }
  } catch (e) { console.error("Failed to parse academic history", e); }

  let requirements: Record<string, boolean> = {};
  try {
      if ((user as any).requirements) {
          requirements = typeof (user as any).requirements === 'string' ? JSON.parse((user as any).requirements) : (user as any).requirements;
      }
  } catch (e) { console.error("Failed to parse requirements", e); }

  // Append timestamp to force refresh if avatar exists
  const pfpRaw = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1A237E&color=fff&size=512`;
  const pfp = user.avatar ? `${pfpRaw}?t=${Date.now()}` : pfpRaw;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
      {/* Hidden File Input for Camera Button */}
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl">
         <div className="h-40 bg-gradient-to-r from-school-navy via-indigo-900 to-slate-900 relative">
            <div className="absolute -bottom-16 left-12">
               <div className="w-36 h-36 rounded-[2.5rem] bg-white dark:bg-slate-800 border-8 border-white dark:border-slate-900 shadow-2xl relative overflow-hidden group">
                  <img 
                    src={pfp} 
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Change Profile Picture"
                  >
                    <Camera className="text-white" size={24} />
                  </button>
               </div>
            </div>
            <div className="absolute bottom-6 right-12 flex gap-3">
               <button 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={loading}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 ${isEditing ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900'} disabled:opacity-50`}
               >
                 {loading ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? <><Save size={16}/> Save Changes</> : <><Edit3 size={16}/> Edit Identity</>)}
               </button>
               {isEditing && (
                 <button 
                  onClick={() => { setIsEditing(false); setFormData({...user}); }}
                  className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20"
                 >
                   Cancel
                 </button>
               )}
            </div>
         </div>
         
         <div className="pt-20 px-12 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-10">
               <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{user.name}</h1>
                    {user.psaStatus === 'Verified' && <BadgeCheck className="text-indigo-600" size={32} />}
                  </div>
                  <div className="flex flex-wrap gap-5 items-center">
                    <span className="px-5 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                      {user.role}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <FileText size={14} className="text-slate-300" /> LRN: <span className="text-slate-900 dark:text-slate-200">{user.lrn}</span>
                    </div>
                    <span className="text-slate-200">|</span>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <GraduationCap size={14} className="text-slate-300" /> {user.gradeLevel} - {user.section}
                    </div>
                  </div>
               </div>
               
               <div className="flex flex-wrap gap-8">
                 <MiniStat label="Avg Attendance" value={`${user.attendanceRate || 0}%`} />
                 <MiniStat label="General Average" value={user.gwa ? user.gwa.toFixed(2) : 'N/A'} />
                 <div className="flex flex-col items-start">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Identity Status</p>
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${user.psaStatus === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {user.psaStatus || 'Unverified'}
                    </span>
                 </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact & Personal Information */}
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
             <h3 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter">
               <UserCircle className="text-indigo-600" /> Profile Metadata
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <InfoItem 
                  icon={<Mail/>} label="Institutional Email" 
                  value={user.email} isEditing={false} 
                />
                <InfoItem 
                  icon={<Phone/>} label="Mobile Contact" 
                  value={formData.phone || 'N/A'} 
                  isEditing={isEditing} 
                  onChange={(v) => setFormData({...formData, phone: v})}
                />
                <InfoItem 
                  icon={<MapPin/>} label="Home Address" 
                  value={formData.address || 'N/A'} 
                  isEditing={isEditing} 
                  onChange={(v) => setFormData({...formData, address: v})}
                />
                <InfoItem 
                  icon={<FileText/>} label="Birth Date" 
                  value={formData.birthDate || 'N/A'} 
                  isEditing={isEditing} 
                  onChange={(v) => setFormData({...formData, birthDate: v})}
                />
                {isEditing && (
                  <div className="md:col-span-2">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-1 ml-2">
                           <div className="text-slate-400"><ImageIcon size={14} /></div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profile Picture Upload</p>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="w-full px-7 py-4.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-sm transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                  setLoading(true);
                                  try {
                                      const res = await api.uploadAvatar(user.id, e.target.files[0]);
                                      const newAvatarUrl = res.avatarUrl;
                                      setFormData(prev => ({ ...prev, avatar: newAvatarUrl })); 
                                      onUpdateUser({ ...user, avatar: newAvatarUrl }); // Update global user state immediately
                                      localStorage.setItem('school_user', JSON.stringify({ ...user, avatar: newAvatarUrl }));
                                  } catch (err) {
                                      console.error("Upload failed", err);
                                      alert("Failed to upload image.");
                                  } finally {
                                      setLoading(false);
                                      // Reset file input so the same file can be selected again if needed
                                      if (fileInputRef.current) {
                                          fileInputRef.current.value = '';
                                      }
                                  }
                              }
                          }}
                        />
                        <p className="text-[9px] font-bold text-slate-400 ml-4">Max size: 5MB. Auto-compressed to &lt;20KB.</p>
                    </div>
                  </div>
                )}
             </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm">
             <h3 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter">
               <PhoneCall className="text-indigo-600" /> Parent / Guardian
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <InfoItem 
                  icon={<UserIcon/>} label="Full Name" 
                  value={formData.guardianName || 'N/A'} 
                  isEditing={isEditing} 
                  onChange={(v) => setFormData({...formData, guardianName: v})}
                />
                <InfoItem 
                  icon={<Phone/>} label="Emergency Phone" 
                  value={formData.guardianPhone || 'N/A'} 
                  isEditing={isEditing} 
                  onChange={(v) => setFormData({...formData, guardianPhone: v})}
                />
             </div>
          </section>

          {/* Academic History (SF10 Data) */}
          <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm">
             <h3 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter">
               <History className="text-indigo-600" /> Learner History (SF10)
             </h3>
             <div className="space-y-4">
                {academicHistory.length > 0 ? academicHistory.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-transparent hover:border-slate-100 transition-all">
                     <div className="flex items-center gap-5">
                        <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center font-black text-indigo-600 text-xs shadow-sm">
                          {item.grade.split(' ')[1] || 'N/A'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{item.grade}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{item.school}</p>
                        </div>
                     </div>
                     <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-lg">
                       {item.year}
                     </span>
                  </div>
                )) : (
                  <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                     <History size={32} className="mb-4 opacity-50" />
                     <p className="text-xs font-black uppercase tracking-widest">No academic history records found</p>
                  </div>
                )}
             </div>
          </section>
        </div>

        {/* Sidebar Features */}
        <div className="space-y-10">
          {/* Security QR Code */}
          <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm text-center relative group overflow-hidden">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Identity Verification</h3>
             <div className="p-6 bg-white rounded-[2.5rem] inline-block mb-6 shadow-inner border border-slate-100 relative overflow-hidden">
                <QRCode 
                  value={qrHash} 
                  size={140} 
                  fgColor="#1A237E" 
                  bgColor="#FFFFFF"
                  level="H"
                />
             </div>
             <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-relaxed">
               Hover to preview identity. <br/> System ID: SNES-{user.lrn?.slice(-4)}
             </p>
          </section>

          {/* Documents Verified */}
          <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm">
             <h3 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter">
               <ShieldCheck className="text-indigo-600" /> Requirements Checklist
             </h3>
             <div className="space-y-3">
                <DocStatus label="PSA Birth Certificate" status={user.psaStatus === 'Verified'} />
                <DocStatus label="SF9 (Report Card)" status={!!requirements['SF9']} />
                <DocStatus label="Good Moral Certificate" status={!!requirements['Good Moral']} />
                <DocStatus label="School Clearance" status={!!requirements['Clearance']} />
             </div>
          </section>

          <section className="bg-school-navy p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
             <Award className="absolute top-0 right-0 p-8 text-white/5 -rotate-12 translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform" size={220} />
             <h3 className="font-black text-white flex items-center gap-3 mb-8 relative z-10">
               <ShieldCheck size={24} className="text-school-gold" />
               Institution Info
             </h3>
             <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between p-5 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
                   <span className="text-[10px] font-black uppercase tracking-widest">Enrolled Status</span>
                   <span className="text-[10px] font-black uppercase text-emerald-400">
                     {user.status === 'active' ? 'Official' : user.status === 'completed' ? 'Alumni' : 'Pending/Dropped'}
                   </span>
                </div>
                <div className="flex items-center justify-between p-5 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
                   <span className="text-[10px] font-black uppercase tracking-widest">4Ps Beneficiary</span>
                   <span className={`text-[10px] font-black uppercase ${user.is4Ps ? 'text-emerald-400' : 'text-white/40'}`}>
                     {user.is4Ps ? 'Active' : 'Not Enrolled'}
                   </span>
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col items-start">
    <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">{label}</p>
    <p className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{value}</p>
  </div>
);

const DocStatus = ({ label, status }: { label: string, status: boolean }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
     <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
     {status ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-amber-500" />}
  </div>
);

const InfoItem = ({ icon, label, value, isEditing, onChange }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  isEditing: boolean,
  onChange?: (v: string) => void 
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-1 ml-2">
       <div className="text-slate-400">{React.cloneElement(icon as React.ReactElement<any>, { size: 14 })}</div>
       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    </div>
    {isEditing ? (
      <input 
        type="text" 
        className="w-full px-7 py-4.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-sm transition-all"
        value={value === 'N/A' ? '' : value}
        onChange={e => onChange?.(e.target.value)}
      />
    ) : (
      <div className="px-7 py-4.5 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl font-black text-sm text-slate-800 dark:text-slate-200">
        {value}
      </div>
    )}
  </div>
);

export default ProfilePage;