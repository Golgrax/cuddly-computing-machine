import sqlite3 from 'sqlite3';
import { db, initDatabase } from './database.js';

const seed = async () => {
    console.log("Starting full database reset and seed...");

    const tables = [
        'users', 'sections', 'clearance_items', 'activity_logs', 
        'submissions', 'announcements', 'grades', 'assignments', 'enrollment_applications', 
        'modules', 'schedule', 'attendance', 'dropout_requests', 'portfolio_projects', 
        'sms_logs', 'email_logs', 'library_resources', 'facilities', 'health_records', 
        'document_requests', 'fee_records', 'messages'
    ];

    db.serialize(() => {
        // 1. Drop Tables
        tables.forEach(table => {
            db.run(`DROP TABLE IF EXISTS ${table}`);
        });
        console.log("Existing tables dropped.");

        // 2. Re-Init
        initDatabase();

        // 3. Seed Data (Delayed slightly to ensure tables are ready)
        setTimeout(() => {
            runInserts();
        }, 1000);
    });
};

const runInserts = () => {
    console.log("Inserting seed data...");

    // --- HELPER DATA ---
    const SUBJECTS = ['Mathematics', 'Science', 'English', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'ESP', 'TLE'];
    const FIRST_NAMES = ['Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Luis', 'Carmen', 'Ramon', 'Teresa', 'Miguel', 'Sofia', 'Antonio', 'Isabel', 'Carlos', 'Juana', 'Francisco', 'Elena', 'Jorge', 'Luisa'];
    const LAST_NAMES = ['Garcia', 'Reyes', 'Cruz', 'Santos', 'Bautista', 'Ocampo', 'Aquino', 'Mendoza', 'Torres', 'Flores', 'Diaz', 'Gomez', 'Morales', 'Mercado', 'Castillo'];

    const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const generatePhone = () => '09' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const generateLrn = () => '1' + Math.floor(Math.random() * 100000000000).toString().padStart(11, '0');

    // --- USERS: ADMIN ---
    const users = [
        { 
            id: 'u-admin', name: 'System Admin', email: 'admin@gmail.com', role: 'ADMIN', 
            password: '123', avatar: '', phone: '09170000000', address: 'Admin Office',
            schoolYear: '2025-2026',
            academicHistory: '', requirements: ''
        },
        { 
            id: 'u-tea-default', name: 'Default Teacher', email: 'teacher@gmail.com', role: 'TEACHER', 
            password: '123', avatar: '', assignedSections: '["Sampaguita", "Narra"]', advisorySection: 'Narra', phone: '09171111111',
            schoolYear: '2025-2026',
            academicHistory: '', requirements: ''
        },
        { 
            id: 'u-stu-default', name: 'Default Student', email: 'student@gmail.com', role: 'STUDENT', 
            password: '123', lrn: '123456789000', gradeLevel: 'Grade 4', section: 'Narra',
            attendanceRate: 98.5, gwa: 92.5, honorStatus: 'With High Honors', is4Ps: true,
            phone: '09172222222', address: 'Brgy. Santo Niño, Marikina City', 
            guardianName: 'Maria Dela Cruz', guardianPhone: '09173333333', psaStatus: 'Verified',
            feedingProgramStatus: 'None', sex: 'MALE',
            schoolYear: '2025-2026',
            academicHistory: JSON.stringify([{ year: '2023-2024', grade: 'Grade 3', school: 'Sto. Niño Elementary' }]),
            requirements: JSON.stringify({ 'SF9': true })
        }
    ];

    // --- USERS: TEACHERS (10) ---
    // Section Advisers mapping: 1-9
    const sectionNames = [
        { name: 'Sampaguita', grade: 'Grade 1' },
        { name: 'Rose', grade: 'Grade 1' },
        { name: 'Molave', grade: 'Grade 2' },
        { name: 'Narra', grade: 'Grade 2' },
        { name: 'Yakal', grade: 'Grade 3' },
        { name: 'Acacia', grade: 'Grade 4' },
        { name: 'Mahogany', grade: 'Grade 5' },
        { name: 'Ipil', grade: 'Grade 6' },
        { name: 'Kamagong', grade: 'Grade 6' }
    ];

    const teachers = [];
    for (let i = 1; i <= 10; i++) {
        const isAdviser = i <= 9;
        const section = isAdviser ? sectionNames[i-1] : null;
        const assignedSections = isAdviser ? [section.name] : [];
        if (!isAdviser) {
            // Floater teacher assigns to random sections
            assignedSections.push(getRandomElement(sectionNames).name);
            assignedSections.push(getRandomElement(sectionNames).name);
        }

        teachers.push({
            id: `u-tea${i}`,
            name: `Teacher ${FIRST_NAMES[i]} ${LAST_NAMES[i]}`,
            email: `teacher${i}@gmail.com`,
            role: 'TEACHER',
            password: '123',
            assignedSections: JSON.stringify(assignedSections),
            advisorySection: section ? section.name : '',
            phone: generatePhone(),
            address: 'Faculty Room',
            sex: i % 2 === 0 ? 'MALE' : 'FEMALE',
            schoolYear: '2025-2026',
            academicHistory: '',
            requirements: ''
        });
    }
    users.push(...teachers);

    // --- SECTIONS ---
    const sections = sectionNames.map((s, idx) => ({
        id: `sec-${idx+1}`,
        name: s.name,
        gradeLevel: s.grade,
        adviserId: `u-tea${idx+1}`,
        adviserName: teachers[idx].name,
        roomNumber: `Rm 10${idx+1}`,
        studentCount: 0 // Will update later or ignore
    }));
    
    // --- USERS: STUDENTS (30) ---
    const students = [];
    for (let i = 1; i <= 30; i++) {
        const assignedSection = sections[i % sections.length]; // Distribute evenly
        students.push({
            id: `u-stu${i}`,
            name: `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`,
            email: `student${i}@gmail.com`,
            role: 'STUDENT',
            password: '123',
            lrn: generateLrn(),
            gradeLevel: assignedSection.gradeLevel,
            section: assignedSection.name,
            attendanceRate: (85 + Math.random() * 15).toFixed(1),
            gwa: (75 + Math.random() * 24).toFixed(1),
            honorStatus: Math.random() > 0.8 ? 'With Honors' : 'None',
            is4Ps: Math.random() > 0.8,
            phone: generatePhone(),
            address: 'Marikina City',
            guardianName: `Parent of ${i}`,
            guardianPhone: generatePhone(),
            psaStatus: 'Verified',
            feedingProgramStatus: Math.random() > 0.9 ? 'Beneficiary' : 'None',
            sex: i % 2 === 0 ? 'MALE' : 'FEMALE',
            schoolYear: '2025-2026',
            academicHistory: JSON.stringify([]),
            requirements: JSON.stringify({ 'SF9': true })
        });
    }
    // Update student counts in sections
    sections.forEach(sec => {
        sec.studentCount = students.filter(s => s.section === sec.name).length;
    });
    users.push(...students);

    // INSERT USERS
    const insertUser = db.prepare('INSERT INTO users (id, name, email, role, password, avatar, assignedSections, advisorySection, lrn, gradeLevel, section, attendanceRate, gwa, honorStatus, is4Ps, phone, address, guardianName, guardianPhone, psaStatus, feedingProgramStatus, status, sex, emailVerified, schoolYear, academicHistory, requirements) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    users.forEach(u => {
        insertUser.run(u.id, u.name, u.email, u.role, u.password, u.avatar || '', u.assignedSections || '[]', u.advisorySection || '', u.lrn || '', u.gradeLevel || '', u.section || '', u.attendanceRate || 0, u.gwa || 0, u.honorStatus || '', u.is4Ps ? 1 : 0, u.phone || '', u.address || '', u.guardianName || '', u.guardianPhone || '', u.psaStatus || '', u.feedingProgramStatus || '', 'active', u.sex || 'MALE', 1, u.schoolYear || '', u.academicHistory || '[]', u.requirements || '{}');
    });
    insertUser.finalize();
    console.log(`Users seeded (${users.length}).`);

    // INSERT SECTIONS
    const insertSection = db.prepare('INSERT INTO sections (id, name, gradeLevel, adviserId, adviserName, roomNumber, studentCount) VALUES (?, ?, ?, ?, ?, ?, ?)');
    sections.forEach(s => insertSection.run(s.id, s.name, s.gradeLevel, s.adviserId, s.adviserName, s.roomNumber, s.studentCount));
    insertSection.finalize();
    console.log(`Sections seeded (${sections.length}).`);

    // --- SCHEDULE ---
    const schedule = [];
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const TIMES = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM'];
    
    sections.forEach(sec => {
        DAYS.forEach(day => {
            TIMES.forEach((time, tIdx) => {
                const subject = SUBJECTS[tIdx % SUBJECTS.length];
                schedule.push({
                    id: `sch-${sec.id}-${day}-${tIdx}`,
                    day: day,
                    subject: subject,
                    time: time,
                    instructor: sec.adviserName, // Simplify: Adviser teaches everything or randomly assign
                    room: sec.roomNumber
                });
            });
        });
    });
    const insertSched = db.prepare('INSERT INTO schedule (id, day, subject, time, instructor, room) VALUES (?, ?, ?, ?, ?, ?)');
    schedule.forEach(s => insertSched.run(s.id, s.day, s.subject, s.time, s.instructor, s.room));
    insertSched.finalize();
    console.log("Schedule seeded.");

    // --- ASSIGNMENTS ---
    const assignments = [];
    sections.forEach(sec => {
        const subject = getRandomElement(SUBJECTS);
        assignments.push({
            id: `asn-${sec.id}-1`,
            title: `${subject} Homework 1`,
            subject: subject,
            dueDate: '2024-02-01',
            dueTime: '23:59',
            section: sec.name,
            status: 'Open',
            allowedFileTypes: '.pdf,.jpg',
            resourceLink: ''
        });
    });
    const insertAsn = db.prepare('INSERT INTO assignments (id, title, subject, dueDate, dueTime, section, status, allowedFileTypes, isLocked, resourceLink) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    assignments.forEach(a => insertAsn.run(a.id, a.title, a.subject, a.dueDate, a.dueTime, a.section, a.status, a.allowedFileTypes, 0, a.resourceLink));
    insertAsn.finalize();
    console.log("Assignments seeded.");

    // --- FACILITIES ---
    const facilities = [
        { id: 'fac-1', name: 'Computer Laboratory', status: 'available', lastCleaned: '2024-01-10' },
        { id: 'fac-2', name: 'School Library', status: 'available', lastCleaned: '2024-01-11' },
        { id: 'fac-3', name: 'Science Lab', status: 'maintenance', lastCleaned: '2023-12-20' },
        { id: 'fac-4', name: 'Covered Court', status: 'reserved', lastCleaned: '2024-01-12' },
        { id: 'fac-5', name: 'Clinic', status: 'available', lastCleaned: '2024-01-15' },
        { id: 'fac-6', name: 'Canteen', status: 'available', lastCleaned: '2024-01-15' }
    ];
    const insertFac = db.prepare('INSERT INTO facilities (id, name, status, lastCleaned) VALUES (?, ?, ?, ?)');
    facilities.forEach(f => insertFac.run(f.id, f.name, f.status, f.lastCleaned));
    insertFac.finalize();
    console.log("Facilities seeded.");

    // --- GRADES (Random) ---
    const grades = [];
    students.forEach(stu => {
        SUBJECTS.forEach(sub => {
            const q1 = Math.floor(80 + Math.random() * 15);
            const q2 = Math.floor(80 + Math.random() * 15);
            const q3 = Math.floor(80 + Math.random() * 15);
            const q4 = Math.floor(80 + Math.random() * 15);
            const avg = (q1 + q2 + q3 + q4) / 4;
            grades.push({
                id: `gr-${stu.id}-${sub}`,
                studentId: stu.id,
                studentName: stu.name,
                subject: sub,
                q1, q2, q3, q4,
                finalAverage: avg,
                remarks: avg >= 75 ? 'Passed' : 'Failed'
            });
        });
    });
    const insertGrade = db.prepare('INSERT INTO grades (id, studentId, studentName, subject, q1, q2, q3, q4, finalAverage, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    grades.forEach(g => insertGrade.run(g.id, g.studentId, g.studentName, g.subject, g.q1, g.q2, g.q3, g.q4, g.finalAverage, g.remarks));
    insertGrade.finalize();
    console.log("Grades seeded.");

    console.log("Database seed complete.");
};

seed();