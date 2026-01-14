import React, { useState, useEffect } from 'react';
import { Facility } from '../../types';
import { api } from '../../src/api'; // Changed from mockApiService
import { 
  Box, CheckCircle, Clock, AlertTriangle, MoreVertical, Loader2,
  PlusCircle, X, AlertCircle, Edit, Trash2
} from 'lucide-react';

const AdminFacilities: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal states
  const [isAddingFacility, setIsAddingFacility] = useState(false);
  const [isEditingFacility, setIsEditingFacility] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    status: 'available' as Facility['status'],
    lastCleaned: new Date().toLocaleDateString('en-CA') // YYYY-MM-DD for input type="date"
  });
  const [editForm, setEditForm] = useState<Facility | null>(null);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getFacilities();
      setFacilities(data);
    } catch (error) {
      console.error("Failed to fetch facilities:", error);
      // Optionally set an error state to display to the user
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleStatus = async (id: string, currentStatus: Facility['status']) => {
    setUpdatingId(id);
    const nextStatuses: Record<Facility['status'], Facility['status']> = {
      'available': 'reserved',
      'reserved': 'maintenance',
      'maintenance': 'available'
    };
    
    try {
      await api.updateFacility(id, { 
        status: nextStatuses[currentStatus],
        lastCleaned: new Date().toLocaleDateString('en-CA')
      });
      fetchData(); // Refresh data after update
    } catch (error) {
      console.error("Failed to update facility status:", error);
      alert('Failed to update facility status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!createForm.name) {
      setFormError('Facility name is required.');
      return;
    }
    try {
      await api.createFacility(createForm);
      setIsAddingFacility(false);
      setCreateForm({ name: '', status: 'available', lastCleaned: new Date().toLocaleDateString('en-CA') });
      fetchData();
    } catch (error) {
      console.error("Failed to create facility:", error);
      setFormError(`Failed to create facility: ${error.message}`);
    }
  };

  const handleEditClick = (facility: Facility) => {
    setSelectedFacility(facility);
    setEditForm(facility);
    setIsEditingFacility(true);
  };

  const handleEditFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!editForm?.name) {
      setFormError('Facility name is required.');
      return;
    }
    if (!selectedFacility) return;

    try {
      await api.updateFacility(selectedFacility.id, editForm);
      setIsEditingFacility(false);
      setSelectedFacility(null);
      setEditForm(null);
      fetchData();
    } catch (error) {
      console.error("Failed to update facility:", error);
      setFormError(`Failed to update facility: ${error.message}`);
    }
  };

  const handleDeleteFacility = async (id: string) => {
    if (confirm('Are you sure you want to delete this facility?')) {
      try {
        await api.deleteFacility(id);
        fetchData();
      } catch (error) {
        console.error("Failed to delete facility:", error);
        alert('Failed to delete facility.');
      }
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-school-navy" size={40} />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Facility Management</h1>
          <p className="text-slate-500 mt-2 font-medium">Monitoring classroom status and school property health.</p>
        </div>
        <button 
          onClick={() => setIsAddingFacility(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-xl"
        >
          <PlusCircle size={20} />
          Add Facility
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {facilities.map(f => (
          <div key={f.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${
              f.status === 'available' ? 'bg-emerald-50 text-emerald-600' :
              f.status === 'reserved' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <Box size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">{f.name}</h3>
            
            <button 
              onClick={() => toggleStatus(f.id, f.status)}
              disabled={updatingId === f.id}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all mb-8 flex items-center gap-2 ${
                f.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                f.status === 'reserved' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {updatingId === f.id ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
              {f.status}
            </button>

            <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                 <Clock size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Sanitized: {f.lastCleaned}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEditClick(f)}
                  className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                  title="Edit Facility"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteFacility(f.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                  title="Delete Facility"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Facility Modal */}
      {isAddingFacility && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                     <PlusCircle size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Add New Facility</h3>
                </div>
                <button onClick={() => setIsAddingFacility(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X/></button>
              </div>

              {formError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-xs font-bold">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}
              
              <form onSubmit={handleCreateFacility} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Facility Name</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    placeholder="e.g., Science Lab, Grade 5 - Sampaguita"
                    value={createForm.name}
                    onChange={e => setCreateForm({...createForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Status</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    value={createForm.status}
                    onChange={e => setCreateForm({...createForm, status: e.target.value as Facility['status']})}
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Last Cleaned Date</label>
                  <input 
                    type="date" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    value={createForm.lastCleaned}
                    onChange={e => setCreateForm({...createForm, lastCleaned: e.target.value})}
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingFacility(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-none"
                  >
                    Add Facility
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Edit Facility Modal */}
      {isEditingFacility && selectedFacility && editForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                     <Edit size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Edit Facility</h3>
                </div>
                <button onClick={() => setIsEditingFacility(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X/></button>
              </div>

              {formError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-xs font-bold">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}
              
              <form onSubmit={handleEditFacility} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Facility Name</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    placeholder="e.g., Science Lab, Grade 5 - Sampaguita"
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Status</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    value={editForm.status}
                    onChange={e => setEditForm({...editForm, status: e.target.value as Facility['status']})}
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Last Cleaned Date</label>
                  <input 
                    type="date" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    value={editForm.lastCleaned}
                    onChange={e => setEditForm({...editForm, lastCleaned: e.target.value})}
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsEditingFacility(false)}
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

export default AdminFacilities;