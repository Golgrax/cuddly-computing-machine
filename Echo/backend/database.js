import sqlite3 from 'sqlite3';

const verboseSqlite3 = sqlite3.verbose();
const DBSOURCE = "db.sqlite";

export const db = new verboseSqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    }else{
        console.log('Connected to the SQLite database.')
    }
});

export const initDatabase = () => {
    db.serialize(() => {
        console.log('Initializing database tables...');
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT,
            avatar TEXT,
            assignedSections TEXT,
            advisorySection TEXT,
            studentId TEXT,
            lrn TEXT,
            gradeLevel TEXT,
            section TEXT,
            attendanceRate REAL,
            gwa REAL,
            honorStatus TEXT,
            is4Ps BOOLEAN,
            phone TEXT,
            address TEXT,
            guardianName TEXT,
            guardianPhone TEXT,
            psaStatus TEXT,
            status TEXT DEFAULT 'active',
            birthDate TEXT,
            feedingProgramStatus TEXT,
            emailVerified BOOLEAN DEFAULT 0,
            verificationToken TEXT,
            academicHistory TEXT,
            requirements TEXT
        )`);

        // Sections table
        db.run(`CREATE TABLE IF NOT EXISTS sections (
            id TEXT PRIMARY KEY,
            name TEXT,
            gradeLevel TEXT,
            adviserId TEXT,
            adviserName TEXT,
            roomNumber TEXT,
            studentCount INTEGER
        )`);

        // Clearance items table
        db.run(`CREATE TABLE IF NOT EXISTS clearance_items (
            id TEXT PRIMARY KEY,
            studentId TEXT,
            department TEXT,
            status TEXT,
            remarks TEXT
        )`);

        // School events table
        db.run(`CREATE TABLE IF NOT EXISTS school_events (
            id TEXT PRIMARY KEY,
            title TEXT,
            date TEXT,
            month TEXT,
            day TEXT,
            type TEXT
        )`);

        // Activity logs table
        db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
            id TEXT PRIMARY KEY,
            userId TEXT,
            userName TEXT,
            action TEXT,
            timestamp TEXT,
            category TEXT
        )`);

        // Submissions table
        db.run(`CREATE TABLE IF NOT EXISTS submissions (
            id TEXT PRIMARY KEY,
            assignmentId TEXT,
            studentId TEXT,
            studentName TEXT,
            fileName TEXT,
            fileData TEXT,
            submittedAt TEXT,
            status TEXT,
            grade INTEGER,
            feedback TEXT
        )`);

        // Announcements table
        db.run(`CREATE TABLE IF NOT EXISTS announcements (
            id TEXT PRIMARY KEY,
            title TEXT,
            content TEXT,
            date TEXT,
            author TEXT,
            targetSection TEXT,
            category TEXT
        )`);

        // Grades table
        db.run(`CREATE TABLE IF NOT EXISTS grades (
            id TEXT PRIMARY KEY,
            studentId TEXT,
            studentName TEXT,
            subject TEXT,
            q1 REAL,
            q2 REAL,
            q3 REAL,
            q4 REAL,
            finalAverage REAL,
            remarks TEXT
        )`);

        // Assignments table
        db.run(`CREATE TABLE IF NOT EXISTS assignments (
            id TEXT PRIMARY KEY,
            title TEXT,
            subject TEXT,
            dueDate TEXT,
            section TEXT,
            status TEXT
        )`);

        // Enrollment applications table
        db.run(`CREATE TABLE IF NOT EXISTS enrollment_applications (
            id TEXT PRIMARY KEY,
            fullName TEXT,
            email TEXT,
            targetGrade TEXT,
            previousSchool TEXT,
            status TEXT,
            dateApplied TEXT,
            psaNumber TEXT,
            sf9Path TEXT
        )`);

        // Modules table
        db.run(`CREATE TABLE IF NOT EXISTS modules (
            id TEXT PRIMARY KEY,
            title TEXT,
            subject TEXT,
            uploadDate TEXT,
            downloadLink TEXT,
            targetSection TEXT
        )`);
        
        // Schedule table
        db.run(`CREATE TABLE IF NOT EXISTS schedule (
            id TEXT PRIMARY KEY,
            day TEXT,
            subject TEXT,
            "time" TEXT,
            instructor TEXT,
            room TEXT
        )`);

        // Attendance table
        db.run(`CREATE TABLE IF NOT EXISTS attendance (
            id TEXT PRIMARY KEY,
            studentId TEXT,
            date TEXT,
            status TEXT
        )`);

        // Dropout requests table
        db.run(`CREATE TABLE IF NOT EXISTS dropout_requests (
            id TEXT PRIMARY KEY,
            studentId TEXT,
            studentName TEXT,
            reason TEXT,
            status TEXT,
            timestamp TEXT
        )`);

        // Portfolio projects table
        db.run(`CREATE TABLE IF NOT EXISTS portfolio_projects (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            category TEXT,
            date TEXT,
            grade TEXT
        )`);

        // Email logs table
        db.run(`CREATE TABLE IF NOT EXISTS email_logs (
            id TEXT PRIMARY KEY,
            recipient TEXT,
            subject TEXT,
            message TEXT,
            timestamp TEXT,
            status TEXT
        )`);

        // In-app Messages table
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            sender TEXT,
            recipientId TEXT,
            recipientGroup TEXT,
            subject TEXT,
            content TEXT,
            timestamp TEXT,
            isRead BOOLEAN DEFAULT 0
        )`);

        // Library resources table
        db.run(`CREATE TABLE IF NOT EXISTS library_resources (
            id TEXT PRIMARY KEY,
            title TEXT,
            author TEXT,
            type TEXT,
            category TEXT
        )`);

        // Facilities table
        db.run(`CREATE TABLE IF NOT EXISTS facilities (
            id TEXT PRIMARY KEY,
            name TEXT,
            status TEXT,
            lastCleaned TEXT
        )`);

        // Health records table
        db.run(`CREATE TABLE IF NOT EXISTS health_records (
            id TEXT PRIMARY KEY,
            studentId TEXT,
            studentName TEXT,
            height REAL,
            weight REAL,
            bmi REAL,
            bmiCategory TEXT,
            lastCheckup TEXT,
            remarks TEXT
        )`);

        // Document requests table
        db.run(`CREATE TABLE IF NOT EXISTS document_requests (
            id TEXT PRIMARY KEY,
            studentId TEXT,
            studentName TEXT,
            documentType TEXT,
            purpose TEXT,
            status TEXT,
            dateRequested TEXT
        )`);

        // Fee records table
        db.run(`CREATE TABLE IF NOT EXISTS fee_records (
            id TEXT PRIMARY KEY,
            studentId TEXT,
            description TEXT,
            amount REAL,
            status TEXT,
            category TEXT,
            date TEXT
        )`);
        console.log('Database tables initialized.');
    });
};