import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(`/api/verify?token=${token}`);
        if (response.ok) {
          setStatus('success');
        } else {
          const data = await response.json();
          setStatus('error');
          setMessage(data.message || 'Verification failed.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-[3rem] shadow-xl max-w-md w-full text-center">
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="animate-spin text-indigo-600" />
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">Verifying Identity...</h2>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-6 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2">Email Verified</h2>
              <p className="text-sm font-medium text-slate-500">Your email address has been successfully confirmed. You may now wait for administrative approval.</p>
            </div>
            <Link to="/" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg hover:scale-105 transition-transform">
              Return to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-6 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
              <XCircle size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2">Verification Failed</h2>
              <p className="text-sm font-medium text-rose-500">{message}</p>
            </div>
            <Link to="/" className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors">
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;