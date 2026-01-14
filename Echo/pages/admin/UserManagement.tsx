import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { api } from '../../src/api'; 
import { 
  Search, Trash2, Key, ShieldAlert, Loader2, 
  CheckCircle2, X, UserPlus, Mail, ShieldCheck, 
  User as UserIcon, AlertCircle, Edit, ChevronDown, Clock, Star
} from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  
  // Modal states
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  
  // Form states
  const [newPass, setNewPass] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    role: UserRole.STUDENT
  });
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    const userData = localStorage.getItem('school_user');
    if (userData) setCurrentUser(JSON.parse(userData));
    
    try {
      const [allUsers, allSections] = await Promise.all([
          api.getUsers(),
          api.getSections().catch(() => [])
      ]);
      setUsers(allUsers);
      
      const sectionNames = allSections.map((s: any) => s.name);
      // Also derive from existing users to catch any not in sections table
      allUsers.forEach((u: User) => {
          if (u.section && !sectionNames.includes(u.section)) sectionNames.push(u.section);
      });
      setAvailableSections(Array.from(new Set(sectionNames)).sort());

    } catch (error) {
      console.error("Failed to load data:", error);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Permanently remove this account from system?')) {
      try {
        await api.deleteUser(id); 
        load();
      } catch (error) {
        console.error("Failed to delete user:", error);
        alert('Failed to delete user.');
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!resettingUser || !newPass) return;
    try {
        await api.updateUser(resettingUser.id, { password: newPass });
        alert(`Password for ${resettingUser.name} has been reset.`);
        setResettingUser(null);
        setNewPass('');
    } catch (error) {
        console.error("Failed to reset password:", error);
        alert("Failed to reset password.");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!createForm.name || !createForm.email) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      await api.createUser(createForm.name, createForm.email, createForm.role); 
      setIsAddingUser(false);
      setCreateForm({ name: '', email: '', role: UserRole.STUDENT });
      load();
    } catch (err) {
      setFormError(`Failed to create account: ${err.message}`);
    }
  };

  const openEditModal = (user: User) => {
      setEditingUser(user);
      setEditForm({ 
          role: user.role, 
          assignedSections: user.assignedSections || [],
          advisorySection: user.advisorySection || '',
          section: user.section || ''
      });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await api.updateUser(editingUser.id, editForm);
      setEditingUser(null);
      load();
    } catch (error) {
      console.error("Failed to update user:", error);
      alert('Failed to update user.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <datalist id="section-suggestions">
          {availableSections.map(sec => <option key={sec} value={sec} />)}
      </datalist>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Identity Control</h1>
          <p className="text-slate-500 mt-2 font-medium">Approve new users and manage system roles.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search accounts..." 
              className="pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl text-sm font-bold outline-none w-full shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAddingUser(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-xl"
          >
            <UserPlus size={20} />
            Manual Add
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Identity</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">System Role</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                <td className="px-8 py-8">
                  <p className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {user.name}
                    {user.role === UserRole.PENDING && (
                      <span className="p-1 bg-amber-100 text-amber-600 rounded-lg animate-pulse" title="Waiting for Approval">
                        <Clock size={12} />
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 font-bold">{user.email}</p>
                  {user.role === UserRole.TEACHER && (
                      <div className="mt-2 space-y-1">
                          {user.assignedSections && user.assignedSections.length > 0 && (
                              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">
                                  Classes: {Array.isArray(user.assignedSections) ? user.assignedSections.join(', ') : user.assignedSections}
                              </p>
                          )}
                          {user.advisorySection && (
                              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                  <Star size={10} /> Adviser: {user.advisorySection}
                              </p>
                          )}
                      </div>
                  )}
                  {user.role === UserRole.STUDENT && user.section && (
                      <div className="mt-2">
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                              {user.section}
                          </span>
                      </div>
                  )}
                </td>
                <td className="px-8 py-8 text-right">
                  <button 
                    onClick={() => openEditModal(user)}
                    className={`group px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ml-auto transition-all ${
                      user.role === UserRole.ADMIN ? 'bg-rose-100 text-rose-600' :
                      user.role === UserRole.TEACHER ? 'bg-indigo-100 text-indigo-600' :
                      user.role === UserRole.FACULTY ? 'bg-school-navy text-white' :
                      user.role === UserRole.PENDING ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                      'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {user.role}
                    <Edit size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </td>
                <td className="px-8 py-8 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setResettingUser(user)}
                      className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                      title="Reset Password"
                    >
                      <Key size={20} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Modify Access</h3>
              <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">User: {editingUser.name}</p>
              
              <div className="space-y-4">
                 <div>
                     <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">System Role</label>
                     <select 
                        className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                        value={editForm.role}
                        onChange={e => setEditForm({...editForm, role: e.target.value as UserRole})}
                     >
                        {[UserRole.STUDENT, UserRole.TEACHER, UserRole.TRANSFEREE, UserRole.ADMIN].map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                     </select>
                 </div>

                 {editForm.role === UserRole.TEACHER && (
                     <>
                         <div>
                             <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Assigned Sections</label>
                             <input 
                                type="text" 
                                list="section-suggestions"
                                className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                                placeholder="e.g. Narra, Sampaguita"
                                value={Array.isArray(editForm.assignedSections) ? editForm.assignedSections.join(', ') : editForm.assignedSections || ''}
                                onChange={e => setEditForm({...editForm, assignedSections: e.target.value.split(',').map(s => s.trim())})}
                             />
                             <p className="text-[9px] text-slate-400 mt-2 ml-2">Classes taught (comma separated).</p>
                         </div>
                         <div>
                             <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Advisory Section</label>
                             <input 
                                type="text" 
                                list="section-suggestions"
                                className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                                placeholder="e.g. Narra"
                                value={editForm.advisorySection || ''}
                                onChange={e => setEditForm({...editForm, advisorySection: e.target.value})}
                             />
                             <p className="text-[9px] text-slate-400 mt-2 ml-2">Single section (Class Adviser).</p>
                         </div>
                     </>
                 )}

                 {editForm.role === UserRole.STUDENT && (
                     <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Enrolled Section</label>
                         <input 
                            type="text" 
                            list="section-suggestions"
                            className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                            placeholder="e.g. Narra"
                            value={editForm.section || ''}
                            onChange={e => setEditForm({...editForm, section: e.target.value})}
                         />
                     </div>
                 )}

                 <div className="flex gap-3 pt-4">
                     <button onClick={() => setEditingUser(null)} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 rounded-2xl">Cancel</button>
                     <button onClick={handleUpdateUser} className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg">Save Changes</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddingUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-lg:max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                     <UserPlus size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Register Profile</h3>
                </div>
                <button onClick={() => setIsAddingUser(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X/></button>
              </div>

              {formError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-xs font-bold">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}
              
              <form onSubmit={handleCreateUser} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Full Name</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    placeholder="Enter user's full name"
                    value={createForm.name}
                    onChange={e => setCreateForm({...createForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Email Address</label>
                  <input 
                    type="email" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    placeholder="name@snes.edu.ph"
                    value={createForm.email}
                    onChange={e => setCreateForm({...createForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Initial Role</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    value={createForm.role}
                    onChange={e => setCreateForm({...createForm, role: e.target.value as UserRole})}
                  >
                    <option value={UserRole.STUDENT}>Student</option>
                    <option value={UserRole.TEACHER}>Teacher</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingUser(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-none"
                  >
                    Create User
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Secure Reset</h3>
                <button onClick={() => setResettingUser(null)}><X/></button>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-8 uppercase tracking-widest">Updating access for: <span className="text-indigo-600 font-black">{resettingUser.name}</span></p>
              <input 
                type="text" 
                placeholder="Enter new system password..."
                className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600 mb-6"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
              />
              <button 
                onClick={handlePasswordReset}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl"
              >
                Confirm Override
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;