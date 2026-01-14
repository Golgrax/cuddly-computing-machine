import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { api } from '../../src/api'; 
import { 
  Search, MessageSquare, ShieldAlert, Edit, Eye,
  Presentation, LayoutGrid, CheckCircle2, AlertCircle, Heart, Filter,
  Save, X, User as UserIcon, Phone, MapPin, GraduationCap, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Masterlist: React.FC<{ user: User }> = ({ user }) => {
  // Parse sections safely
  let assignedSections: string[] = [];
  try {
      if (user.assignedSections) {
          assignedSections = typeof user.assignedSections === 'string' 
              ? JSON.parse(user.assignedSections) 
              : user.assignedSections;
      }
  } catch (e) { console.error("Failed to parse assigned sections", e); }

  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>(assignedSections[0] || 'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [show4PsOnly, setShow4PsOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed'>('active');
  const navigate = useNavigate();

  // Management Modal State
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers(user.role === UserRole.TEACHER ? activeSection : 'All');
      setStudents(data.filter((u: User) => u.role === UserRole.STUDENT));
    } catch (error) {
      console.error("Failed to load students:", error);
    }
    setLoading(false);
  };

  useEffect(() => { loadStudents(); }, [activeSection]);

  const handleMarkDone = async (id: string, name: string) => {
      if (confirm(`Mark ${name} as fully processed/completed for this term?`)) {
          try {
              await api.updateUser(id, { status: 'completed' });
              loadStudents();
          } catch (error) {
              console.error("Failed to update status:", error);
              alert("Failed to update status.");
          }
      }
  };

  const handleDropStudent = async (id: string, name: string) => {
    if (confirm(`ADMIN ACTION: Officially drop ${name} from the school registry?`)) {
      try {
        await api.deleteUser(id);
        loadStudents();
      } catch (error) {
        console.error("Failed to drop student:", error);
        alert("Failed to drop student.");
      }
    }
  };

  const handleMessage = (email: string) => {
      navigate('/faculty/email', { state: { recipientEmail: email } });
  };

  const openEditModal = (student: User) => {
      setEditingStudent(student);
      setEditForm({ ...student });
  };

  const handleSaveChanges = async () => {
      if (!editingStudent || !editForm) return;
      setIsSaving(true);
      try {
          await api.updateUser(editingStudent.id, editForm);
          setEditingStudent(null);
          loadStudents(); // Refresh list
      } catch (error) {
          console.error("Failed to update student:", error);
          alert("Failed to update student record.");
      }
      setIsSaving(false);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (s.lrn && s.lrn.includes(searchTerm));
    const matches4Ps = show4PsOnly ? s.is4Ps : true;
    const matchesStatus = (s.status || 'active') === statusFilter;
    return matchesSearch && matches4Ps && matchesStatus;
  });

  if (loading) return <div className="p-20 flex justify-center"><LayoutGrid className="animate-spin text-school-navy" size={40} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Registry (SF1)</h1>
          <p className="text-slate-500 mt-2 font-medium">Monitoring enrolled learners and LRN identity records.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-[2rem]">
             <button 
               onClick={() => setStatusFilter('active')}
               className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'active' ? 'bg-white dark:bg-slate-800 text-school-navy dark:text-white shadow-sm' : 'text-slate-400'}`}
             >
               Active
             </button>
             <button 
               onClick={() => setStatusFilter('completed')}
               className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'completed' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
             >
               Done
             </button>
          </div>
          <div className="relative">
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
              type="text" 
              placeholder="Search LRN or Name..."
              className="pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none shadow-sm w-full sm:w-64"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
          <button 
            onClick={() => setShow4PsOnly(!show4PsOnly)}
            className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
              show4PsOnly ? 'bg-rose-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Heart size={16} /> {show4PsOnly ? '4Ps Only' : 'Filter 4Ps'}
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-[2rem] w-fit">
        <button 
          onClick={() => setActiveSection('All')}
          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === 'All' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
        >
          All Students
        </button>
        {assignedSections.map(sec => (
          <button 
            key={sec}
            onClick={() => setActiveSection(sec)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === sec ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            {sec}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Information</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">LRN</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center font-black overflow-hidden">
                        {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" alt="" /> : student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 dark:text-slate-100 text-lg leading-tight uppercase tracking-tight">{student.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{student.gradeLevel} - {student.section}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 tracking-widest">{student.lrn}</td>
                  <td className="px-8 py-8">
                     <div className="flex flex-col gap-2 items-start">
                       {student.is4Ps && (
                         <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                           <Heart size={10} /> 4Ps Beneficiary
                         </span>
                       )}
                       {student.feedingProgramStatus === 'Beneficiary' && (
                         <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                           <CheckCircle2 size={10} /> Feeding Program
                         </span>
                       )}
                       {!student.is4Ps && student.feedingProgramStatus !== 'Beneficiary' && (
                         <span className="text-slate-300 text-[9px] font-black uppercase">Regular Status</span>
                       )}
                     </div>
                  </td>
                  <td className="px-8 py-8 text-right">
                     <div className="flex justify-end gap-2">
                       <button 
                        onClick={() => openEditModal(student)}
                        className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all"
                        title="Manage Student Record"
                       >
                         <Edit size={18}/>
                       </button>
                       <button 
                        onClick={() => handleMessage(student.email)}
                        className="p-3 text-slate-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-2xl transition-all"
                        title="Send Official Email"
                       >
                         <MessageSquare size={18}/>
                       </button>
                       {(user.role === UserRole.ADMIN || user.role === UserRole.FACULTY) && (
                         <button 
                          onClick={() => handleDropStudent(student.id, student.name)}
                          className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all"
                          title="Drop from Registry"
                         >
                           <ShieldAlert size={18}/>
                         </button>
                       )}
                     </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-32 text-center">
                    <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No matching learners found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                     <Edit size={24} />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Manage Record</h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">SF1 Database Entry</p>
                   </div>
                </div>
                <button onClick={() => setEditingStudent(null)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Learner Identity</h4>
                    <div className="space-y-3">
                       <label className="block text-[10px] font-black uppercase text-slate-400 ml-2">Full Name</label>
                       <input 
                        type="text" 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                        value={editForm.name || ''}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="block text-[10px] font-black uppercase text-slate-400 ml-2">Learner Ref No. (LRN)</label>
                       <input 
                        type="text" 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 font-mono tracking-widest"
                        value={editForm.lrn || ''}
                        onChange={e => setEditForm({...editForm, lrn: e.target.value})}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-3">
                          <label className="block text-[10px] font-black uppercase text-slate-400 ml-2">Grade Level</label>
                          <input 
                            type="text" 
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                            value={editForm.gradeLevel || ''}
                            onChange={e => setEditForm({...editForm, gradeLevel: e.target.value})}
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="block text-[10px] font-black uppercase text-slate-400 ml-2">Section</label>
                          <input 
                            type="text" 
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                            value={editForm.section || ''}
                            onChange={e => setEditForm({...editForm, section: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Contact & Status</h4>
                    <div className="space-y-3">
                       <label className="block text-[10px] font-black uppercase text-slate-400 ml-2">Guardian Name</label>
                       <input 
                        type="text" 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                        value={editForm.guardianName || ''}
                        onChange={e => setEditForm({...editForm, guardianName: e.target.value})}
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="block text-[10px] font-black uppercase text-slate-400 ml-2">Emergency Phone</label>
                       <input 
                        type="text" 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                        value={editForm.guardianPhone || ''}
                        onChange={e => setEditForm({...editForm, guardianPhone: e.target.value})}
                       />
                    </div>
                    
                    <div className="pt-4 space-y-3">
                       <label className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            checked={editForm.is4Ps || false}
                            onChange={e => setEditForm({...editForm, is4Ps: e.target.checked})}
                          />
                          <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">4Ps Beneficiary Status</span>
                       </label>
                       
                       <label className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            checked={editForm.feedingProgramStatus === 'Beneficiary'}
                            onChange={e => setEditForm({...editForm, feedingProgramStatus: e.target.checked ? 'Beneficiary' : 'None'})}
                          />
                          <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Feeding Program Recipient</span>
                       </label>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                 <button 
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                 >
                   Cancel Changes
                 </button>
                 <button 
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
                 >
                   {isSaving ? 'Saving...' : <><Save size={16} /> Save Record</>}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Masterlist;