
import { 
  User, UserRole, Announcement, Grade, 
  Module, Assignment, EnrollmentApplication, ScheduleItem, 
  Submission, AttendanceRecord,
  SchoolEvent, ActivityLog, ClearanceItem, DropoutRequest, Section,
  SMSLog, LibraryResource, Facility, HealthRecord, DocumentRequest, LockoutInfo,
  FeeRecord
} from './types';

/**
 * SQLite-like abstraction for client-side storage.
 * In a real-world scenario, this might use WASM-based SQLite (sql.js) 
 * or IndexedDB. Here we use a table-based LocalStorage structure.
 */
class SchemaEngine {
  private prefix = 'snes_db_';

  private getTable<T>(name: string): T[] {
    const data = localStorage.getItem(this.prefix + name);
    return data ? JSON.parse(data) : [];
  }

  private saveTable<T>(name: string, data: T[]): void {
    localStorage.setItem(this.prefix + name, JSON.stringify(data));
  }

  query<T>(table: string, filter?: (item: T) => boolean): T[] {
    const data = this.getTable<T>(table);
    return filter ? data.filter(filter) : data;
  }

  insert<T>(table: string, item: T): T {
    const data = this.getTable<T>(table);
    data.unshift(item);
    this.saveTable(table, data);
    return item;
  }

  update<T extends { id: string }>(table: string, id: string, patch: Partial<T>): void {
    const data = this.getTable<T>(table);
    const idx = data.findIndex(i => i.id === id);
    if (idx > -1) {
      data[idx] = { ...data[idx], ...patch };
      this.saveTable(table, data);
    }
  }

  delete<T extends { id: string }>(table: string, id: string): void {
    const data = this.getTable<T>(table);
    this.saveTable(table, data.filter(i => i.id !== id));
  }

  replaceTable<T>(table: string, data: T[]): void {
    this.saveTable(table, data);
  }

  getRawStorage(): Record<string, any[]> {
    const result: Record<string, any[]> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        const tableName = key.replace(this.prefix, '');
        if (tableName !== 'PASSWORDS') {
           result[tableName] = JSON.parse(localStorage.getItem(key) || '[]');
        }
      }
    }
    return result;
  }
}

const db = new SchemaEngine();

const TABLES = {
  USERS: 'users',
  PASSWORDS: 'passwords',
  GRADES: 'grades',
  ANNOUNCEMENTS: 'announcements',
  ENROLLMENT: 'enrollment',
  SCHEDULE: 'schedule',
  MODULES: 'modules',
  ASSIGNMENTS: 'assignments',
  SUBMISSIONS: 'submissions',
  ATTENDANCE: 'attendance',
  EVENTS: 'events',
  LOGS: 'activity_logs',
  CLEARANCE: 'clearance',
  DROPOUTS: 'dropouts',
  SECTIONS: 'sections',
  SMS: 'sms_logs',
  LIBRARY: 'library',
  FACILITIES: 'facilities',
  HEALTH: 'health',
  DOC_REQUESTS: 'doc_requests',
  LOCKOUT: 'security_lockout',
  FINANCE: 'finance'
};

const INITIAL_USERS: User[] = [
  { id: 'u-admin', name: 'System Admin', email: 'admin@gmail.com', role: UserRole.ADMIN, gradeLevel: 'Grade 1', section: 'Sampaguita' },
  { id: 'u-stu1', name: 'Juan Dela Cruz', email: 'student@gmail.com', role: UserRole.STUDENT, lrn: '123456789012', gradeLevel: 'Grade 4', section: 'Narra', attendanceRate: 98, gwa: 92.5, honorStatus: 'With High Honors', is4Ps: true, phone: '09123456789', address: 'Brgy. Santo Niño, City', guardianName: 'Maria Dela Cruz', guardianPhone: '09171234567', psaStatus: 'Verified', feedingProgramStatus: 'Beneficiary' },
  { id: 'u-tea1', name: 'Teacher Rose', email: 'teacher@gmail.com', role: UserRole.TEACHER, assignedSections: ['Sampaguita', 'Narra'] }
];

const INITIAL_PASSWORDS = { 'u-admin': '123', 'u-stu1': '123456', 'u-tea1': '123456' };

// Initialize tables if empty
if (db.query(TABLES.USERS).length === 0) {
  INITIAL_USERS.forEach(u => db.insert(TABLES.USERS, u));
  db.replaceTable(TABLES.PASSWORDS, [INITIAL_PASSWORDS] as any);
}

const SUSPENSION_HOURS = 10;
const MAX_ATTEMPTS = 3;

const getDeviceId = (): string => {
  let id = localStorage.getItem('sn_device_id');
  if (!id) {
    id = 'dev-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sn_device_id', id);
  }
  return id;
};

export const api = {
  getLockoutInfo: (): LockoutInfo => {
    const devId = getDeviceId();
    const lockouts = db.query<any>(TABLES.LOCKOUT)[0] || {};
    return lockouts[devId] || { attempts: 0, suspendedUntil: null };
  },

  login: async (email: string, pass: string): Promise<User | null> => {
    const devId = getDeviceId();
    const lockoutsArr = db.query<any>(TABLES.LOCKOUT);
    const lockouts = lockoutsArr[0] || {};
    const currentLock = lockouts[devId] || { attempts: 0, suspendedUntil: null };

    if (currentLock.suspendedUntil && Date.now() < currentLock.suspendedUntil) {
      const remaining = Math.ceil((currentLock.suspendedUntil - Date.now()) / (1000 * 60 * 60));
      throw new Error(`Device suspended. Your access is restricted for another ${remaining} hours.`);
    }

    const users = db.query<User>(TABLES.USERS);
    const passwordsArr = db.query<any>(TABLES.PASSWORDS);
    const passwords = passwordsArr[0] || INITIAL_PASSWORDS;
    
    const user = users.find(u => u.email === email);
    
    if (user && passwords[user.id] === pass) {
      delete lockouts[devId];
      db.replaceTable(TABLES.LOCKOUT, [lockouts]);
      api.logActivity(user.id, user.name, 'Signed into the system.', 'Security');
      return user;
    }

    const newAttempts = currentLock.attempts + 1;
    let suspendedUntil = null;
    if (newAttempts >= MAX_ATTEMPTS) {
      suspendedUntil = Date.now() + (SUSPENSION_HOURS * 60 * 60 * 1000);
    }
    lockouts[devId] = { attempts: newAttempts, suspendedUntil };
    db.replaceTable(TABLES.LOCKOUT, [lockouts]);
    throw new Error(`Incorrect credentials. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
  },

  signup: async (name: string, email: string, password: string): Promise<User> => {
    const newUser: User = { 
      id: 'u-' + Date.now(), 
      name, email, 
      role: UserRole.PENDING, 
      lrn: Math.floor(100000000000 + Math.random() * 900000000000).toString(), 
      gradeLevel: 'Grade 1', 
      section: 'Sampaguita', 
      is4Ps: false, 
      psaStatus: 'Pending', 
      badges: [], 
      address: '', 
      phone: '', 
      guardianName: '', 
      guardianPhone: '', 
      academicHistory: [] 
    };
    db.insert(TABLES.USERS, newUser);
    const passwordsArr = db.query<any>(TABLES.PASSWORDS);
    const passwords = passwordsArr[0] || { ...INITIAL_PASSWORDS };
    passwords[newUser.id] = password;
    db.replaceTable(TABLES.PASSWORDS, [passwords]);
    return newUser;
  },

  logActivity: async (userId: string, userName: string, action: string, category: ActivityLog['category']): Promise<void> => {
    db.insert(TABLES.LOGS, { id: 'log-' + Date.now(), userId, userName, action, category, timestamp: new Date().toLocaleString() });
  },

  getLogs: async (): Promise<ActivityLog[]> => db.query(TABLES.LOGS),
  getGrades: async (studentId?: string): Promise<Grade[]> => {
    const all = db.query<Grade>(TABLES.GRADES);
    if (all.length === 0) {
      db.insert(TABLES.GRADES, { id: 'g1', studentId: 'u-stu1', studentName: 'Juan Dela Cruz', subject: 'Filipino', q1: 88, q2: 90, q3: 92, q4: 91, finalAverage: 90.3, remarks: 'Passed' });
      return db.query<Grade>(TABLES.GRADES, studentId ? g => g.studentId === studentId : undefined);
    }
    return studentId ? all.filter(g => g.studentId === studentId) : all;
  },
  getAnnouncements: async (): Promise<Announcement[]> => db.query(TABLES.ANNOUNCEMENTS),
  getEvents: async (): Promise<SchoolEvent[]> => {
    const evs = db.query<SchoolEvent>(TABLES.EVENTS);
    if (evs.length === 0) {
      db.insert(TABLES.EVENTS, { id: 'ev1', title: 'Brigada Eskwela 2024', date: '2024-05-20', month: 'MAY', day: '20', type: 'Brigada Eskwela' });
      return db.query(TABLES.EVENTS);
    }
    return evs;
  },
  getUsers: async (): Promise<User[]> => db.query(TABLES.USERS),
  getSMSLogs: async (): Promise<SMSLog[]> => db.query(TABLES.SMS),
  
  postSMSLog: async (recipient: string, message: string): Promise<void> => {
    db.insert(TABLES.SMS, { id: 'sms-' + Date.now(), recipient, message, timestamp: new Date().toLocaleString(), status: 'delivered' });
  },

  getLibraryResources: async (): Promise<LibraryResource[]> => {
    const res = db.query<LibraryResource>(TABLES.LIBRARY);
    if (res.length === 0) {
      db.insert(TABLES.LIBRARY, { id: 'l1', title: 'Adarna House: Alamat ng Saging', author: 'Felipe de Leon', type: 'ebook', category: 'Literature' });
      db.insert(TABLES.LIBRARY, { id: 'l2', title: 'Introduction to Math', author: 'SNES Faculty', type: 'video', category: 'Science' });
      return db.query(TABLES.LIBRARY);
    }
    return res;
  },

  getFacilities: async (): Promise<Facility[]> => {
    const res = db.query<Facility>(TABLES.FACILITIES);
    if (res.length === 0) {
      db.insert(TABLES.FACILITIES, { id: 'fac-1', name: 'Science Laboratory', status: 'available', lastCleaned: '2024-05-15' });
      db.insert(TABLES.FACILITIES, { id: 'fac-2', name: 'Grade 4 - Narra', status: 'available', lastCleaned: '2024-05-18' });
      return db.query(TABLES.FACILITIES);
    }
    return res;
  },
  
  updateFacility: async (id: string, update: Partial<Facility>): Promise<void> => {
    db.update(TABLES.FACILITIES, id, update);
  },

  getHealthRecords: async (): Promise<HealthRecord[]> => db.query(TABLES.HEALTH),
  
  postHealthRecord: async (record: Omit<HealthRecord, 'id'>): Promise<void> => {
    db.insert(TABLES.HEALTH, { ...record, id: 'health-' + Date.now() });
  },

  getDocRequests: async (studentId: string): Promise<DocumentRequest[]> => db.query<DocumentRequest>(TABLES.DOC_REQUESTS, r => r.studentId === studentId),

  getAllRawData: async (): Promise<Record<string, any[]>> => db.getRawStorage(),

  saveTableData: async (tableName: string, data: any[]): Promise<void> => {
    db.replaceTable(tableName.toLowerCase(), data);
  },

  updateGrade: async (id: string, update: Partial<Grade>, facultyName: string): Promise<void> => {
    db.update(TABLES.GRADES, id, update);
  },

  postEvent: async (ev: Omit<SchoolEvent, 'id'>, userName: string): Promise<void> => {
    db.insert(TABLES.EVENTS, { ...ev, id: 'ev-' + Date.now() });
  },

  updateUser: async (id: string, update: Partial<User>): Promise<void> => {
    db.update(TABLES.USERS, id, update);
  },

  deleteUser: async (id: string, adminName: string): Promise<void> => {
    db.delete(TABLES.USERS, id);
  },

  updatePassword: async (userId: string, newPass: string, adminName: string): Promise<void> => {
    const passwordsArr = db.query<any>(TABLES.PASSWORDS);
    const passwords = passwordsArr[0] || { ...INITIAL_PASSWORDS };
    passwords[userId] = newPass;
    db.replaceTable(TABLES.PASSWORDS, [passwords]);
  },

  createUser: async (name: string, email: string, role: UserRole, adminName: string): Promise<void> => {
    const newUser: User = { 
      id: 'u-' + Date.now(), 
      name, email, role, 
      lrn: role === UserRole.STUDENT ? '123456789012' : undefined, 
      gradeLevel: 'Grade 1', 
      section: 'Sampaguita', 
      is4Ps: false, 
      psaStatus: 'Pending', 
      badges: [], 
      address: '', 
      phone: '', 
      guardianName: '', 
      guardianPhone: '' 
    };
    db.insert(TABLES.USERS, newUser);
    const passwordsArr = db.query<any>(TABLES.PASSWORDS);
    const passwords = passwordsArr[0] || { ...INITIAL_PASSWORDS };
    passwords[newUser.id] = '123456';
    db.replaceTable(TABLES.PASSWORDS, [passwords]);
  },

  postAnnouncement: async (ann: Omit<Announcement, 'id' | 'date'>): Promise<void> => {
    db.insert(TABLES.ANNOUNCEMENTS, { ...ann, id: 'ann-' + Date.now(), date: new Date().toLocaleDateString() });
  },

  deleteAnnouncement: async (id: string, adminName: string): Promise<void> => {
    db.delete(TABLES.ANNOUNCEMENTS, id);
  },

  approveAdmission: async (id: string, adminName: string): Promise<void> => {
    const apps = db.query<EnrollmentApplication>(TABLES.ENROLLMENT);
    const app = apps.find(a => a.id === id);
    if (app) {
      // Fix: Explicitly provide generic type parameters to db.update calls
      db.update<EnrollmentApplication>(TABLES.ENROLLMENT, id, { status: 'approved' });
      const users = db.query<User>(TABLES.USERS);
      const user = users.find(u => u.email === app.email);
      if (user) {
        // Fix: Explicitly provide generic type parameters to db.update calls
        db.update<User>(TABLES.USERS, user.id, { role: UserRole.STUDENT });
      }
    }
  },

  getSections: async (): Promise<Section[]> => db.query(TABLES.SECTIONS),
  getModules: async (): Promise<Module[]> => db.query(TABLES.MODULES),
  getAssignments: async (): Promise<Assignment[]> => db.query(TABLES.ASSIGNMENTS),
  getSubmissions: async (): Promise<Submission[]> => db.query(TABLES.SUBMISSIONS),
  getSchedule: async (): Promise<ScheduleItem[]> => db.query(TABLES.SCHEDULE),
  getAttendance: async (studentId: string): Promise<AttendanceRecord[]> => db.query<AttendanceRecord>(TABLES.ATTENDANCE, a => a.studentId === studentId),
  getStudentsBySection: async (section: string): Promise<User[]> => db.query<User>(TABLES.USERS, u => u.role === UserRole.STUDENT && (section === 'All' || u.section === section)),
  getStudents: async (): Promise<User[]> => db.query<User>(TABLES.USERS, u => u.role === UserRole.STUDENT),
  getEnrollmentApplications: async (): Promise<EnrollmentApplication[]> => db.query(TABLES.ENROLLMENT),
  getClearance: async (studentId: string): Promise<ClearanceItem[]> => {
    const items = db.query<ClearanceItem>(TABLES.CLEARANCE, c => c.studentId === studentId);
    if (items.length === 0) {
      const defaults: ClearanceItem[] = [
        { id: 'c1-' + studentId, studentId, department: 'Property', status: 'cleared' },
        { id: 'c2-' + studentId, studentId, department: 'Clinic', status: 'cleared' },
        { id: 'c3-' + studentId, studentId, department: 'Adviser', status: 'pending', remarks: 'Modules not returned' },
        { id: 'c4-' + studentId, studentId, department: 'Library', status: 'cleared' }
      ];
      defaults.forEach(d => db.insert(TABLES.CLEARANCE, d));
      return defaults;
    }
    return items;
  },
  submitAssignmentWork: async (sub: Omit<Submission, 'id' | 'submittedAt' | 'status'>): Promise<void> => {
    db.insert(TABLES.SUBMISSIONS, { ...sub, id: 'sub-' + Date.now(), submittedAt: new Date().toLocaleString(), status: 'pending' });
  },
  submitApplication: async (app: Omit<EnrollmentApplication, 'id' | 'status' | 'dateApplied'>): Promise<void> => {
    db.insert(TABLES.ENROLLMENT, { ...app, id: 'app-' + Date.now(), status: 'pending', dateApplied: new Date().toLocaleDateString() });
  },
  dropStudent: async (id: string): Promise<void> => {
    db.delete(TABLES.USERS, id);
  },
  getDropoutRequests: async (): Promise<DropoutRequest[]> => db.query(TABLES.DROPOUTS),
  submitDropoutRequest: async (req: Omit<DropoutRequest, 'id' | 'status' | 'timestamp'>): Promise<void> => {
    db.insert(TABLES.DROPOUTS, { ...req, id: 'drp-' + Date.now(), status: 'pending', timestamp: new Date().toLocaleString() });
  },
  gradeSubmission: async (id: string, grade: number, feedback: string): Promise<void> => {
    // Fix: Explicitly provide generic type parameters to db.update calls
    db.update<Submission>(TABLES.SUBMISSIONS, id, { status: 'graded', grade, feedback });
  },
  requestDoc: async (req: Omit<DocumentRequest, 'id' | 'status' | 'dateRequested'>): Promise<void> => {
    db.insert(TABLES.DOC_REQUESTS, { ...req, id: 'req-' + Date.now(), status: 'pending', dateRequested: new Date().toLocaleDateString() });
  },
  getFinances: async (studentId: string): Promise<FeeRecord[]> => db.query<FeeRecord>(TABLES.FINANCE, f => f.studentId === studentId),
  addFeeRecord: async (record: Omit<FeeRecord, 'id'>): Promise<void> => {
    db.insert(TABLES.FINANCE, { ...record, id: 'fee-' + Date.now() });
  }
};
