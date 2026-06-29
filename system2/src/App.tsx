import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FileText, Download, CheckCircle } from 'lucide-react';

interface UserData {
  name: string;
  age: string;
  sex: string;
  lrn: string;
  grade: string;
  section: string;
}

function App() {
  const [role, setRole] = useState<'admin' | 'teacher' | 'student'>('admin');
  const [userData, setUserData] = useState<UserData>({
    name: 'Carlo Dela Cruz',
    age: '10',
    sex: 'MALE',
    lrn: '123456789012',
    grade: 'FIVE',
    section: 'RIZAL'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadExcel = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData, role })
      });
      
      if (!res.ok) throw new Error('Generation failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = userData.name.replace(/\s+/g, '_');
      a.download = `SF9_${safeName}_${role}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to generate report card.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-primary text-white p-4">
              <div className="d-flex align-items-center">
                <FileText className="me-3" size={32} />
                <div>
                  <h4 className="mb-0">SF9 Report Generator</h4>
                  <small className="opacity-75">Local Office Ready (LibreOffice/Excel)</small>
                </div>
              </div>
            </div>
            
            <div className="card-body p-4">
              {/* Role Selection */}
              <div className="mb-4">
                <label className="form-label fw-bold text-secondary small text-uppercase">Log-in Role (Simulated)</label>
                <div className="btn-group w-100" role="group">
                  <button 
                    type="button" 
                    className={`btn ${role === 'admin' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setRole('admin')}
                  >
                    Admin
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${role === 'teacher' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setRole('teacher')}
                  >
                    Teacher
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${role === 'student' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setRole('student')}
                  >
                    Student
                  </button>
                </div>
                <div className="mt-2 text-center">
                  <span className="badge bg-light text-dark border">
                    {role === 'student' ? 'Limited: 2 Sheets Only' : 'Full Access: All Sheets'}
                  </span>
                </div>
              </div>

              <hr className="my-4 opacity-10" />

              <h6 className="fw-bold text-secondary small text-uppercase mb-3">Student Data Entry</h6>
              
              <div className="form-floating mb-3">
                <input 
                  type="text" 
                  className="form-control" 
                  id="nameInput"
                  placeholder="Full Name"
                  value={userData.name}
                  onChange={(e) => setUserData({...userData, name: e.target.value})}
                />
                <label htmlFor="nameInput">Student Full Name</label>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <div className="form-floating">
                    <input 
                      type="text" 
                      className="form-control" 
                      id="lrnInput"
                      placeholder="LRN"
                      value={userData.lrn}
                      onChange={(e) => setUserData({...userData, lrn: e.target.value})}
                    />
                    <label htmlFor="lrnInput">LRN (12 Digits)</label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-floating">
                    <input 
                      type="text" 
                      className="form-control" 
                      id="ageInput"
                      placeholder="Age"
                      value={userData.age}
                      onChange={(e) => setUserData({...userData, age: e.target.value})}
                    />
                    <label htmlFor="ageInput">Current Age</label>
                  </div>
                </div>
              </div>

              <div className="d-grid gap-3 mt-5">
                <button 
                  className={`btn btn-success btn-lg py-3 rounded-pill shadow-sm d-flex align-items-center justify-content-center ${isGenerating ? 'disabled' : ''}`}
                  onClick={handleDownloadExcel}
                >
                  {isGenerating ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <Download size={24} className="me-2" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate & Download XLSX'}
                </button>
              </div>

              <div className="mt-4 p-3 bg-light rounded-3 small text-muted border-start border-4 border-info">
                <div className="d-flex">
                  <CheckCircle size={16} className="me-2 text-info flex-shrink-0" />
                  <div>
                    <strong>LibreOffice Ready:</strong> The downloaded file is perfectly formatted for local viewing and printing in LibreOffice or MS Excel.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center mt-4 text-muted small">
            System 2: Excel Evolution Edition
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;