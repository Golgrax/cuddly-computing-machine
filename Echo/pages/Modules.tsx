import React, { useState, useEffect } from 'react';
import { User, Module, UserRole } from '../types';
import { api } from '../src/api'; 
import { 
  FileText, Download, Eye, Search, Filter, PlusCircle, X, AlertCircle, Edit, Trash2, Loader2, Link as LinkIcon, Users
} from 'lucide-react';

const ModulesPage: React.FC<{ user: User }> = ({ user }) => {
  // Parse sections safely
  let assignedSections: string[] = [];
  try {
      if (user.assignedSections) {
          assignedSections = typeof user.assignedSections === 'string' 
              ? JSON.parse(user.assignedSections) 
              : user.assignedSections;
      }
  } catch (e) { console.error("Failed to parse assigned sections", e); }

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<string[]>([]);

  // Modal states
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<{title: string, subject: string, downloadLink: string, targetSection: string}>({
    title: '',
    subject: '',
    downloadLink: '',
    targetSection: ''
  });
  const [editForm, setEditForm] = useState<Module | null>(null);
  const [formError, setFormError] = useState('');

  const isFaculty = user.role === UserRole.FACULTY || user.role === UserRole.TEACHER || user.role === UserRole.ADMIN;

  const fetchModules = async () => {
    setLoading(true);
    try {
      const [modulesData, sectionsData] = await Promise.all([
        api.getModules(),
        api.getSections().catch(() => [])
      ]);
      
      // Filter modules based on role
      let filteredModules = modulesData;
      if (user.role === UserRole.STUDENT) {
          filteredModules = modulesData.filter((m: Module) => m.targetSection === user.section);
      } else if (user.role === UserRole.TEACHER) {
          // Teachers see modules for their assigned sections (using parsed assignedSections)
          filteredModules = modulesData.filter((m: Module) => assignedSections.includes(m.targetSection || '') || !m.targetSection);
      }
      // Admins see all

      setModules(filteredModules);

      // Set available sections for dropdown
      if (user.role === UserRole.TEACHER) {
          setSections(assignedSections);
      } else if (user.role === UserRole.ADMIN || user.role === UserRole.FACULTY) {
          setSections(sectionsData.map((s: any) => s.name));
      }

    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchModules();
  }, [user.id]);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!createForm.title || !createForm.subject || !createForm.targetSection) {
      setFormError('Title, Subject, and Target Section are required.');
      return;
    }
    try {
      await api.createModule(createForm);
      setIsAddingModule(false);
      setCreateForm({ title: '', subject: '', downloadLink: '', targetSection: '' });
      fetchModules();
    } catch (error) {
      console.error("Failed to create module:", error);
      setFormError(`Failed to create module: ${error.message}`);
    }
  };

  const handleEditClick = (module: Module) => {
    setSelectedModule(module);
    setEditForm(module);
    setIsEditingModule(true);
  };

  const handleEditModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!editForm?.title || !editForm?.subject) {
      setFormError('Title and Subject are required.');
      return;
    }
    if (!selectedModule) return;

    try {
      await api.updateModule(selectedModule.id, editForm);
      setIsEditingModule(false);
      setSelectedModule(null);
      setEditForm(null);
      fetchModules();
    } catch (error) {
      console.error("Failed to update module:", error);
      setFormError(`Failed to update module: ${error.message}`);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (confirm('Are you sure you want to delete this module?')) {
      try {
        await api.deleteModule(id);
        fetchModules();
      } catch (error) {
        console.error("Failed to delete module:", error);
        alert('Failed to delete module.');
      }
    }
  };

  const handleDownload = (link?: string) => {
      if (link) {
          window.open(link, '_blank');
      } else {
          alert("No download link available for this module.");
      }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-school-navy" size={40} />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Course Modules</h1>
          <p className="text-slate-500">Download and view reading materials for your subjects.</p>
        </div>
        <div className="flex gap-2">
          {isFaculty && (
            <button 
              onClick={() => setIsAddingModule(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
            >
              <PlusCircle size={20} /> Add Module
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <div key={mod.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-center mb-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileText size={24} />
              </div>
              {isFaculty && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditClick(mod)}
                    className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                    title="Edit Module"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteModule(mod.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                    title="Delete Module"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            <h3 className="font-bold text-slate-800 mb-1">{mod.title}</h3>
            <p className="text-sm text-indigo-600 font-semibold mb-1">{mod.subject}</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">{mod.targetSection ? `Section: ${mod.targetSection}` : 'All Sections'}</p>
            <p className="text-xs text-slate-400 mb-6 flex items-center gap-1">
              Uploaded: {mod.uploadDate}
            </p>
            <button 
                onClick={() => handleDownload(mod.downloadLink)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
                <Download size={14} />
                Download Resource
            </button>
          </div>
        ))}
      </div>

      {/* Add Module Modal */}
      {isAddingModule && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                     <PlusCircle size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Add New Module</h3>
                </div>
                <button onClick={() => setIsAddingModule(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X/></button>
              </div>

              {formError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-xs font-bold">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}
              
              <form onSubmit={handleCreateModule} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Module Title</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    placeholder="e.g., Introduction to Algebra"
                    value={createForm.title}
                    onChange={e => setCreateForm({...createForm, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Subject</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    placeholder="e.g., Mathematics, Science"
                    value={createForm.subject}
                    onChange={e => setCreateForm({...createForm, subject: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Target Section</label>
                  <div className="relative">
                      <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        required
                        className="w-full pl-14 pr-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600 appearance-none"
                        value={createForm.targetSection}
                        onChange={e => setCreateForm({...createForm, targetSection: e.target.value})}
                      >
                        <option value="">Select Section</option>
                        {sections.map(sec => (
                            <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Download Link (GDrive/URL)</label>
                  <div className="relative">
                      <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="url" required
                        className="w-full pl-14 pr-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                        placeholder="https://drive.google.com/..."
                        value={createForm.downloadLink}
                        onChange={e => setCreateForm({...createForm, downloadLink: e.target.value})}
                      />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingModule(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-none"
                  >
                    Add Module
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Edit Module Modal */}
      {isEditingModule && selectedModule && editForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                     <Edit size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Edit Module</h3>
                </div>
                <button onClick={() => setIsEditingModule(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X/></button>
              </div>

              {formError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-xs font-bold">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}
              
              <form onSubmit={handleEditModule} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Module Title</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    placeholder="e.g., Introduction to Algebra"
                    value={editForm.title}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Subject</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    placeholder="e.g., Mathematics, Science"
                    value={editForm.subject}
                    onChange={e => setEditForm({...editForm, subject: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Target Section</label>
                  <div className="relative">
                      <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        required
                        className="w-full pl-14 pr-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600 appearance-none"
                        value={editForm.targetSection}
                        onChange={e => setEditForm({...editForm, targetSection: e.target.value})}
                      >
                        <option value="">Select Section</option>
                        {sections.map(sec => (
                            <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Download Link (GDrive/URL)</label>
                  <div className="relative">
                      <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="url" required
                        className="w-full pl-14 pr-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                        placeholder="https://drive.google.com/..."
                        value={editForm.downloadLink}
                        onChange={e => setEditForm({...editForm, downloadLink: e.target.value})}
                      />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsEditingModule(false)}
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
    </div>
  );
};

export default ModulesPage;