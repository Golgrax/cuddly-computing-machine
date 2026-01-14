import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { api } from '../src/api';
import { Search, Check, X, Users, GraduationCap, Briefcase, User as UserIcon } from 'lucide-react';

export interface RecipientTarget {
  type: 'user' | 'role' | 'section';
  value: string;
  label: string;
}

interface RecipientSelectorProps {
  user: User;
  selected: RecipientTarget[];
  onChange: (targets: RecipientTarget[]) => void;
}

const RecipientSelector: React.FC<RecipientSelectorProps> = ({ user, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<RecipientTarget[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [users, sections] = await Promise.all([
          api.getUsers(),
          api.getSections().catch(() => [])
        ]);

        const newOptions: RecipientTarget[] = [];
        const isTeacher = user.role === UserRole.TEACHER;
        const assignedSections = user.assignedSections || [];

        // Roles (Only for Admin/Faculty)
        if (!isTeacher) {
            [UserRole.STUDENT, UserRole.TEACHER, UserRole.FACULTY, UserRole.ADMIN].forEach(role => {
               newOptions.push({ type: 'role', value: role, label: `All ${role}s` });
            });
        }

        // Sections
        if (sections.length > 0) {
            sections.forEach((s: any) => {
                if (!isTeacher || assignedSections.includes(s.name)) {
                    newOptions.push({ type: 'section', value: s.name, label: `Section: ${s.name}` });
                }
            });
        } else {
            // Derive sections
            const uniqueSections = new Set<string>();
            users.forEach((u: User) => { 
                if (u.section && (!isTeacher || assignedSections.includes(u.section))) {
                    uniqueSections.add(u.section); 
                }
            });
            uniqueSections.forEach(s => {
                newOptions.push({ type: 'section', value: s, label: `Section: ${s}` });
            });
        }

        // Users
        users.forEach((u: User) => {
            // Filter users: 
            // If Teacher: only show students in assigned sections.
            // If Admin/Faculty: show everyone.
            
            let include = true;
            if (isTeacher) {
                if (u.role !== UserRole.STUDENT) include = false; // Teachers can't message other staff via this tool (per requirement)
                if (u.role === UserRole.STUDENT && u.section && !assignedSections.includes(u.section)) include = false;
            }

            if (include) {
                newOptions.push({ type: 'user', value: u.id, label: `${u.name} (${u.role})` });
            }
        });

        setOptions(newOptions);
      } catch (err) {
        console.error("Failed to load recipients", err);
      }
    };
    loadOptions();

    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(query.toLowerCase()) && 
    !selected.some(s => s.value === opt.value && s.type === opt.type)
  );

  const toggleSelection = (target: RecipientTarget) => {
    const exists = selected.find(s => s.value === target.value && s.type === target.type);
    if (exists) {
      onChange(selected.filter(s => s !== exists));
    } else {
      onChange([...selected, target]);
    }
    setQuery('');
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'role': return <Briefcase size={14} />;
          case 'section': return <Users size={14} />;
          case 'user': return <UserIcon size={14} />;
          default: return <Check size={14} />;
      }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="min-h-[60px] w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-sm focus-within:ring-2 focus-within:ring-indigo-500 cursor-text flex flex-wrap gap-2 items-center"
        onClick={() => setIsOpen(true)}
      >
        {selected.map((item, idx) => (
          <span key={idx} className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide">
            {getIcon(item.type)}
            {item.label}
            <button 
              onClick={(e) => { e.stopPropagation(); toggleSelection(item); }}
              className="hover:text-indigo-900 dark:hover:text-indigo-100"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input 
          type="text" 
          className="bg-transparent outline-none flex-1 min-w-[120px] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
          placeholder={selected.length === 0 ? "Search users, roles, or sections..." : ""}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        <Search className="text-slate-400 ml-auto" size={18} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 max-h-60 overflow-y-auto z-50 p-2 space-y-1">
          {filteredOptions.length > 0 ? filteredOptions.map((opt, idx) => (
            <button
              key={`${opt.type}-${opt.value}`}
              onClick={() => toggleSelection(opt)}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors group"
            >
              <div className={`p-2 rounded-lg ${opt.type === 'role' ? 'bg-amber-50 text-amber-600' : opt.type === 'section' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                 {getIcon(opt.type)}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{opt.label}</span>
              <Check size={14} className="ml-auto opacity-0 group-hover:opacity-100 text-indigo-600" />
            </button>
          )) : (
            <div className="p-4 text-center text-slate-400 text-xs font-bold">No matches found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecipientSelector;