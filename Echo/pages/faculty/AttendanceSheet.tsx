import React, { useState, useEffect } from 'react';
import { User, AttendanceRecord, UserRole } from '../../types';
import { api } from '../../src/api';
import { Calendar, UserCheck, Save, Loader2, Filter, Search, Layers, X, CheckCircle2 } from 'lucide-react';

const AttendanceSheet: React.FC<{ user: User }> = ({ user }) => {
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
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>(assignedSections[0] || 'All');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Bulk Update State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bulkEndDate, setBulkEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bulkStatus, setBulkStatus] = useState<AttendanceRecord['status']>('present');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, attendanceData] = await Promise.all([
        api.getUsers(selectedSection === 'All' ? '' : selectedSection),
        api.getAttendance('', selectedDate)
      ]);
      
      setStudents(usersData.filter((u: User) => u.role === UserRole.STUDENT));
      setAttendance(attendanceData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedSection, selectedDate]);

  const handleStatusChange = (studentId: string, status: AttendanceRecord['status']) => {
    // Optimistic update
    setAttendance(prev => {
      const existing = prev.find(a => a.studentId === studentId);
      if (existing) {
        return prev.map(a => a.studentId === studentId ? { ...a, status } : a);
      } else {
        return [...prev, { id: 'temp-' + Date.now(), studentId, date: selectedDate, status }];
      }
    });
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const promises = students.map(student => {
        const record = attendance.find(a => a.studentId === student.id);
        const status = record ? record.status : 'present'; // Default to present if not set
        return api.postAttendance({
          studentId: student.id,
          date: selectedDate,
          status
        });
      });
      await Promise.all(promises);
      alert('Attendance saved successfully!');
      fetchData(); // Refresh to get real IDs
    } catch (error) {
      console.error("Failed to save attendance:", error);
      alert("Failed to save attendance.");
    }
    setSaving(false);
  };

  const handleBulkUpdate = async () => {
    if (!bulkStartDate || !bulkEndDate) {
      alert("Please select start and end dates.");
      return;
    }
    
    setSaving(true);
    try {
      const studentIds = students.map(s => s.id);
      await api.postAttendanceBulk({
        studentIds,
        startDate: bulkStartDate,
        endDate: bulkEndDate,
        status: bulkStatus
      });
      alert('Bulk attendance updated successfully!');
      setIsBulkModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to update bulk attendance:", error);
      alert("Failed to update bulk attendance.");
    }
    setSaving(false);
  };

  if (!assignedSections.length && user.role !== UserRole.ADMIN) {
    return <div className="p-10 text-center">No assigned sections found. Please contact an administrator.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Class Attendance</h1>
          <p className="text-slate-500 mt-2 font-medium">Daily attendance tracking for your sections.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-sm hover:scale-105 transition-transform"
          >
            <Layers size={18} /> Bulk Update
          </button>
          <button 
            onClick={saveAttendance}
            disabled={saving || loading}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500">
             <Filter size={20} />
           </div>
           <div className="flex-1">
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Section</label>
             <select 
               className="w-full bg-transparent font-bold text-slate-800 dark:text-white outline-none border-b border-slate-200 dark:border-slate-700 py-2"
               value={selectedSection}
               onChange={e => setSelectedSection(e.target.value)}
             >
               <option value="All">All Students</option>
               {assignedSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
             </select>
           </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500">
             <Calendar size={20} />
           </div>
           <div className="flex-1">
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Date</label>
             <input 
               type="date"
               className="w-full bg-transparent font-bold text-slate-800 dark:text-white outline-none border-b border-slate-200 dark:border-slate-700 py-2"
               value={selectedDate}
               onChange={e => setSelectedDate(e.target.value)}
             />
           </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {students.length > 0 ? students.map(student => {
                const record = attendance.find(a => a.studentId === student.id);
                const status = record?.status || 'present'; // Default visually to present, but ensure save handles it

                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center font-black">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{student.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{student.gradeLevel} - {student.section}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-2">
                        {['present', 'late', 'absent', 'excused'].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(student.id, s as any)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                              status === s 
                                ? s === 'present' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200'
                                : s === 'late' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200'
                                : s === 'absent' ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200'
                                : 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-200'
                                : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={2} className="p-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest">
                    No students found in this section
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Bulk Update Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                     <Layers size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Bulk Attendance</h3>
                </div>
                <button onClick={() => setIsBulkModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X/></button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Start Date</label>
                    <input 
                      type="date"
                      className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm"
                      value={bulkStartDate}
                      onChange={e => setBulkStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">End Date</label>
                    <input 
                      type="date"
                      className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm"
                      value={bulkEndDate}
                      onChange={e => setBulkEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Set Status For All</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['present', 'late', 'absent', 'excused'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setBulkStatus(s as any)}
                        className={`px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                          bulkStatus === s 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                            : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => setIsBulkModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleBulkUpdate}
                    disabled={saving}
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Apply to {students.length} Students
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSheet;