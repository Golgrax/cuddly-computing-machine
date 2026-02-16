import React, { useState, useEffect, useRef } from 'react';
import { User, Grade, UserRole, AttendanceRecord } from '../types';
import { api } from '../src/api'; // Changed from mockApiService
import { 
  Award, TrendingUp, Save, 
  Edit, CheckCircle2, User as UserIcon,
  Printer, FileText, Download, Star, PlusCircle, X, AlertCircle, Trash2, Loader2, Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';

const calculateFinalAverageAndRemarks = (q1: number, q2: number, q3: number, q4: number) => {
    const scores = [q1, q2, q3, q4].filter(x => x > 0);
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    const finalAverage = scores.length > 0 ? parseFloat((sum / scores.length).toFixed(1)) : 0;
    const remarks = finalAverage >= 75 ? 'Passed' : 'Failed';
    return { finalAverage, remarks };
};

const GradesPage: React.FC<{ user: User }> = ({ user }) => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<User[]>([]); // To fetch students for dropdown
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempData, setTempData] = useState<Partial<Grade>>({}); // For editing existing grade
  const [toast, setToast] = useState<string | null>(null);

  // Import/Export State
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Modal states
  const [isAddingGrade, setIsAddingGrade] = useState(false);
  const [createForm, setCreateForm] = useState({ // For creating new grade
    studentId: '',
    studentName: '',
    subject: '',
    q1: 0, q2: 0, q3: 0, q4: 0,
  });
  const [formError, setFormError] = useState('');

  // Preview State
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age.toString();
  };

  const fetchPreview = async () => {
      setPreviewLoading(true);
      setIsPreviewing(true);
      try {
          const response = await fetch('/system2-api/api/generate-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentId: user.id })
          });
          
          if (!response.ok) throw new Error("Failed to generate preview");
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          if (previewPdfUrl) window.URL.revokeObjectURL(previewPdfUrl);
          setPreviewPdfUrl(url);
      } catch (e) {
          console.error(e);
          alert("Failed to load preview.");
      } finally {
          setPreviewLoading(false);
      }
  };

  const isFaculty = user.role === UserRole.FACULTY || user.role === UserRole.TEACHER || user.role === UserRole.ADMIN;

  const load = async () => {
    setLoading(true);
    try {
      const studentId = user.role === UserRole.STUDENT ? user.id : '';
      console.log(`[DEBUG] Loading grades for studentId: "${studentId}" (Role: ${user.role})`);
      const gradesData = await api.getGrades(studentId);
      console.log(`[DEBUG] Grades API response:`, gradesData);
      setGrades(gradesData);

      if (user.role === UserRole.STUDENT) {
        console.log(`[DEBUG] Loading attendance for user.id: "${user.id}"`);
        const attData = await api.getAttendance(user.id);
        console.log(`[DEBUG] Attendance API response:`, attData);
        setAttendance(attData);
      }

      if (isFaculty) {
        const allStudents = await api.getUsers(); 
        setStudents(allStudents.filter(u => u.role === UserRole.STUDENT));
      }
    } catch (error) {
      console.error("Failed to load grades or students:", error);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user.id, user.role]); // Depend on user.role as well

  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!createForm.studentId || !createForm.subject) {
      setFormError('Student and Subject are required.');
      return;
    }

    const selectedStudent = students.find(s => s.id === createForm.studentId);
    if (!selectedStudent) {
      setFormError('Selected student not found.');
      return;
    }

    const { finalAverage, remarks } = calculateFinalAverageAndRemarks(createForm.q1, createForm.q2, createForm.q3, createForm.q4);

    try {
      await api.createGrade({
        ...createForm,
        studentName: selectedStudent.name,
        finalAverage,
        remarks
      });
      setIsAddingGrade(false);
      setCreateForm({ studentId: '', studentName: '', subject: '', q1: 0, q2: 0, q3: 0, q4: 0 });
      load();
      setToast('Grade record created.');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      console.error("Failed to create grade:", error);
      setFormError(`Failed to create grade: ${error.message}`);
    }
  };

  const handleUpdateGrade = async (id: string) => { // Renamed handleSave
    const existing = grades.find(g => g.id === id);
    if (!existing) return;

    const g1 = tempData.q1 ?? existing.q1;
    const g2 = tempData.q2 ?? existing.q2;
    const g3 = tempData.q3 ?? existing.q3;
    const g4 = tempData.q4 ?? existing.q4;
    
    const { finalAverage, remarks } = calculateFinalAverageAndRemarks(g1, g2, g3, g4);

    try {
      await api.updateGrade(id, { 
        ...tempData, 
        studentId: existing.studentId, // Ensure studentId is not lost
        studentName: existing.studentName, // Ensure studentName is not lost
        subject: tempData.subject ?? existing.subject,
        q1: g1, q2: g2, q3: g3, q4: g4,
        finalAverage,
        remarks
      });
      
      setEditingId(null);
      setTempData({});
      setToast('Progress Report Updated');
      setTimeout(() => setToast(null), 2000);
      load();
    } catch (error) {
      console.error("Failed to update grade:", error);
      alert('Failed to update grade.');
    }
  };

  const handleDeleteGrade = async (id: string) => {
    if (confirm('Are you sure you want to delete this grade record?')) {
      try {
        await api.deleteGrade(id);
        load();
        setToast('Grade record deleted.');
        setTimeout(() => setToast(null), 2000);
      } catch (error) {
        console.error("Failed to delete grade:", error);
        alert('Failed to delete grade.');
      }
    }
  };

  const handleExportGrades = () => {
    const ws = XLSX.utils.json_to_sheet(grades);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Grades");
    XLSX.writeFile(wb, `grades_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportGrades = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      if (jsonData.length === 0) {
        alert("No data found in the imported file.");
        setImporting(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const row of jsonData) {
        try {
          const { finalAverage, remarks } = calculateFinalAverageAndRemarks(row.q1 || 0, row.q2 || 0, row.q3 || 0, row.q4 || 0);
          const gradeData = { ...row, finalAverage, remarks };

          if (row.id) {
             // Try to update
             await api.updateGrade(row.id, gradeData);
          } else {
             // Create new
             // Need studentId and subject. If studentId is missing but studentName is there, we might have a problem unless we lookup.
             // Assuming export/import cycle, studentId should be there.
             // If creating from scratch in excel, user must provide studentId or we need a lookup.
             // For now, assume studentId is present in row.
             if (!row.studentId && row.studentName) {
                 // Try to find student by name (fuzzy or exact)
                 const student = students.find(s => s.name === row.studentName);
                 if (student) gradeData.studentId = student.id;
             }

             if (gradeData.studentId && gradeData.subject) {
                 await api.createGrade(gradeData);
             } else {
                 throw new Error("Missing studentId or subject");
             }
          }
          successCount++;
        } catch (err) {
          console.warn("Failed to process row:", row, err);
          failCount++;
        }
      }
      
      setToast(`Import: ${successCount} success, ${failCount} failed`);
      setTimeout(() => setToast(null), 4000);
      load();

    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import grades: " + error.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-school-navy" size={40} />
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-24 right-8 z-[100] bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10">
          <CheckCircle2 className="text-emerald-400" />
          <span className="font-black text-xs uppercase tracking-widest">{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Academic Progress</h1>
          <p className="text-slate-500 mt-2 font-medium">Official Elementary Progress Report Card (Form 138).</p>
        </div>
        <div className="flex gap-3">
          {isFaculty ? (
            <>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                ref={fileInputRef} 
                onChange={handleImportGrades} 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
              >
                {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Import
              </button>
              <button 
                onClick={handleExportGrades}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
              >
                <Download size={16} /> Export
              </button>
              <button 
                onClick={() => setIsAddingGrade(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg"
              >
                <PlusCircle size={16} /> Add Grade
              </button>
            </>
          ) : (
            <div className="flex gap-2">
                <button 
                onClick={() => fetchPreview()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                >
                <FileText size={16} /> Preview SF9
                </button>
                <button 
                onClick={async () => {
                    try {
                    setToast('Preparing PDF...');
                    const response = await fetch('/system2-api/api/generate-pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ studentId: user.id })
                    });

                    if (!response.ok) throw new Error('Generation failed');

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `SF9_${user.name.replace(/\s+/g, '_')}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setToast('PDF Downloaded!');
                    setTimeout(() => setToast(null), 2000);
                    } catch (err) {
                    console.error(err);
                    alert("Failed to download PDF.");
                    }
                }}
                className="px-6 py-3 bg-rose-600 text-white rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                >
                <Download size={16} /> PDF
                </button>
            </div>
          )}
        </div>
      </div>

      {user.role === UserRole.STUDENT && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <Award size={160} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">General Average</p>
                <h3 className="text-5xl font-black">{user.gwa || 'N/A'}</h3>
                {user.honorStatus && (
                    <div className="mt-6 flex items-center gap-2">
                        <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {user.honorStatus}
                        </div>
                    </div>
                )}
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Attendance Rate</p>
                <h3 className="text-5xl font-black text-slate-900 dark:text-white">{user.attendanceRate ? `${user.attendanceRate}%` : 'N/A'}</h3>
                <div className="mt-6 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${user.attendanceRate || 0}%` }}
                    />
                </div>
            </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Areas</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">1st</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">2nd</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">3rd</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">4th</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Final</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Remarks</th>
                {isFaculty && <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {grades.length === 0 ? (
                <tr>
                  <td colSpan={isFaculty ? 8 : 7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300">
                        <Award size={48} />
                      </div>
                      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No grades recorded yet.</p>
                    </div>
                  </td>
                </tr>
              ) : grades.map(grade => {
                const isEditing = editingId === grade.id;
                return (
                  <tr key={grade.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                    <td className="px-8 py-8">
                       <p className="font-black text-slate-800 dark:text-slate-100 text-lg leading-none tracking-tighter">
                         {isEditing ? (
                           <input 
                             type="text" className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-sm outline-none border-2 border-transparent focus:border-indigo-600 transition-all"
                             value={tempData.subject ?? grade.subject}
                             onChange={e => setTempData({...tempData, subject: e.target.value})}
                           />
                         ) : grade.subject}
                       </p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{isFaculty ? grade.studentName : 'Core Academic Module'}</p>
                    </td>
                    {[1, 2, 3, 4].map(q => {
                      const field = `q${q}` as keyof Grade;
                      const val = isEditing ? (tempData[field] ?? (grade[field] as number)) : (grade[field] as number);
                      return (
                        <td key={q} className="px-6 py-8 text-center">
                          {isEditing ? (
                            <input 
                              type="number" className="w-16 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-center outline-none border-2 border-transparent focus:border-indigo-600 transition-all"
                              value={val === 0 ? '' : val}
                              onChange={e => setTempData({...tempData, [field]: parseInt(e.target.value) || 0})}
                            />
                          ) : (
                            <span className={`font-black text-2xl ${val === 0 ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>{val || '-'}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-8 py-8 text-center">
                       <div className="flex justify-center">
                         <span className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 dark:shadow-none">{grade.finalAverage || '-'}</span>
                       </div>
                    </td>
                    <td className="px-8 py-8 text-right">
                       <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase border-2 tracking-widest ${
                         grade.remarks === 'Passed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                       }`}>
                         {grade.remarks}
                       </span>
                    </td>
                    {isFaculty && (
                      <td className="px-8 py-8 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => isEditing ? handleUpdateGrade(grade.id) : (setEditingId(grade.id), setTempData({}))}
                            className={`p-3 rounded-2xl transition-all ${isEditing ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white'}`}
                            title={isEditing ? "Save Changes" : "Edit Grade"}
                          >
                            {isEditing ? <Save size={18}/> : <Edit size={18}/>}
                          </button>
                                                    {!isEditing && (
                                                      <>
                                                        <button 
                                                          onClick={async () => {
                                                            try {
                                                              const response = await fetch('/system2-api/api/generate-excel', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ 
                                                                  studentId: grade.studentId,
                                                                  role: 'teacher' 
                                                                })
                                                              });
                          
                                                              if (!response.ok) throw new Error('Generation failed');
                          
                                                              const blob = await response.blob();
                                                              const url = window.URL.createObjectURL(blob);
                                                              const a = document.createElement('a');
                                                              a.href = url;
                                                              a.download = `SF9_${grade.studentName.replace(/\s+/g, '_')}.xlsx`;
                                                              document.body.appendChild(a);
                                                              a.click();
                                                              a.remove();
                                                            } catch (err) {
                                                              console.error(err);
                                                              alert("Failed to download SF9.");
                                                            }
                                                          }}
                                                          className="p-3 bg-slate-100 text-slate-400 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all"
                                                          title="Download SF9 (XLSX)"
                                                        >
                                                          <Download size={18} />
                                                        </button>
                                                        <button 
                                                          onClick={() => handleDeleteGrade(grade.id)}
                                                          className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                                                          title="Delete Grade"
                                                        >
                                                          <Trash2 size={18} />
                                                        </button>
                                                      </>
                                                    )}                          </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* Preview Modal */}
      {isPreviewing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <FileText className="text-indigo-600" /> 
                        SF9 High-Fidelity Preview
                    </h3>
                    <div className="flex gap-4">
                        <button onClick={() => {
                            setIsPreviewing(false);
                            if (previewPdfUrl) window.URL.revokeObjectURL(previewPdfUrl);
                            setPreviewPdfUrl('');
                        }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X/></button>
                    </div>
                </div>
                
                <div className="flex-1 bg-slate-200/50 dark:bg-black/20 overflow-auto p-0 flex justify-center">
                    {previewLoading ? (
                        <div className="flex items-center justify-center h-full w-full">
                            <Loader2 className="animate-spin text-indigo-600" size={48} />
                        </div>
                    ) : (
                        <div className="w-full h-full">
                            <iframe 
                                src={previewPdfUrl} 
                                className="w-full h-full border-none" 
                                title="SF9 Preview"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Add Grade Modal */}
      {isAddingGrade && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                     <PlusCircle size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Add New Grade</h3>
                </div>
                <button onClick={() => setIsAddingGrade(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X/></button>
              </div>

              {formError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-xs font-bold">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}
              
              <form onSubmit={handleCreateGrade} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Learner</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    value={createForm.studentId}
                    onChange={e => setCreateForm({...createForm, studentId: e.target.value})}
                    required
                  >
                    <option value="">Select Learner</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Subject</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                    placeholder="e.g., Math, Science"
                    value={createForm.subject}
                    onChange={e => setCreateForm({...createForm, subject: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(q => (
                    <div key={`q${q}`}>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Q{q} Grade</label>
                      <input 
                        type="number" required
                        className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                        value={createForm[`q${q}` as keyof typeof createForm]}
                        onChange={e => setCreateForm({...createForm, [`q${q}`]: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingGrade(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-none"
                  >
                    Add Grade
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default GradesPage;