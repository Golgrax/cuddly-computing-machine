
import React from 'react';
import { User, PortfolioProject } from '../../types';
import { Briefcase, Plus, ExternalLink, Image as ImageIcon, FileText, Code } from 'lucide-react';

const Portfolio: React.FC<{ user: User }> = ({ user }) => {
  const projects: PortfolioProject[] = [
    { id: '1', title: 'IT Fundamentals Essay', description: 'A deep dive into the evolution of computers in the 21st century.', category: 'Academic', date: 'Oct 12, 2024', grade: 'A+' },
    { id: '2', title: 'Python Snake Game', description: 'Developed a basic snake game using PyGame library for CS101.', category: 'Project', date: 'Nov 05, 2024', grade: 'Outstanding' },
    { id: '3', title: 'Community Outreach Log', description: 'Record of volunteer hours at the Parañaque health center.', category: 'Social', date: 'Dec 01, 2024' }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">E-Portfolio</h1>
          <p className="text-slate-500 mt-2 font-medium">Showcase your best academic work and creative projects.</p>
        </div>
        <button className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
          <Plus size={20} />
          Add Artifact
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <div key={project.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all group">
            <div className="h-48 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center">
               <ImageIcon size={48} className="text-slate-300 dark:text-slate-600 group-hover:scale-110 transition-transform" />
               <div className="absolute top-4 left-4">
                 <span className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                   {project.category}
                 </span>
               </div>
            </div>
            <div className="p-8">
               <div className="flex justify-between items-start mb-4">
                 <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                 {project.grade && (
                   <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-xl">
                     {project.grade}
                   </span>
                 )}
               </div>
               <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                 {project.description}
               </p>
               <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{project.date}</span>
                 <button className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 group/btn">
                    View Details <ExternalLink size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Portfolio;
