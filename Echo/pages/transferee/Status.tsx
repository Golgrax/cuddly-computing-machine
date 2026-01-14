
import React, { useState, useEffect } from 'react';
import { User, EnrollmentApplication } from '../../types';
import { api } from '../../mockApiService';
import { Search, Loader2, CheckCircle, Clock, XCircle, MoreVertical } from 'lucide-react';

const TransfereeStatus: React.FC<{ user: User }> = ({ user }) => {
  const [applications, setApplications] = useState<EnrollmentApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEnrollmentApplications().then(data => {
      setApplications(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'approved': return { color: 'text-green-600 bg-green-50', icon: CheckCircle, label: 'Approved' };
      case 'rejected': return { color: 'text-red-600 bg-red-50', icon: XCircle, label: 'Rejected' };
      default: return { color: 'text-amber-600 bg-amber-50', icon: Clock, label: 'Pending Review' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Application Status</h1>
        <p className="text-slate-500">Track the progress of your admission requests.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {applications.length > 0 ? applications.map((app) => {
          const status = getStatusInfo(app.status);
          return (
            <div key={app.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${status.color}`}>
                    <status.icon size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Enrollment Application #{app.id}</h3>
                    <p className="text-sm text-slate-500">Applied on {app.dateApplied}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                         {status.label}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 w-full md:w-auto border-t md:border-0 pt-4 md:pt-0">
                  <button className="w-full md:w-auto px-6 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors">
                    View Details
                  </button>
                  <p className="text-[10px] text-slate-400">Reference: REF-{app.id.toUpperCase()}</p>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
             <Clock className="mx-auto mb-4 text-slate-300" size={48} />
             <p className="text-lg font-bold text-slate-500">No applications found</p>
             <p className="text-sm text-slate-400">Start your journey by clicking the Enrollment menu.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransfereeStatus;
