import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Download, UserCheck, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

const StudentID: React.FC<{ user: User }> = ({ user }) => {
  const [frontSide, setFrontSide] = useState<string | null>(null);
  const [backSide, setBackSide] = useState<string | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const schoolYear = user.schoolYear || "2025-2026";

  useEffect(() => {
    const fetchID = async () => {
      try {
        setLoading(true);
        // Fetch Front Side
        const frontRes = await fetch('/api/system1/generate-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user, side: 'front' })
        });
        const frontBlob = await frontRes.blob();
        setFrontSide(URL.createObjectURL(frontBlob));

        // Fetch Back Side
        const backRes = await fetch('/api/system1/generate-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user, side: 'back' })
        });
        const backBlob = await backRes.blob();
        setBackSide(URL.createObjectURL(backBlob));
      } catch (err) {
        console.error("Failed to fetch ID:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchID();
    
    // Cleanup URLs on unmount
    return () => {
      if (frontSide) URL.revokeObjectURL(frontSide);
      if (backSide) URL.revokeObjectURL(backSide);
    };
  }, [user]);

  const handleDownload = async () => {
    if (!frontSide || !backSide) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
    };

    try {
      const frontImg = await loadImage(frontSide);
      const backImg = await loadImage(backSide);

      // ID Card Dimensions (Credit Card Size Ratio)
      // A4 width = 210mm
      const cardWidth = 85.6; // Standard ID width in mm
      const cardHeight = 135;  // Height for this specific vertical ID

      const x = (210 - cardWidth) / 2; // Center horizontally
      
      // Add Front
      pdf.text("OFFICIAL LEARNER ID (FRONT)", 105, 20, { align: 'center' });
      const canvasFront = document.createElement('canvas');
      canvasFront.width = frontImg.width;
      canvasFront.height = frontImg.height;
      const ctxFront = canvasFront.getContext('2d');
      ctxFront?.drawImage(frontImg, 0, 0);
      pdf.addImage(canvasFront.toDataURL('image/png'), 'PNG', x, 30, cardWidth, cardHeight);

      // Add Back (New Page or Below)
      // Let's put it on the same page if it fits, otherwise new page. 
      // 30 (y) + 135 (height) = 165. A4 height is 297. It fits.
      
      pdf.text("OFFICIAL LEARNER ID (BACK)", 105, 180, { align: 'center' });
      const canvasBack = document.createElement('canvas');
      canvasBack.width = backImg.width;
      canvasBack.height = backImg.height;
      const ctxBack = canvasBack.getContext('2d');
      ctxBack?.drawImage(backImg, 0, 0);
      pdf.addImage(canvasBack.toDataURL('image/png'), 'PNG', x, 190, cardWidth, cardHeight);

      pdf.save(`Student-ID-${user.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 animate-in fade-in duration-500">
        <Loader2 className="w-16 h-16 text-school-navy animate-spin" />
        <div className="text-center">
          <p className="text-xl font-black text-school-navy tracking-widest uppercase">Generating Official ID</p>
          <p className="text-slate-500 font-medium">Preparing secure digital credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-4xl mx-auto pb-20">
      <div className="text-center">
        <h1 className="text-4xl font-black text-school-navy dark:text-white tracking-tight uppercase">Digital Learner ID</h1>
        <p className="text-slate-500 mt-2 font-medium">Official identity card for Academic Year {schoolYear}.</p>
      </div>

      <div className="flex flex-col items-center gap-10">
        {/* ID CARD PREVIEW CONTAINER */}
        <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-tr from-school-navy/20 to-indigo-500/20 rounded-[2.5rem] blur-2xl group-hover:opacity-75 transition duration-1000"></div>
            <div 
                className="relative shadow-2xl rounded-2xl overflow-hidden bg-white border-8 border-white ring-1 ring-slate-200"
                style={{ width: '400px', height: '635px' }}
            >
                <img 
                    src={showBack ? backSide! : frontSide!} 
                    alt="ID Card" 
                    className="w-full h-full object-contain"
                />
            </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
            <button 
                onClick={() => setShowBack(!showBack)}
                className="px-10 py-5 bg-white text-school-navy border-2 border-slate-100 rounded-2xl flex items-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl hover:bg-slate-50 hover:border-slate-200 transition-all hover:-translate-y-1 active:translate-y-0"
            >
                <UserCheck size={20} /> Flip to {showBack ? 'Front' : 'Back'}
            </button>
            <button 
                onClick={handleDownload}
                className="px-10 py-5 bg-school-navy text-white rounded-2xl flex items-center gap-3 text-sm font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all hover:-translate-y-1 active:translate-y-0 shadow-indigo-500/20"
            >
                <Download size={20} /> Download PDF
            </button>
        </div>

        <div className="max-w-md text-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Usage Notice</p>
            <p className="text-sm text-slate-600 leading-relaxed">
                This digital ID is a valid representation of your student records. Keep it secure and do not share your LRN or QR code with unauthorized persons.
            </p>
        </div>
      </div>
    </div>
  );
};

export default StudentID;