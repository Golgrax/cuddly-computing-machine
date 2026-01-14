import React, { useState, useEffect } from 'react';
import { api } from '../../src/api';
import { 
  Database, Download, Search, Plus, Trash2, Loader2, Activity, FileSpreadsheet, X, ChevronRight, ChevronLeft, Save, Archive
} from 'lucide-react';
import * as XLSX from 'xlsx';

const DatabaseViewer: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);
  
  // Edit state
  const [editingCell, setEditingCell] = useState<{ rowId: string, field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Add Record State
  const [isAdding, setIsAdding] = useState(false);
  const [newRecord, setNewRecord] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const tableList = await api.getTables();
        setTables(tableList);
        if (tableList.length > 0) {
          setActiveTab(tableList[0]);
        }
      } catch (error) {
        console.error("Failed to fetch tables:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  useEffect(() => {
    if (!activeTab) return;
    const fetchTableData = async () => {
      setDataLoading(true);
      try {
        const [data, info] = await Promise.all([
          api.getTableData(activeTab),
          api.getTableInfo(activeTab)
        ]);
        setTableData(data);
        setTableColumns(info);
      } catch (error) {
        console.error(`Failed to fetch data for ${activeTab}:`, error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchTableData();
  }, [activeTab]);

  const handleCellEdit = (rowId: string, field: string, value: any) => {
    setEditingCell({ rowId, field });
    setEditValue(value === null ? '' : String(value));
  };

  const saveCell = async () => {
    if (!editingCell) return;
    try {
      await api.updateTableRecord(activeTab, editingCell.rowId, { [editingCell.field]: editValue });
      // Optimistic update
      setTableData(prev => prev.map(row => row.id === editingCell.rowId ? { ...row, [editingCell.field]: editValue } : row));
      setEditingCell(null);
    } catch (error) {
      console.error("Failed to update record:", error);
      alert("Failed to update record.");
    }
  };

  const deleteRow = async (id: string) => {
    if (confirm('Delete this record permanently from the database?')) {
      try {
        await api.deleteTableRecord(activeTab, id);
        setTableData(prev => prev.filter(row => row.id !== id));
      } catch (error) {
        console.error("Failed to delete record:", error);
        alert("Failed to delete record.");
      }
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out empty fields if necessary, or send as is
      const recordToSave = { ...newRecord };
      // Generate ID if not provided (assuming text IDs like other tables)
      if (!recordToSave.id) {
         recordToSave.id = `${activeTab.substring(0, 3)}-${Date.now()}`;
      }

      await api.insertTableRecord(activeTab, recordToSave);
      
      // Refresh data
      const data = await api.getTableData(activeTab);
      setTableData(data);
      
      setIsAdding(false);
      setNewRecord({});
    } catch (error) {
      console.error("Failed to add record:", error);
      alert(`Failed to add record: ${error.message}`);
    }
  };

  const exportCSV = () => {
    if (tableData.length === 0) return;
    const headers = tableColumns.map(c => c.name);
    const csvContent = [
      headers.join(','), 
      ...tableData.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_export.csv`;
    a.click();
  };

  const exportAllTables = async () => {
      setExporting(true);
      try {
          const wb = XLSX.utils.book_new();
          
          for (const tableName of tables) {
              const data = await api.getTableData(tableName);
              if (data && data.length > 0) {
                  const ws = XLSX.utils.json_to_sheet(data);
                  XLSX.utils.book_append_sheet(wb, ws, tableName.substring(0, 31)); // Excel sheet name limit
              }
          }
          
          XLSX.writeFile(wb, `full_database_export_${new Date().toISOString().split('T')[0]}.xlsx`);
          alert("Full database export complete!");
      } catch (error) {
          console.error("Export failed:", error);
          alert("Failed to export database.");
      }
      setExporting(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <Loader2 size={40} className="animate-spin text-indigo-600" />
      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Loading Database...</p>
    </div>
  );

  const filteredRows = tableData.filter(row => 
    Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[100vw] overflow-hidden pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white dark:bg-slate-900 text-school-navy dark:text-school-gold rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
               <Database size={24} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Database Forge</h1>
          </div>
          <p className="text-slate-500 font-bold italic text-sm ml-1 opacity-80">Direct SQL Table Control. Full CRUD Access.</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={exportAllTables}
            disabled={exporting}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Archive size={18} />}
            Export DB (XLSX)
          </button>
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-3 px-8 py-4 bg-[#00A36C] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:opacity-90 active:scale-95 transition-all">
            <Plus size={18} /> Add Record
          </button>
          <button onClick={exportCSV} className="flex items-center gap-3 px-8 py-4 bg-[#1A1F2C] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:opacity-90 active:scale-95 transition-all">
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table Selector */}
      <div className="relative group px-2">
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scroll-smooth no-scrollbar mask-fade-edges">
          {tables.map((table) => (
            <button
              key={table}
              onClick={() => { setActiveTab(table); setEditingCell(null); }}
              className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all flex items-center gap-3 border-2 shrink-0 ${ 
                activeTab === table 
                  ? 'bg-white border-school-navy text-school-navy shadow-lg ring-4 ring-indigo-500/10 dark:bg-slate-800 dark:border-school-gold dark:text-school-gold' 
                  : 'bg-white border-slate-100 text-slate-400 dark:bg-slate-900 dark:border-slate-800 hover:text-slate-600 hover:border-slate-200'
              }`}
            >
              {table}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col transition-colors">
        <div className="px-12 py-10 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row gap-6 justify-between items-center bg-slate-50/20 dark:bg-slate-800/20">
          <div className="flex items-center gap-6">
             <div className="p-4 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                <FileSpreadsheet size={32} className="text-school-navy dark:text-school-gold" />
             </div>
             <div>
               <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">{activeTab}</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{tableData.length} Records Found</p>
             </div>
          </div>
          
          <div className="relative w-full md:w-[420px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" placeholder={`Filter ${activeTab} records...`}
              className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] text-sm font-bold outline-none focus:border-school-navy dark:focus:border-school-gold shadow-sm transition-all placeholder:text-slate-300"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {dataLoading ? (
             <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-10 py-7 border-r border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-20">#</th>
                  {tableColumns.map(col => (
                    <th key={col.name} className="px-10 py-7 border-r border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-[0.2em] text-left min-w-[200px]">
                      {col.name} <span className="text-[8px] text-slate-300 lowercase">({col.type})</span>
                    </th>
                  ))}
                  <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 min-h-[400px]">
                {filteredRows.length > 0 ? filteredRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/30 dark:hover:bg-indigo-900/5 transition-colors group">
                    <td className="px-10 py-8 border-r border-slate-100 dark:border-slate-700 text-[11px] font-black text-slate-300 dark:text-slate-600 text-center">{idx + 1}</td>
                    {tableColumns.map(col => {
                      const h = col.name;
                      const isEditing = editingCell?.rowId === row.id && editingCell?.field === h;
                      const isId = h === 'id';
                      return (
                        <td 
                          key={h} 
                          className={`px-10 py-8 border-r border-slate-100 dark:border-slate-700 transition-all ${!isId ? 'cursor-text' : ''} ${isEditing ? 'bg-white dark:bg-slate-800 ring-4 ring-indigo-500/10 z-10 relative' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`}
                          onClick={() => !isEditing && !isId && handleCellEdit(row.id, h, row[h])}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                               <input 
                                autoFocus 
                                className="w-full bg-transparent border-none outline-none font-black text-sm text-school-navy dark:text-school-gold"
                                value={editValue} 
                                onChange={e => setEditValue(e.target.value)} 
                                onBlur={saveCell} 
                                onKeyDown={e => e.key === 'Enter' && saveCell()}
                              />
                              <button onClick={saveCell} className="p-1 bg-school-navy text-white rounded-md"><Save size={12} /></button>
                            </div>
                          ) : (
                            <div className="max-w-[450px] truncate text-sm font-bold text-slate-700 dark:text-slate-300">
                              {row[h] === null ? <span className="text-slate-200 italic font-medium">null</span> : String(row[h])}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-10 py-8 text-center">
                      <button onClick={() => deleteRow(row.id)} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-[1.25rem] transition-all">
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={tableColumns.length + 2} className="p-48 text-center bg-slate-50/10">
                      <div className="flex flex-col items-center gap-8 opacity-20 dark:opacity-40">
                        <Activity size={100} className="text-slate-400 dark:text-slate-600" strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 dark:text-slate-400">Empty Table Recordset</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Record Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-8 flex-shrink-0">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                     <Plus size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Add to {activeTab}</h3>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X/></button>
              </div>
              
              <form onSubmit={handleAddRecord} className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tableColumns.map(col => (
                    <div key={col.name}>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">
                        {col.name} <span className="opacity-50 lowercase">({col.type})</span>
                      </label>
                      <input 
                        type={col.type === 'INTEGER' || col.type === 'REAL' ? 'number' : 'text'}
                        className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-600"
                        placeholder={col.name === 'id' ? 'Auto-generated if empty' : `Enter ${col.name}`}
                        value={newRecord[col.name] || ''}
                        onChange={e => setNewRecord({...newRecord, [col.name]: e.target.value})}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-8 flex gap-4 mt-auto">
                  <button 
                    type="button" 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 dark:shadow-none"
                  >
                    Insert Record
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseViewer;
