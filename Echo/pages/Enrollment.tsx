import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { api } from '../src/api'; 
import { GraduationCap, ArrowRight, BookOpen, CheckCircle, Plus, User as UserIcon, Home, FileText } from 'lucide-react';

const EnrollmentPage: React.FC<{ user: User }> = ({ user }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    fullName: user.name, 
    email: user.email, 
    targetGrade: 'Grade 1', 
    previousSchool: '', 
    parentName: '',
    parentContact: ''
  });
  const [sf9File, setSf9File] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const data = new FormData();
      data.append('fullName', formData.fullName);
      data.append('email', formData.email);
      data.append('targetGrade', formData.targetGrade);
      data.append('previousSchool', formData.previousSchool);
      data.append('parentName', formData.parentName);
      data.append('parentContact', formData.parentContact);
      
      if (sf9File) {
          data.append('sf9', sf9File);
      }

      await api.submitApplication(data);
      setStep(3);
    } catch (error) {
      console.error("Failed to submit application:", error);
      alert("Failed to submit application.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setSf9File(e.target.files[0]);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-amber-100">
          < GraduationCap size={32} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Sto. Niño Admission</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Please fill out the form carefully to begin your elementary journey with us.</p>
      </div>

      <div className="flex justify-center mb-10">
        <div className="flex items-center gap-4">
           {[1, 2, 3].map(i => (
             <React.Fragment key={i}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${
                  step >= i ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {i}
                </div>
                {i < 3 && <div className={`w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden`}>
                  <div className={`h-full bg-amber-500 transition-all duration-500 ${step > i ? 'w-full' : 'w-0'}`}></div>
                </div>}
             </React.Fragment>
           ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm">
        {step === 1 && (
          <div className="space-y-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><UserIcon size={24}/></div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Student Profile</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Grade Level Applying For</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  value={formData.targetGrade}
                  onChange={e => setFormData({...formData, targetGrade: e.target.value})}
                >
                  {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Previous School Attended</label>
                <input 
                  type="text" required
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter school name..."
                  value={formData.previousSchool}
                  onChange={e => setFormData({...formData, previousSchool: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Parent/Guardian Full Name</label>
                <input 
                  type="text" required
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Legal Guardian name..."
                  value={formData.parentName}
                  onChange={e => setFormData({...formData, parentName: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end pt-6">
              <button onClick={() => setStep(2)} className="bg-slate-900 dark:bg-amber-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-transform shadow-xl">
                Next: Document Requirements
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><FileText size={24}/></div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Requirements Upload</h2>
            </div>
            <div className="space-y-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.doc,.docx,image/*" 
                onChange={handleFileChange} 
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`p-10 border-4 border-dashed rounded-[2.5rem] text-center transition-all cursor-pointer group ${
                    sf9File ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 hover:bg-white hover:border-amber-200'
                }`}
              >
                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors shadow-sm ${
                     sf9File ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 text-slate-300 group-hover:text-amber-500'
                 }`}>
                    {sf9File ? <CheckCircle size={32} /> : <Plus size={32} />}
                 </div>
                 <p className={`text-lg font-black uppercase tracking-tight ${sf9File ? 'text-emerald-700' : 'text-slate-700 dark:text-slate-200'}`}>
                     {sf9File ? sf9File.name : 'Upload Report Card (SF9)'}
                 </p>
                 <p className="text-xs text-slate-400 mt-2 font-bold">{sf9File ? 'File Selected' : 'LATEST RECORD FROM PREVIOUS SCHOOL'}</p>
              </div>
            </div>
            <div className="flex justify-between pt-6">
              <button onClick={() => setStep(1)} className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-800 transition-all">Back</button>
              <button 
                onClick={handleSubmit} 
                disabled={!user.emailVerified || !sf9File}
                title={!user.emailVerified ? "Please verify your email first" : !sf9File ? "Please upload your SF9" : ""}
                className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-transform shadow-xl ${(!user.emailVerified || !sf9File) ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-amber-600 text-white hover:scale-105'}`}
              >
                Submit Admission Form
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-10 space-y-8">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-in zoom-in-50 duration-500">
              <CheckCircle size={56} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Application Sent!</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium max-w-sm mx-auto">Our Registrar will review your SF9 and PSA records. Expect an update in your App Status within 48 hours.</p>
            </div>
            <div className="pt-6">
              <button onClick={() => navigate('/')} className="px-10 py-4 bg-slate-900 dark:bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollmentPage;