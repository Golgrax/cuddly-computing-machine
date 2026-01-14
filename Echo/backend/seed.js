import sqlite3 from 'sqlite3';
import { db, initDatabase } from './database.js';

// Wait for database connection to be established by initDatabase (if running separately)
// But since we are running this as a standalone script, we might need to handle the connection ourselves 
// if we import 'db'. However, 'db' in database.js is initialized immediately.
// We will use a timeout to ensure 'initDatabase' has created tables if we call it, 
// or better, we will define our own flow here to DROP and RE-CREATE.

const seed = async () => {
    console.log("Starting full database reset and seed...");

    // 1. Drop existing tables to ensure clean slate
    const tables = [
        'users', 'sections', 'clearance_items', 'school_events', 'activity_logs', 
        'submissions', 'announcements', 'grades', 'assignments', 'enrollment_applications', 
        'modules', 'schedule', 'attendance', 'dropout_requests', 'portfolio_projects', 
        'sms_logs', 'email_logs', 'library_resources', 'facilities', 'health_records', 
        'document_requests', 'fee_records'
    ];

    db.serialize(() => {
        // DROP Tables
        tables.forEach(table => {
            db.run(`DROP TABLE IF EXISTS ${table}`);
        });
        console.log("Existing tables dropped.");

        // RE-INITIALIZE Tables (This runs the CREATE TABLE statements)
        initDatabase();

        // Give it a moment for tables to be created
        setTimeout(() => {
            runInserts();
        }, 1000);
    });
};

const runInserts = () => {
    console.log("Inserting seed data...");

    // --- USERS ---
    const users = [
        { 
            id: 'u-admin', name: 'System Admin', email: 'admin@gmail.com', role: 'ADMIN', 
            password: '123', avatar: '', phone: '09170000000', address: 'Admin Office',
            academicHistory: '', requirements: ''
        },
        { 
            id: 'u-tea1', name: 'Rosalina Santos', email: 'teacher@gmail.com', role: 'TEACHER', 
            password: '123', avatar: '', assignedSections: '["Sampaguita", "Narra"]', advisorySection: 'Narra', phone: '09171111111',
            academicHistory: '', requirements: ''
        },
        { 
            id: 'u-stu1', name: 'Juan Dela Cruz', email: 'student@gmail.com', role: 'STUDENT', 
            password: '123', lrn: '123456789012', gradeLevel: 'Grade 4', section: 'Narra',
            attendanceRate: 98.5, gwa: 92.5, honorStatus: 'With High Honors', is4Ps: true,
            phone: '09172222222', address: 'Brgy. Santo Niño, Marikina City', 
            guardianName: 'Maria Dela Cruz', guardianPhone: '09173333333', psaStatus: 'Verified',
            feedingProgramStatus: 'None',
            academicHistory: JSON.stringify([{ year: '2023-2024', grade: 'Grade 3', school: 'Sto. Niño Elementary' }, { year: '2022-2023', grade: 'Grade 2', school: 'Sto. Niño Elementary' }]),
            requirements: JSON.stringify({ 'SF9': true, 'Good Moral': true, 'Clearance': true })
        },
        { 
            id: 'u-stu2', name: 'Maria Clara', email: 'maria@gmail.com', role: 'STUDENT', 
            password: '123', lrn: '123456789013', gradeLevel: 'Grade 1', section: 'Sampaguita',
            attendanceRate: 95.0, gwa: 89.0, honorStatus: 'With Honors', is4Ps: false,
            phone: '09174444444', address: 'Brgy. Malanday, Marikina City',
            guardianName: 'Jose Clara', guardianPhone: '09175555555', psaStatus: 'Verified',
            academicHistory: JSON.stringify([]),
            requirements: JSON.stringify({ 'SF9': true })
        }
    ];

    const insertUser = db.prepare('INSERT INTO users (id, name, email, role, password, avatar, assignedSections, advisorySection, lrn, gradeLevel, section, attendanceRate, gwa, honorStatus, is4Ps, phone, address, guardianName, guardianPhone, psaStatus, feedingProgramStatus, status, emailVerified, academicHistory, requirements) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    users.forEach(u => {
        insertUser.run(u.id, u.name, u.email, u.role, u.password, u.avatar, u.assignedSections, u.advisorySection || '', u.lrn, u.gradeLevel, u.section, u.attendanceRate, u.gwa, u.honorStatus, u.is4Ps, u.phone, u.address, u.guardianName, u.guardianPhone, u.psaStatus, u.feedingProgramStatus, 'active', 1, u.academicHistory, u.requirements);
    });
    insertUser.finalize();
    console.log("Users seeded.");

    // --- SECTIONS ---
    const sections = [
        { id: 'sec-1', name: 'Narra', gradeLevel: 'Grade 4', adviserId: 'u-tea1', adviserName: 'Rosalina Santos', roomNumber: 'Rm 101', studentCount: 35 },
        { id: 'sec-2', name: 'Sampaguita', gradeLevel: 'Grade 1', adviserId: 'u-tea1', adviserName: 'Rosalina Santos', roomNumber: 'Rm 102', studentCount: 30 }
    ];
    const insertSection = db.prepare('INSERT INTO sections (id, name, gradeLevel, adviserId, adviserName, roomNumber, studentCount) VALUES (?, ?, ?, ?, ?, ?, ?)');
    sections.forEach(s => insertSection.run(s.id, s.name, s.gradeLevel, s.adviserId, s.adviserName, s.roomNumber, s.studentCount));
    insertSection.finalize();
    console.log("Sections seeded.");

    // --- FACILITIES ---
    const facilities = [
        { id: 'fac-1', name: 'Computer Laboratory', status: 'available', lastCleaned: '2024-01-10' },
        { id: 'fac-2', name: 'School Library', status: 'available', lastCleaned: '2024-01-11' },
        { id: 'fac-3', name: 'Science Lab', status: 'maintenance', lastCleaned: '2023-12-20' },
        { id: 'fac-4', name: 'Covered Court', status: 'reserved', lastCleaned: '2024-01-12' }
    ];
    const insertFac = db.prepare('INSERT INTO facilities (id, name, status, lastCleaned) VALUES (?, ?, ?, ?)');
    facilities.forEach(f => insertFac.run(f.id, f.name, f.status, f.lastCleaned));
    insertFac.finalize();
    console.log("Facilities seeded.");

    // --- ACTIVITY LOGS ---
    const logs = [
        { id: 'log-1', userId: 'u-admin', userName: 'System Admin', action: 'System Backup Completed', timestamp: '2024-01-12 08:00 AM', category: 'System' },
        { id: 'log-2', userId: 'u-tea1', userName: 'Rosalina Santos', action: 'Uploaded Grade 4 Grades', timestamp: '2024-01-12 09:30 AM', category: 'Academic' },
        { id: 'log-3', userId: 'u-stu1', userName: 'Juan Dela Cruz', action: 'Downloaded SF9', timestamp: '2024-01-12 10:15 AM', category: 'Academic' },
        { id: 'log-4', userId: 'u-admin', userName: 'System Admin', action: 'Updated Firewall Rules', timestamp: '2024-01-11 11:00 PM', category: 'Security' }
    ];
    const insertLog = db.prepare('INSERT INTO activity_logs (id, userId, userName, action, timestamp, category) VALUES (?, ?, ?, ?, ?, ?)');
    logs.forEach(l => insertLog.run(l.id, l.userId, l.userName, l.action, l.timestamp, l.category));
    insertLog.finalize();
    console.log("Activity Logs seeded.");

    // --- ANNOUNCEMENTS ---
    const announcements = [
        { id: 'ann-1', title: 'Start of 3rd Quarter', content: 'Classes for the 3rd Quarter will officially resume on Monday. Please ensure all clearance forms are submitted.', date: '2024-01-10', author: 'Principal Office', category: 'Academic' },
        { id: 'ann-2', title: 'Brigada Eskwela 2024', content: 'Volunteers are needed for the upcoming school cleaning drive. Sign up at the registrar.', date: '2024-01-05', author: 'Admin', category: 'Brigada Eskwela' }
    ];
    const insertAnn = db.prepare('INSERT INTO announcements (id, title, content, date, author, category) VALUES (?, ?, ?, ?, ?, ?)');
    announcements.forEach(a => insertAnn.run(a.id, a.title, a.content, a.date, a.author, a.category));
    insertAnn.finalize();
    console.log("Announcements seeded.");

    // --- MODULES ---
    const modules = [
        { id: 'mod-1', title: 'Math 4 - Q1 Week 1', subject: 'Mathematics', uploadDate: '2024-01-10', downloadLink: 'https://example.com/math4-q1-w1.pdf', targetSection: 'Narra' },
        { id: 'mod-2', title: 'Science 1 - Plants', subject: 'Science', uploadDate: '2024-01-11', downloadLink: 'https://example.com/sci1-plants.pdf', targetSection: 'Sampaguita' }
    ];
    const insertMod = db.prepare('INSERT INTO modules (id, title, subject, uploadDate, downloadLink, targetSection) VALUES (?, ?, ?, ?, ?, ?)');
    modules.forEach(m => insertMod.run(m.id, m.title, m.subject, m.uploadDate, m.downloadLink, m.targetSection));
    insertMod.finalize();
    console.log("Modules seeded.");

    console.log("Database seed complete.");
};

seed();
