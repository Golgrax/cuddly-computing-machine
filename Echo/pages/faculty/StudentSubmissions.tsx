import React, { useState, useEffect } from 'react';
import { User, Submission, Assignment } from '../../types';
import { api } from '../../src/api'; 
import { FileText, Download, CheckCircle, Search, Edit3, Loader2, X, Plus, Calendar, Link as LinkIcon, Users, Trash2, Eye, Filter } from 'lucide-react';

const StudentSubmissions: React.FC<{ user: User }> = ({ user }) => {
  // Safe Parse Sections
  let assignedSections: string[] = [];
  try {
      if (user.assignedSections) {
          assignedSections = typeof user.assignedSections === 'string' 
              ? JSON.parse(user.assignedSections) 
              : user.assignedSections;
      }
  } catch (e) { console.error("Failed to parse assigned sections", e); }

  const [activeTab, setActiveTab] = useState<'assignments' | 'submissions'>('assignments');
  
  // Data State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment Modal States
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Filter State (View)
  const [viewSection, setViewSection] = useState<string>('All');

  // Form State
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    subject: '', // Instructions
    dueDate: '',
    section: 'All', // Default for creation
    resourceLink: ''
  });

  // Grading State
  const [gradingSub, setGradingSub] = useState<Submission | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [assData, subData] = await Promise.all([
        // Fetch ALL assignments the teacher has access to, then filter locally or rely on backend 'All' logic?
        // Better to fetch 'All' assignments if section is 'All', or specific section.
        // Wait, current API fetches based on query param.
        // Let's fetch ALL for the teacher to allow client-side filtering or fetch specific.
        // For simplicity and to see everything: fetch 'All' if viewSection is 'All', else specific.
        api.getAssignments(viewSection === 'All' ? '' : viewSection),
        api.getSubmissions()
      ]);
      setAssignments(assData);
      setSubmissions(subData);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [viewSection]);

  const resetForm = () => {
      setAssignmentForm({
          title: '', 
          subject: '', 
          dueDate: '', 
          section: 'All', 
          resourceLink: '' 
      });
      setSelectedAssignment(null);
  };

  const handleCreateAssignment = async () => {
    if (!assignmentForm.title || !assignmentForm.dueDate) {
        alert("Please fill in required fields.");
        return;
    }
    try {
        await api.createAssignment({
            ...assignmentForm,
            status: 'active',
            subject: assignmentForm.subject + (assignmentForm.resourceLink ? `\n\nResource: ${assignmentForm.resourceLink}` : '')
        });
        setIsCreating(false);
        resetForm();
        loadData();
    } catch (error) {
        console.error("Failed to create assignment:", error);
        alert("Failed to create assignment.");
    }
  };

  const handleEditClick = (assign: Assignment) => {
      // Parse description and link
      const parts = assign.subject.split('\n\nResource: ');
      const desc = parts[0];
      const link = parts.length > 1 ? parts[1] : '';

      setSelectedAssignment(assign);
      setAssignmentForm({
          title: assign.title,
          subject: desc,
          dueDate: assign.dueDate,
          section: assign.section || 'All',
          resourceLink: link
      });
      setIsEditing(true);
  };

  const handleUpdateAssignment = async () => {
      if (!selectedAssignment) return;
      try {
          await api.updateAssignment(selectedAssignment.id, {
              ...assignmentForm,
              subject: assignmentForm.subject + (assignmentForm.resourceLink ? `\n\nResource: ${assignmentForm.resourceLink}` : '')
          });
          setIsEditing(false);
          resetForm();
          loadData();
      } catch (error) {
          console.error("Failed to update assignment:", error);
          alert("Failed to update assignment.");
      }
  };

  const handleDeleteAssignment = async (id: string) => {
      if (confirm("Are you sure you want to delete this assignment? Submissions might be affected.")) {
          try {
              await api.deleteAssignment(id);
              loadData();
          } catch (error) {
              console.error("Failed to delete assignment:", error);
              alert("Failed to delete assignment.");
          }
      }
  };

  const handleViewDetails = (assign: Assignment) => {
      setSelectedAssignment(assign);
      setIsViewing(true);
  };

  const handleGrade = async () => {
    if (!gradingSub) return;
    try {
      await api.gradeSubmission(gradingSub.id, {
        grade: parseInt(grade),
        feedback,
        status: 'graded'
      });
      setGradingSub(null);
      setGrade('');
      setFeedback('');
      loadData();
    } catch (error) {
      console.error("Failed to grade submission:", error);
      alert("Failed to grade submission.");
    }
  };

  if (loading && assignments.length === 0 && submissions.length === 0) 
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Academic Tasks</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage assignments and review student submissions.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-[2rem]">
           <button 
             onClick={() => setActiveTab('assignments')}
             className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'assignments' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
           >
             Assignments
           </button>
           <button 
             onClick={() => setActiveTab('submissions')}
             className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'submissions' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
           >
             Review Work
           </button>
        </div>
      </div>

      {activeTab === 'assignments' && (
        <div className="space-y-8">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[2.5rem]">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm">
                    <FileText size={24} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Create New Task</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Assign work to your sections</p>
                 </div>
              </div>
              <div className="flex gap-4 items-center w-full md:w-auto">
                  {/* Filter Dropdown */}
                  <div className="relative">
                      <select 
                        className="appearance-none bg-white dark:bg-slate-800 border-none rounded-2xl py-4 pl-6 pr-10 text-xs font-black uppercase tracking-widest outline-none shadow-sm cursor-pointer hover:bg-slate-50"
                        value={viewSection}
                        onChange={e => setViewSection(e.target.value)}
                      >
                          <option value="All">All Sections</option>
                          {assignedSections.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  <button 
                    onClick={() => { resetForm(); setIsCreating(true); }}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <Plus size={16} /> Create
                  </button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments.length > 0 ? assignments.map(assign => (
                  <div key={assign.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm group">
                      <div className="flex justify-between items-start mb-4">
                         <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                           {assign.section || 'All'}
                         </span>
                         <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                           Due: {assign.dueDate}
                         </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{assign.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-6 min-h-[2.5rem]">{assign.subject}</p>
                      
                      <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                         <div className="flex gap-2">
                            <button 
                                onClick={() => handleEditClick(assign)}
                                className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                title="Edit Task"
                            >
                                <Edit3 size={16} />
                            </button>
                            <button 
                                onClick={() => handleDeleteAssignment(assign.id)}
                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                title="Delete Task"
                            >
                                <Trash2 size={16} />
                            </button>
                         </div>
                         <button 
                            onClick={() => handleViewDetails(assign)}
                            className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-2"
                         >
                             <Eye size={14} /> View Details
                         </button>
                      </div>
                  </div>
              )) : (
                  <div className="col-span-full p-20 text-center flex flex-col items-center opacity-50">
                      <FileText size={48} className="text-slate-300 mb-4" strokeWidth={1} />
                      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No assignments found for {viewSection}</p>
                  </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {submissions.length > 0 ? submissions.map(sub => (
            <div key={sub.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden">
                {sub.status === 'graded' && (
                <div className="absolute top-0 right-0 p-6">
                    <CheckCircle className="text-emerald-500" />
                </div>
                )}
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <FileText size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1">{sub.studentName}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Received: {sub.submittedAt}</p>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-8">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                    {sub.fileName}
                </p>
                </div>

                <div className="flex gap-2">
                <a 
                    href={sub.fileData} 
                    download={sub.fileName}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                    <Download size={14} /> Download
                </a>
                <button 
                    onClick={() => {
                    setGradingSub(sub);
                    setGrade(sub.grade?.toString() || '');
                    setFeedback(sub.feedback || '');
                    }}
                    className="px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
                >
                    <Edit3 size={18} />
                </button>
                </div>
            </div>
            )) : (
                <div className="col-span-full p-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">
                    No submissions to review yet.
                </div>
            )}
        </div>
      )}

      {/* Assignment Form Modal (Create/Edit) */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter">{isEditing ? 'Edit Assignment' : 'New Assignment'}</h3>
                <button onClick={() => { setIsCreating(false); setIsEditing(false); resetForm(); }} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
              </div>
              <div className="space-y-5">
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Task Title</label>
                    <input 
                      type="text" 
                      className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm"
                      placeholder="e.g. Science Experiment 1"
                      value={assignmentForm.title}
                      onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})}
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Target Section</label>
                        <select 
                            className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-xs"
                            value={assignmentForm.section}
                            onChange={e => setAssignmentForm({...assignmentForm, section: e.target.value})}
                        >
                            <option value="All">All Sections</option>
                            {assignedSections.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Due Date</label>
                        <input 
                            type="date" 
                            className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-xs"
                            value={assignmentForm.dueDate}
                            onChange={e => setAssignmentForm({...assignmentForm, dueDate: e.target.value})}
                        />
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Instructions</label>
                    <textarea 
                      rows={3}
                      className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-medium text-sm resize-none"
                      placeholder="Describe what needs to be done..."
                      value={assignmentForm.subject}
                      onChange={e => setAssignmentForm({...assignmentForm, subject: e.target.value})}
                    />
                 </div>

                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Resource Link (Google Drive/Docs)</label>
                    <div className="relative">
                        <LinkIcon size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            className="w-full pl-12 pr-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm text-indigo-600"
                            placeholder="https://..."
                            value={assignmentForm.resourceLink}
                            onChange={e => setAssignmentForm({...assignmentForm, resourceLink: e.target.value})}
                        />
                    </div>
                 </div>

                 <button 
                   onClick={isEditing ? handleUpdateAssignment : handleCreateAssignment}
                   className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl mt-4"
                 >
                   {isEditing ? 'Save Changes' : 'Post Assignment'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewing && selectedAssignment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Due: {selectedAssignment.dueDate}</span>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mt-1">{selectedAssignment.title}</h3>
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest mt-2 inline-block">
                        Section: {selectedAssignment.section}
                    </span>
                </div>
                <button onClick={() => { setIsViewing(false); setSelectedAssignment(null); }} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
              </div>
              
              <div className="space-y-6">
                 <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {selectedAssignment.subject}
                    </p>
                 </div>
                 
                 {/* Extract link if present in subject but better if we parsed it. 
                     Since we append it, we can just look for the text or use the parsed view if available.
                     But selectedAssignment holds the raw subject string.
                 */}
                 {selectedAssignment.subject.includes('Resource:') && (
                     <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
                        <LinkIcon size={18} />
                        <a 
                            href={selectedAssignment.subject.split('Resource: ')[1]} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs font-bold underline truncate"
                        >
                            {selectedAssignment.subject.split('Resource: ')[1]}
                        </a>
                     </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSub && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom-6">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Grading Panel</h3>
                <button onClick={() => setGradingSub(null)}><X/></button>
              </div>
              <div className="space-y-6">
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Score (0-100)</label>
                   <input 
                    type="number" 
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-black text-lg"
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Feedback / Comments</label>
                   <textarea 
                    rows={4}
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-medium text-sm resize-none"
                    placeholder="Provide constructive advice..."
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                   />
                </div>
                <button 
                  onClick={handleGrade}
                  className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl"
                >
                  Post Grade
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentSubmissions;
