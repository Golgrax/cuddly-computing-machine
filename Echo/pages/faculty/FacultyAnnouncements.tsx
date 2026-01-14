import React, { useState, useEffect } from 'react';
import { User, Announcement, UserRole } from '../../types';
import { api } from '../../src/api'; // Changed from mockApiService
import { Plus, Trash2, Megaphone, Bell, CheckCircle2, AlertCircle, X, Globe, Users, Edit, PlusCircle, Loader2 } from 'lucide-react';

const FacultyAnnouncements: React.FC<{ user: User }> = ({ user }) => {
  // Parse sections safely
  let assignedSections: string[] = [];
  try {
      if (user.assignedSections) {
          assignedSections = typeof user.assignedSections === 'string' 
              ? JSON.parse(user.assignedSections) 
              : user.assignedSections;
      }
  } catch (e) { console.error("Failed to parse assigned sections", e); }

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false); // Renamed isModalOpen
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Renamed formData to createForm
  const [createForm, setCreateForm] = useState({ 
    title: '', 
    content: '', 
    category: 'General' as Announcement['category'],
    targetSection: 'All'
  });
  const [editForm, setEditForm] = useState<Announcement | null>(null);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error("Failed to load announcements:", error);
      // Optionally set an error state to display to the user
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!createForm.title || !createForm.content) {
      setFormError('Title and content are required.');
      return;
    }

    try {
      await api.createAnnouncement({
        title: createForm.title,
        content: createForm.content,
        author: user.name, // Author comes from logged-in user
        category: createForm.category,
        targetSection: createForm.targetSection
      });

      setIsAddingAnnouncement(false);
      setCreateForm({ title: '', content: '', category: 'General', targetSection: 'All' });
      load();
    } catch (error) {
      console.error("Failed to create announcement:", error);
      setFormError(`Failed to create announcement: ${error.message}`);
    }
  };

  const handleEditClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setEditForm(announcement);
    setIsEditingAnnouncement(true);
  };

  const handleEditAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!editForm?.title || !editForm?.content) {
      setFormError('Title and content are required.');
      return;
    }
    if (!selectedAnnouncement) return;

    try {
      await api.updateAnnouncement(selectedAnnouncement.id, {
        title: editForm.title,
        content: editForm.content,
        targetSection: editForm.targetSection,
        category: editForm.category
      });
      setIsEditingAnnouncement(false);
      setSelectedAnnouncement(null);
      setEditForm(null);
      load();
    } catch (error) {
      console.error("Failed to update announcement:", error);
      setFormError(`Failed to update announcement: ${error.message}`);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => { // Renamed handleDelete
    if (confirm('Permanently remove this announcement from board?')) {
      try {
        await api.deleteAnnouncement(id);
        load();
      } catch (error) {
        console.error("Failed to delete announcement:", error);
        alert('Failed to delete announcement.');
      }
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-school-navy" size={40} />
    </div>
  );

  const isPoster = [UserRole.FACULTY, UserRole.TEACHER, UserRole.ADMIN].includes(user.role);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Bulletin Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Broadcast news and academic updates to the school community.</p>
        </div>
        {isPoster && (
          <button 
            onClick={() => setIsAddingAnnouncement(true)}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-xl"
          >
            <Plus size={20} />
            New Post
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {announcements.map((ann) => (
          <div key={ann.id} className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-sm flex flex-col md:flex-row gap-8 items-start">
            <div className={`w-14 h-14 rounded-3xl flex items-center justify-center flex-shrink-0 ${
              ann.category === 'Emergency' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'
            }`}>
               <Megaphone size={28} />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{ann.title}</h3>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full ${
                  ann.targetSection === 'All' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {ann.targetSection === 'All' ? 'School-Wide' : ann.targetSection}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-full text-slate-400">
                  {ann.category}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-6">{ann.content}</p>
              <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-black text-[10px] text-indigo-600">
                     {ann.author.charAt(0)}
                   </div>
                   <span className="text-xs font-black uppercase text-slate-400 tracking-widest">{ann.author} • {ann.date}</span>
                 </div>
                 {isPoster && (
                   <div className="flex gap-2">
                     <button 
                       onClick={() => handleEditClick(ann)}
                       className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                       title="Edit Announcement"
                     >
                       <Edit size={20} />
                     </button>
                     <button 
                       onClick={() => handleDeleteAnnouncement(ann.id)}
                       className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                       title="Delete Announcement"
                     >
                       <Trash2 size={20} />
                     </button>
                   </div>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Announcement Modal */}
      {isAddingAnnouncement && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsAddingAnnouncement(false)}></div>
          <div className="relative bg-white dark:bg-slate-950 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-10">
               <div className="flex justify-between items-center mb-8">
                 <h2 className="text-3xl font-black tracking-tight uppercase">New Broadcast</h2>
                 <button onClick={() => setIsAddingAnnouncement(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X/></button>
               </div>

               {formError && (
                 <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-xs font-bold">
                   <AlertCircle size={18} /> {formError}
                 </div>
               )}
               
               <form onSubmit={handleCreateAnnouncement} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 ml-2">Target Audience</label>
                      <select 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none outline-none font-bold text-xs"
                        value={createForm.targetSection}
                        onChange={e => setCreateForm({...createForm, targetSection: e.target.value})}
                      >
                        <option value="All">Entire School</option>
                        {assignedSections.map(sec => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 ml-2">Category</label>
                      <select 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none outline-none font-bold text-xs"
                        value={createForm.category}
                        onChange={e => setCreateForm({...createForm, category: e.target.value as Announcement['category']})}
                      >
                        <option value="General">General</option>
                        <option value="Academic">Academic</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Event">Event</option>
                        <option value="Brigada Eskwela">Brigada Eskwela</option>
                        <option value="Notice">Notice</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 ml-2">Headline</label>
                    <input 
                      type="text" required
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-sm"
                      placeholder="Enter update title..."
                      value={createForm.title}
                      onChange={e => setCreateForm({...createForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 ml-2">Content</label>
                    <textarea 
                      rows={4} required
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-medium text-sm resize-none"
                      placeholder="Message body..."
                      value={createForm.content}
                      onChange={e => setCreateForm({...createForm, content: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setIsAddingAnnouncement(false)} className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest">Cancel</button>
                    <button type="submit" className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Post Update</button>
                  </div>
               </form>
             </div>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {isEditingAnnouncement && selectedAnnouncement && editForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsEditingAnnouncement(false)}></div>
          <div className="relative bg-white dark:bg-slate-950 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-10">
               <div className="flex justify-between items-center mb-8">
                 <h2 className="text-3xl font-black tracking-tight uppercase">Edit Broadcast</h2>
                 <button onClick={() => setIsEditingAnnouncement(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X/></button>
               </div>

               {formError && (
                 <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-xs font-bold">
                   <AlertCircle size={18} /> {formError}
                 </div>
               )}
               
               <form onSubmit={handleEditAnnouncement} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 ml-2">Target Audience</label>
                      <select 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none outline-none font-bold text-xs"
                        value={editForm.targetSection}
                        onChange={e => setEditForm({...editForm, targetSection: e.target.value})}
                      >
                        <option value="All">Entire School</option>
                        {assignedSections.map(sec => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 ml-2">Category</label>
                      <select 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none outline-none font-bold text-xs"
                        value={editForm.category}
                        onChange={e => setEditForm({...editForm, category: e.target.value as Announcement['category']})}
                      >
                        <option value="General">General</option>
                        <option value="Academic">Academic</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Event">Event</option>
                        <option value="Brigada Eskwela">Brigada Eskwela</option>
                        <option value="Notice">Notice</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 ml-2">Headline</label>
                    <input 
                      type="text" required
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-sm"
                      placeholder="Enter update title..."
                      value={editForm.title}
                      onChange={e => setEditForm({...editForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 ml-2">Content</label>
                    <textarea 
                      rows={4} required
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-medium text-sm resize-none"
                      placeholder="Message body..."
                      value={editForm.content}
                      onChange={e => setEditForm({...editForm, content: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setIsEditingAnnouncement(false)} className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest">Cancel</button>
                    <button type="submit" className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Save Changes</button>
                  </div>
               </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyAnnouncements;