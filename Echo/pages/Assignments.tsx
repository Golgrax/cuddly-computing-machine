import React, { useState, useEffect, useRef } from 'react';
import { User, Assignment, Submission, UserRole } from '../types';
import { api } from '../src/api'; 
import { Clock, CheckCircle2, FileUp, Loader2, UploadCloud, FileText, CheckCircle, Search, Info, PlusCircle, X, AlertCircle, Edit, Trash2 } from 'lucide-react';

const AssignmentsPage: React.FC<{ user: User }> = ({ user }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{id: string, name: string, data: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    title: '',
    subject: '',
    dueDate: '',
    section: 'All', 
  });
  const [editForm, setEditForm] = useState<Assignment | null>(null);
  const [formError, setFormError] = useState('');
  
  // Sections for dropdown - simplified
  const sections = ['Sampaguita', 'Narra', 'Molave', 'Acacia']; 

  const isFaculty = user.role === UserRole.FACULTY || user.role === UserRole.TEACHER || user.role === UserRole.ADMIN;

  const fetchAssignmentsAndSubmissions = async () => {
    setLoading(true);
    try {
      const [assigns, subs] = await Promise.all([
        api.getAssignments(), // Fetch all assignments
        api.getSubmissions()
      ]);
      
      // Filter for Student
      let relevantAssignments = assigns;
      if (user.role === UserRole.STUDENT) {
          relevantAssignments = assigns.filter(a => 
              !a.section || a.section === 'All' || a.section === user.section
          );
      }
      
      console.log("Assignments fetched:", assigns);
      console.log("Relevant Assignments:", relevantAssignments);

      setAssignments(relevantAssignments);
      setSubmissions(subs.filter(s => s.studentId === user.id));
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAssignmentsAndSubmissions(); }, [user.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, assignmentId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile({
          id: assignmentId,
          name: file.name,
          data: event.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (assignmentId: string) => {
    if (!selectedFile) return;
    setSubmitting(assignmentId);
    try {
      await api.submitAssignmentWork({
        assignmentId,
        studentId: user.id,
        studentName: user.name,
        fileName: selectedFile.name,
        fileData: selectedFile.data
      });
      
      setTimeout(() => {
        setSubmitting(null);
        setSelectedFile(null);
        fetchAssignmentsAndSubmissions();
      }, 1200);
    } catch (error) {
      console.error("Failed to submit assignment:", error);
      alert("Failed to submit assignment.");
      setSubmitting(null);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!createForm.title || !createForm.subject || !createForm.dueDate) {
      setFormError('Title, Subject, and Due Date are required.');
      return;
    }

    try {
      await api.createAssignment({
        ...createForm,
        status: 'pending' // Default status
      });
      setIsAddingAssignment(false);
      setCreateForm({ title: '', subject: '', dueDate: '', section: 'All' });
      fetchAssignmentsAndSubmissions();
    } catch (error) {
      console.error("Failed to create assignment:", error);
      setFormError(`Failed to create assignment: ${error.message}`);
    }
  };

  const handleEditClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setEditForm(assignment);
    setIsEditingAssignment(true);
  };

  const handleEditAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!editForm?.title || !editForm?.subject || !editForm?.dueDate) {
      setFormError('Title, Subject, and Due Date are required.');
      return;
    }
    if (!selectedAssignment) return;

    try {
      await api.updateAssignment(selectedAssignment.id, editForm);
      setIsEditingAssignment(false);
      setSelectedAssignment(null);
      setEditForm(null);
      fetchAssignmentsAndSubmissions();
    } catch (error) {
      console.error("Failed to update assignment:", error);
      setFormError(`Failed to update assignment: ${error.message}`);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      try {
        await api.deleteAssignment(id);
        fetchAssignmentsAndSubmissions();
      } catch (error) {
        console.error("Failed to delete assignment:", error);
        alert('Failed to delete assignment.');
      }
    }
  };

  const getStatus = (assignmentId: string) => {
    const sub = submissions.find(s => s.assignmentId === assignmentId);
    if (!sub) return 'pending';
    return sub.status;
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Learning Deliverables</h1>
          <p className="text-slate-500 mt-2 font-medium">Upload your classroom requirements and track teacher validation.</p>
        </div>
        {isFaculty && (
          <button 
            onClick={() => setIsAddingAssignment(true)}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-xl"
          >
            <PlusCircle size={20} />
            New Assignment
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {assignments.length > 0 ? assignments.map((item) => {
          const status = getStatus(item.id);
          const userSub = submissions.find(s => s.assignmentId === item.id);

          return (
            <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl transition-all group">
              <div className="flex gap-6 items-start">
                <div className={`p-4 rounded-3xl transition-colors ${
                  status === 'pending' ? 'bg-slate-100 text-slate-400' :
                  status === 'graded' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {status === 'pending' ? <FileText size={32} /> : 
                   status === 'graded' ? <CheckCircle size={32} /> : 
                   <Clock size={32} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white leading-none">{item.title}</h3>
                    {isFaculty && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                          title="Edit Assignment"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAssignment(item.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                          title="Delete Assignment"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 mt-3">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest">{item.subject}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Target: {item.dueDate}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Section: {item.section || 'All'}</span>
                    </div>
                    {/* Render resource link if in description */}
                    {item.subject.includes('http') && (
                       <a href={item.subject.match(/https?:\/\/[^\s]+/)?.[0]} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-sky-500 hover:underline flex items-center gap-1">
                          <UploadCloud size={12} /> View Attached Resource
                       </a>
                    )}
                  </div>
                </div>
              </div>

              {!isFaculty && (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {status === 'pending' ? (
                    <>
                      <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => handleFileChange(e, item.id)} />
                      {selectedFile?.id === item.id ? (
                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                          <span className="text-[10px] font-bold truncate max-w-[150px]">{selectedFile.name}</span>
                          <button onClick={() => setSelectedFile(null)} className="text-rose-500 font-black">X</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                              // If using ref, we need a way to distinct which assignment triggered it.
                              // Simple way: set a state or handle click directly if fileInput was per-row.
                              // Since ref is shared, we must ensure handleFileChange knows the ID.
                              // Actually, having one ref for map is buggy if multiple clicks.
                              // We should map inputs or use a different trigger.
                              // Fix: Use label htmlFor or distinct input.
                              // Or just trigger the one ref and store currentAssignmentId?
                              // Just create input inline for simplicity here.
                              const input = document.getElementById(`file-${item.id}`);
                              input?.click();
                          }} 
                          className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 transition-colors"
                        >
                          <UploadCloud size={16} /> Choose File
                        </button>
                      )}
                      <input type="file" id={`file-${item.id}`} className="hidden" onChange={(e) => handleFileChange(e, item.id)} />
                      
                      <button 
                        onClick={() => handleSubmit(item.id)} 
                        disabled={!selectedFile || selectedFile.id !== item.id || submitting === item.id} 
                        className="px-8 py-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl disabled:opacity-50"
                      >
                        {submitting === item.id ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                        Submit
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-end gap-2">
                      <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${
                        status === 'graded' 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                          : 'bg-amber-50 border-amber-100 text-amber-600'
                      }`}>
                        {status === 'graded' ? <CheckCircle2 size={16} /> : <Loader2 size={16} className="animate-pulse" />}
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {status === 'graded' ? `Score: ${userSub?.grade}/100` : 'Reviewing'}
                        </span>
                      </div>
                      {userSub?.fileName && (
                        <p className="text-[9px] font-bold text-slate-400 italic">Attached: {userSub.fileName}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }) : (
            <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">
                No assignments found for your section.
            </div>
        )}
      </div>

      {/* Add Assignment Modal (retained) */}
      {isAddingAssignment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                     <PlusCircle size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">New Assignment</h3>
                </div>
                <button onClick={() => setIsAddingAssignment(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X/></button>
              </div>

              {formError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-xs font-bold">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}
              
              <form onSubmit={handleCreateAssignment} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Title</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    placeholder="e.g., Essay on Rizal"
                    value={createForm.title}
                    onChange={e => setCreateForm({...createForm, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Subject</label>
                    <input 
                      type="text" required
                      className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                      placeholder="e.g., Filipino"
                      value={createForm.subject}
                      onChange={e => setCreateForm({...createForm, subject: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Due Date</label>
                    <input 
                      type="date" required
                      className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                      value={createForm.dueDate}
                      onChange={e => setCreateForm({...createForm, dueDate: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Section</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    value={createForm.section}
                    onChange={e => setCreateForm({...createForm, section: e.target.value})}
                  >
                    <option value="All">All Sections</option>
                    {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                  </select>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingAssignment(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-none"
                  >
                    Create Assignment
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {isEditingAssignment && selectedAssignment && editForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                     <Edit size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Edit Assignment</h3>
                </div>
                <button onClick={() => setIsEditingAssignment(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X/></button>
              </div>

              {formError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-xs font-bold">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}
              
              <form onSubmit={handleEditAssignment} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Title</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    value={editForm.title}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Subject</label>
                    <input 
                      type="text" required
                      className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                      value={editForm.subject}
                      onChange={e => setEditForm({...editForm, subject: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Due Date</label>
                    <input 
                      type="date" required
                      className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                      value={editForm.dueDate}
                      onChange={e => setEditForm({...editForm, dueDate: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Section</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    value={editForm.section || 'All'}
                    onChange={e => setEditForm({...editForm, section: e.target.value})}
                  >
                    <option value="All">All Sections</option>
                    {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                  </select>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsEditingAssignment(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-none"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex items-center gap-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 p-10 opacity-5 -rotate-12 translate-x-1/4 -translate-y-1/4">
          <Info size={200} />
        </div>
        <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center text-white shrink-0">
          <Info size={32} />
        </div>
        <div>
          <h4 className="text-xl font-black uppercase tracking-tighter">Submission Protocol</h4>
          <p className="text-sm text-white/60 font-medium max-w-2xl leading-relaxed mt-1">
            Learning materials submitted digitally remain archived in your portfolio. Once a teacher provides feedback, the status will shift from "Reviewing" to "Graded".
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPage;