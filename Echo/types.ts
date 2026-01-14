
export enum UserRole {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  TEACHER = 'TEACHER',
  TRANSFEREE = 'TRANSFEREE',
  ADMIN = 'ADMIN',
  PENDING = 'PENDING'
}

export type Theme = 'light' | 'dark' | 'system';

export interface LockoutInfo {
  attempts: number;
  suspendedUntil: number | null;
}

export interface UserBadge {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  studentId?: string; 
  lrn?: string; // 12-digit Learner Reference Number
  gradeLevel?: string;
  section?: string;
  assignedSections?: string[];
  advisorySection?: string;
  attendanceRate?: number;
  gwa?: number;
  honorStatus?: 'With Honors' | 'With High Honors' | 'With Highest Honors' | 'None';
  is4Ps?: boolean;
  phone?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  psaStatus?: 'Verified' | 'Pending' | 'Missing';
  status?: 'active' | 'completed' | 'dropped';
  emailVerified?: boolean;
  badges?: UserBadge[];
  birthDate?: string;
  academicHistory?: { year: string; grade: string; school: string }[];
  feedingProgramStatus?: 'Beneficiary' | 'None';
}

export interface Section {
  id: string;
  name: string;
  gradeLevel: string;
  adviserId?: string;
  adviserName?: string;
  roomNumber: string;
  studentCount: number;
}

export interface ClearanceItem {
  id: string;
  studentId: string;
  department: 'Clinic' | 'Adviser' | 'Library' | 'Canteen' | 'Property';
  status: 'cleared' | 'pending' | 'blocked';
  remarks?: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  month: string;
  day: string;
  type: 'Holiday' | 'Academic' | 'Social' | 'Exam' | 'DepEd Event' | 'PTA Meeting' | 'Brigada Eskwela';
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  category: 'Security' | 'Academic' | 'Administrative' | 'System';
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  fileName: string;
  fileData: string; 
  submittedAt: string;
  status: 'pending' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  targetSection?: string;
  category: 'General' | 'Academic' | 'Emergency' | 'Event' | 'Brigada Eskwela' | 'Notice';
}

export interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  finalAverage: number;
  remarks: 'Passed' | 'Failed';
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  section?: string;
  status: 'pending' | 'submitted' | 'graded';
}

export interface EnrollmentApplication {
  id: string;
  fullName: string;
  email: string;
  targetGrade: string;
  previousSchool: string;
  status: 'pending' | 'approved' | 'rejected';
  dateApplied: string;
  psaNumber?: string;
  sf9Path?: string;
}

export interface Module {
  id: string;
  title: string;
  subject: string;
  uploadDate: string;
  downloadLink?: string;
  targetSection?: string;
}

export interface ScheduleItem {
  id: string;
  day: string;
  subject: string;
  time: string;
  instructor: string;
  room: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export interface DropoutRequest {
  id: string;
  studentId: string;
  studentName: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  timestamp: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  category: 'Academic' | 'Project' | 'Social';
  date: string;
  grade?: string;
}

export interface SMSLog {
  id: string;
  recipient: string;
  message: string;
  timestamp: string;
  status: 'delivered' | 'sent' | 'failed';
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'failed';
}

export interface LibraryResource {
  id: string;
  title: string;
  author: string;
  type: 'ebook' | 'video';
  category: string;
}

export interface Facility {
  id: string;
  name: string;
  status: 'available' | 'reserved' | 'maintenance';
  lastCleaned: string;
}

export interface HealthRecord {
  id: string;
  studentId: string;
  studentName: string;
  height: number;
  weight: number;
  bmi: number;
  bmiCategory: 'Normal' | 'Underweight' | 'Overweight' | 'Obese';
  lastCheckup: string;
  remarks: string;
}

export interface DocumentRequest {
  id: string;
  studentId: string;
  studentName: string;
  documentType: 'Good Moral' | 'Certificate of Enrollment' | 'Form 137' | 'Diploma Replacement';
  purpose: string;
  status: 'pending' | 'ready';
  dateRequested: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending';
  category: string;
  date: string;
}
