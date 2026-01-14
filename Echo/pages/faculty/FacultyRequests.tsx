import React, { useState, useEffect } from 'react';
import { User, DropoutRequest, EnrollmentApplication, UserRole } from '../../types';
import { api } from '../../src/api'; // Changed from mockApiService
import { Check, X, ShieldAlert, GraduationCap, User as UserIcon, Clock, Filter, CheckCircle2, Loader2, FileText, Eye } from 'lucide-react';

const FacultyRequests: React.FC<{ user: User }> = ({ user }) => {
  const [dropouts, setDropouts] = useState<DropoutRequest[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dropout' | 'enrollment'>('enrollment');

  const load = async () => {
    setLoading(true);
    try {
      const [d, e] = await Promise.all([
        api.getDropoutRequests(),
        api.getEnrollmentApplications()
      ]);
      setDropouts(d);
      setEnrollments(e);
    } catch (error) {
      console.error("Failed to load requests:", error);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApproveAdmission = async (id: string, email: string) => {
    setProcessing(id);
    try {
      await api.updateEnrollmentStatus(id, 'approved');
      const users = await api.getUsers();
      const applicantUser = users.find((u: User) => u.email === email);
      if (applicantUser) {
        await api.updateUser(applicantUser.id, { role: UserRole.STUDENT });
      }
      load();
    } catch (error) {
      console.error("Failed to approve admission:", error);
      alert("Failed to approve admission.");
    }
    setProcessing(null);
  };

  const handleRejectAdmission = async (id: string) => {
    if (!confirm('Are you sure you want to reject this admission request?')) return;
    setProcessing(id);
    try {
      await api.updateEnrollmentStatus(id, 'rejected');
      load();
    } catch (error) {
      console.error("Failed to reject admission:", error);
      alert("Failed to reject admission.");
    }
    setProcessing(null);
  };

  const handleApproveDropout = async (id: string) => {
    setProcessing(id);
    try {
      await api.updateDropoutStatus(id, 'approved');
      load();
    } catch (error) {
      console.error("Failed to approve dropout:", error);
      alert("Failed to approve dropout.");
    }
    setProcessing(null);
  };

  const handleRejectDropout = async (id: string) => {
    if (!confirm('Are you sure you want to reject this dropout request?')) return;
    setProcessing(id);
    try {
      await api.updateDropoutStatus(id, 'rejected');
      load();
    } catch (error) {
      console.error("Failed to reject dropout:", error);
      alert("Failed to reject dropout.");
    }
    setProcessing(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-school-navy" size={40} />
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Requests Hub</h1>
        <p className="text-slate-500 mt-2 font-medium">Process admissions and withdrawal requests for SNES.</p>
      </div>

      <div className="flex gap-4 p-1.5 bg-slate-100 dark:bg-slate-900 w-fit rounded-[2rem]">
         <button 
           onClick={() => setActiveTab('enrollment')}
           className={`px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'enrollment' ? 'bg-white dark:bg-slate-800 text-school-navy dark:text-school-gold shadow-sm' : 'text-slate-400'}`}
         >
           <GraduationCap size={18} /> New Admissions
         </button>
         <button 
           onClick={() => setActiveTab('dropout')}
           className={`px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'dropout' ? 'bg-white dark:bg-slate-800 text-school-navy dark:text-school-gold shadow-sm' : 'text-slate-400'}`}
         >
           <ShieldAlert size={18} /> Withdrawal Requests
         </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'enrollment' ? (
          enrollments.length > 0 ? enrollments.map(app => (
            <div key={app.id} className={`p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-sm flex flex-col md:flex-row gap-8 items-center transition-opacity ${app.status !== 'pending' ? 'opacity-50' : ''}`}>
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0">
                <GraduationCap size={32} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{app.fullName}</h3>
                   <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${
                     app.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                     app.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                     'bg-amber-50 text-amber-600'
                   }`}>
                     {app.status === 'approved' ? 'Enrolled' : app.status === 'rejected' ? 'Rejected' : `Applying for ${app.targetGrade}`}
                   </span>
                </div>
                <p className="text-sm text-slate-500 font-medium">Previous: <span className="font-bold text-slate-800 dark:text-slate-200">{app.previousSchool}</span></p>
                {app.sf9Path && (
                    <a 
                      href={app.sf9Path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      <FileText size={14} /> View Submitted SF9
                    </a>
                )}
              </div>
              <div className="flex gap-3">
                 {app.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleRejectAdmission(app.id)}
                        disabled={!!processing}
                        className="px-6 py-4 bg-rose-100 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-200 transition-all disabled:opacity-50"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                      <button 
                        onClick={() => handleApproveAdmission(app.id, app.email)}
                        disabled={!!processing}
                        className="px-8 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 dark:shadow-none hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-3"
                      >
                        {processing === app.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        Approve Admission
                      </button>
                    </>
                 ) : (
                    <span className={`font-black text-xs uppercase tracking-widest flex items-center gap-2 ${app.status === 'approved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      <CheckCircle2 size={18} /> {app.status === 'approved' ? 'Processed' : 'Rejected'}
                    </span>
                 )}
              </div>
            </div>
          )) : <EmptyState icon={<GraduationCap size={48}/>} label="No admission requests found" />
        ) : (
           dropouts.length > 0 ? dropouts.map(req => (
            <div key={req.id} className={`p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-sm flex flex-col md:flex-row gap-8 items-center transition-opacity ${req.status !== 'pending' ? 'opacity-50' : ''}`}>
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600 flex-shrink-0">
                <ShieldAlert size={32} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{req.studentName}</h3>
                   <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${
                     req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                     req.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                     'bg-rose-50 text-rose-600'
                   }`}>
                     {req.status}
                   </span>
                </div>
                <p className="text-sm text-slate-500 font-medium">Reason: <span className="font-bold text-slate-800 dark:text-slate-200">{req.reason}</span></p>
              </div>
              <div className="flex gap-3">
                 {req.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleRejectDropout(req.id)}
                        disabled={!!processing}
                        className="px-6 py-4 bg-rose-100 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-200 transition-all disabled:opacity-50"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                      <button 
                        onClick={() => handleApproveDropout(req.id)}
                        disabled={!!processing}
                        className="px-8 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 dark:shadow-none hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-3"
                      >
                        {processing === req.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        Approve Dropout
                      </button>
                    </>
                 ) : (
                    <span className={`font-black text-xs uppercase tracking-widest flex items-center gap-2 ${req.status === 'approved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      <CheckCircle2 size={18} /> {req.status === 'approved' ? 'Processed' : 'Rejected'}
                    </span>
                 )}
              </div>
            </div>
          )) : <EmptyState icon={<ShieldAlert size={48}/>} label="No withdrawal requests found" />
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="p-32 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[4rem]">
     <div className="text-slate-200 dark:text-slate-700 mb-6 flex justify-center">{icon}</div>
     <p className="text-slate-400 font-black uppercase text-sm tracking-widest">{label}</p>
  </div>
);

export default FacultyRequests;