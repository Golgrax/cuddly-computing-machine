import express from 'express';
import cors from 'cors';
import { db, initDatabase } from './database.js';
import 'dotenv/config';
import nodemailer from 'nodemailer';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads/avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Configuration (Memory Storage for Sharp processing)
const upload = multer({ storage: multer.memoryStorage() });

// Serve Static Files
app.use('/uploads', express.static('uploads'));

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.use(cors());
app.use(express.json());

// --- LOGGING HELPER ---
const logActivity = (userId, userName, action, category) => {
    const id = 'log-' + Date.now() + Math.random().toString(36).substr(2, 5);
    const timestamp = new Date().toLocaleString();
    console.log(`[ACTIVITY] [${timestamp}] [${category}] ${userName} (${userId}): ${action}`);
    db.run('INSERT INTO activity_logs (id, userId, userName, action, timestamp, category) VALUES (?, ?, ?, ?, ?, ?)', 
        [id, userId || 'system', userName || 'System', action, timestamp, category], 
        (err) => { if (err) console.error("Failed to save log:", err); }
    );
};

// Middleware for request logging
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});

// --- VERIFICATION ROUTES ---
app.get('/api/verify', (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token required" });
    db.get('SELECT * FROM users WHERE verificationToken = ?', [token], (err, user) => {
        if (err || !user) return res.status(400).json({ message: "Invalid or expired token" });
        db.run('UPDATE users SET emailVerified = 1, verificationToken = NULL WHERE id = ?', [user.id], (err) => {
            if (err) return res.status(500).json({ message: "Database error" });
            logActivity(user.id, user.name, "Email Verified", "Auth");
            res.send(`<html><body><h1>Email Verified!</h1><p>Thank you, ${user.name}.</p><a href="http://localhost:3000/">Return to Login</a></body></html>`);
        });
    });
});

app.post('/api/users/:id/avatar', upload.single('avatar'), async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });
    try {
        const filename = `${id}.jpg`;
        const filepath = path.join(uploadDir, filename);
        await sharp(req.file.buffer).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 60, mozjpeg: true }).toFile(filepath);
        const avatarUrl = `/uploads/avatars/${filename}`;
        db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, id], function(err) {
            if (err) return res.status(500).json({ message: "Failed to update user record." });
            logActivity(id, "User", "Updated Profile Picture", "Profile");
            res.json({ message: "Avatar updated successfully", avatarUrl });
        });
    } catch (error) { res.status(500).json({ message: "Failed to process image." }); }
});

// --- DB INIT & SEED ---
const INITIAL_USERS = [
  { id: 'u-admin', name: 'System Admin', email: 'admin@gmail.com', role: 'ADMIN', gradeLevel: 'Grade 1', section: 'Sampaguita', password: '123' },
  { id: 'u-stu1', name: 'Juan Dela Cruz', email: 'student@gmail.com', role: 'STUDENT', lrn: '123456789012', gradeLevel: 'Grade 4', section: 'Narra', attendanceRate: 98, gwa: 92.5, honorStatus: 'With High Honors', is4Ps: true, phone: '09123456789', address: 'Brgy. Santo Niño, City', guardianName: 'Maria Dela Cruz', guardianPhone: '09171234567', psaStatus: 'Verified', feedingProgramStatus: 'Beneficiary', password: '123' },
  { id: 'u-tea1', name: 'Teacher Rose', email: 'teacher@gmail.com', role: 'TEACHER', assignedSections: ['Sampaguita', 'Narra'], password: '123' }
];
const seedDatabase = () => {
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) return;
        if (row.count === 0) {
            const insert = db.prepare('INSERT INTO users (id, name, email, role, gradeLevel, section, password, lrn, attendanceRate, gwa, honorStatus, is4Ps, phone, address, guardianName, guardianPhone, psaStatus, feedingProgramStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            INITIAL_USERS.forEach(user => insert.run(user.id, user.name, user.email, user.role, user.gradeLevel, user.section, user.password, user.lrn, user.attendanceRate, user.gwa, user.honorStatus, user.is4Ps, user.phone, user.address, user.guardianName, user.guardianPhone, user.psaStatus, user.feedingProgramStatus));
            insert.finalize();
        }
    });
};
initDatabase();
setTimeout(seedDatabase, 1000);

// --- API ROUTES ---
app.get('/', (req, res) => res.json({ message: 'Welcome to the Sto. Niño Portal API!' }));

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`[LOGIN ATTEMPT] Email: ${email}`);
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) return res.status(500).json({ message: "Error" });
        if (!user || user.password !== password) return res.status(401).json({ message: "Invalid credentials" });
        const { password: _, ...u } = user;
        logActivity(user.id, user.name, "User Logged In", "Auth");
        res.json(u);
    });
});

// FACILITIES API
app.get('/api/facilities', (req, res) => {
    db.all('SELECT * FROM facilities', [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error fetching facilities" });
        res.json(rows);
    });
});
app.post('/api/facilities', (req, res) => {
    const { name, status, lastCleaned } = req.body;
    const id = 'fac-' + Date.now();
    db.run('INSERT INTO facilities (id, name, status, lastCleaned) VALUES (?, ?, ?, ?)', [id, name, status, lastCleaned], function(err) {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity("Admin", "Admin", `Created Facility: ${name}`, "Facilities");
        res.status(201).json({ id, name, status, lastCleaned });
    });
});
app.put('/api/facilities/:id', (req, res) => {
    const { name, status, lastCleaned } = req.body;
    db.run('UPDATE facilities SET name = ?, status = ?, lastCleaned = ? WHERE id = ?', [name, status, lastCleaned, req.params.id], function(err) {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity("Admin", "Admin", `Updated Facility: ${name}`, "Facilities");
        res.json({ message: "Updated" });
    });
});
app.delete('/api/facilities/:id', (req, res) => {
    db.run('DELETE FROM facilities WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity("Admin", "Admin", `Deleted Facility ${req.params.id}`, "Facilities");
        res.json({ message: "Deleted" });
    });
});

// ANNOUNCEMENTS API
app.get('/api/announcements', (req, res) => {
    db.all('SELECT * FROM announcements', [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error" });
        res.json(rows);
    });
});
app.post('/api/announcements', (req, res) => {
    const { title, content, author, targetSection, category } = req.body;
    const id = 'ann-' + Date.now();
    const date = new Date().toLocaleDateString();
    db.run('INSERT INTO announcements (id, title, content, date, author, targetSection, category) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, title, content, date, author, targetSection, category], function(err) {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity(author, author, `Posted Announcement: ${title}`, "Communication");
        res.status(201).json({ id, title, content, date, author, targetSection, category });
    });
});
app.put('/api/announcements/:id', (req, res) => {
    const { title, content, targetSection, category } = req.body;
    db.run('UPDATE announcements SET title = ?, content = ?, targetSection = ?, category = ? WHERE id = ?', [title, content, targetSection, category, req.params.id], function(err) {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity("User", "User", `Updated Announcement ${req.params.id}`, "Communication");
        res.json({ message: "Updated" });
    });
});
app.delete('/api/announcements/:id', (req, res) => {
    db.run('DELETE FROM announcements WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity("User", "User", `Deleted Announcement ${req.params.id}`, "Communication");
        res.json({ message: "Deleted" });
    });
});

// MESSAGES API
app.get('/api/messages', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "User ID required" });
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) return res.status(404).json({ message: "User not found" });
        const queries = ['recipientId = ?', 'recipientGroup = "All School Guardians"'];
        const params = [userId];
        if (['TEACHER','ADMIN','FACULTY'].includes(user.role)) queries.push('recipientGroup = "Faculty Members"');
        if (user.role === 'STUDENT' && user.section) queries.push(`recipientGroup = "${user.section} Parents"`);
        db.all(`SELECT * FROM messages WHERE ${queries.join(' OR ')} ORDER BY timestamp DESC`, params, (err, messages) => {
            if (err) return res.status(500).json({ message: "Error" });
            res.json(messages);
        });
    });
});

// USERS API
app.get('/api/users', (req, res) => {
    const { id, section, role } = req.query;
    if (id) {
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
            if (err) return res.status(500).json({ message: "Error" });
            if (!row) return res.status(404).json({ message: "Not found" });
            const { password, ...u } = row;
            res.json(u);
        });
    } else {
        let sql = 'SELECT * FROM users';
        let params = [];
        let conditions = [];
        if (section && section !== 'All') { conditions.push('section = ?'); params.push(section); }
        if (role) { conditions.push('role = ?'); params.push(role); }
        if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
        db.all(sql, params, (err, rows) => {
            if (err) return res.status(500).json({ message: "Error" });
            res.json(rows.map(u => { const { password, ...rest } = u; return rest; }));
        });
    }
});
app.post('/api/users', (req, res) => {
    const { name, email, role } = req.body;
    console.log(`[SIGNUP ATTEMPT] Email: ${email}`);
    const id = 'u-' + Date.now();
    const pwd = req.body.password || '123';
    const token = crypto.randomBytes(32).toString('hex');
    db.run('INSERT INTO users (id, name, email, role, password, verificationToken, emailVerified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
        [id, name, email, role, pwd, token, 0, 'active'], 
        async function(err) {
            if (err) {
                console.error("Error creating user:", err.message);
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: "Email already exists" });
                }
                return res.status(500).json({ message: "Error creating user" });
            }
            try {
                // optional email logic
                logActivity(id, name, `New User Created (${role})`, "Admin");
                res.status(201).json({ id, name, email, role });
            } catch(e) { res.status(201).json({ id, name, email, role }); }
    });
});
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    let fields = [], params = [];
    Object.keys(updates).forEach(key => {
        if (key === 'assignedSections') { fields.push(`${key} = ?`); params.push(JSON.stringify(updates[key])); }
        else { fields.push(`${key} = ?`); params.push(updates[key]); }
    });
    if (!fields.length) return res.status(400).json({message:"No fields"});
    params.push(id);
    db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params, (err) => {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity(id, "User/Admin", "User Updated", "Management");
        res.json({ message: "Updated" });
    });
});
app.delete('/api/users/:id', (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity(req.params.id, "Admin", "User Deleted", "Management");
        res.json({ message: "Deleted" });
    });
});

// GENERIC ROUTES
app.get('/api/grades', (req, res) => {
    const { studentId } = req.query;
    let sql = 'SELECT * FROM grades';
    let params = [];
    if (studentId) { sql += ' WHERE studentId = ?'; params.push(studentId); }
    db.all(sql, params, (err, rows) => { if (err) return res.status(500).json({message:"Error"}); res.json(rows); });
});
app.post('/api/grades', (req, res) => {
    const d = req.body;
    const id = 'grade-' + Date.now();
    db.run('INSERT INTO grades (id, studentId, studentName, subject, q1, q2, q3, q4, finalAverage, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
           [id, d.studentId, d.studentName, d.subject, d.q1, d.q2, d.q3, d.q4, d.finalAverage, d.remarks], (err) => {
        if (err) return res.status(500).json({message:"Error"});
        logActivity("Teacher", "Teacher", "Grades Uploaded", "Academic");
        res.status(201).json({id, ...d});
    });
});

app.get('/api/modules', (req, res) => {
    db.all('SELECT * FROM modules', [], (err, rows) => { if (err) return res.status(500).json({message:"Error"}); res.json(rows); });
});
app.post('/api/modules', (req, res) => {
    const d = req.body;
    const id = 'mod-' + Date.now();
    db.run('INSERT INTO modules (id, title, subject, uploadDate, downloadLink, targetSection) VALUES (?, ?, ?, ?, ?, ?)', 
           [id, d.title, d.subject, new Date().toLocaleDateString(), d.downloadLink, d.targetSection], (err) => {
        if (err) return res.status(500).json({message:"Error"});
        logActivity("Teacher", "Teacher", `Module Created: ${d.title}`, "Academic");
        res.status(201).json({id, ...d});
    });
});
app.put('/api/modules/:id', (req, res) => {
    const d = req.body;
    db.run('UPDATE modules SET title = ?, subject = ?, downloadLink = ?, targetSection = ? WHERE id = ?', 
           [d.title, d.subject, d.downloadLink, d.targetSection, req.params.id], (err) => {
        if (err) return res.status(500).json({message:"Error"});
        logActivity("Teacher", "Teacher", "Module Updated", "Academic");
        res.json({message:"Updated"});
    });
});
app.delete('/api/modules/:id', (req, res) => {
    db.run('DELETE FROM modules WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({message:"Error"});
        logActivity("Teacher", "Teacher", "Module Deleted", "Academic");
        res.json({message:"Deleted"});
    });
});

app.get('/api/assignments', (req, res) => {
    const { section } = req.query;
    let sql = 'SELECT * FROM assignments';
    let params = [];
    if (section) { sql += ' WHERE section = ?'; params.push(section); }
    db.all(sql, params, (err, rows) => { if (err) return res.status(500).json({message:"Error"}); res.json(rows); });
});
app.post('/api/assignments', (req, res) => {
    const d = req.body;
    const id = 'asn-' + Date.now();
    db.run('INSERT INTO assignments (id, title, subject, dueDate, section, status) VALUES (?, ?, ?, ?, ?, ?)', 
           [id, d.title, d.subject, d.dueDate, d.section, d.status], (err) => {
        if (err) return res.status(500).json({message:"Error"});
        logActivity("Teacher", "Teacher", `Assignment Created: ${d.title}`, "Academic");
        res.status(201).json({id, ...d});
    });
});
app.put('/api/assignments/:id', (req, res) => {
    const d = req.body;
    db.run('UPDATE assignments SET title = ?, subject = ?, dueDate = ?, section = ?, status = ? WHERE id = ?', 
           [d.title, d.subject, d.dueDate, d.section, d.status, req.params.id], (err) => {
        if (err) return res.status(500).json({message:"Error"});
        res.json({message:"Updated"});
    });
});
app.delete('/api/assignments/:id', (req, res) => {
    db.run('DELETE FROM assignments WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({message:"Error"});
        res.json({message:"Deleted"});
    });
});

app.get('/api/submissions', (req, res) => {
    db.all('SELECT * FROM submissions', [], (err, rows) => { if (err) return res.status(500).json({message:"Error"}); res.json(rows); });
});
app.post('/api/submissions', (req, res) => {
    const d = req.body;
    const id = 'sub-' + Date.now();
    db.run('INSERT INTO submissions (id, assignmentId, studentId, studentName, fileName, fileData, submittedAt, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
           [id, d.assignmentId, d.studentId, d.studentName, d.fileName, d.fileData, new Date().toLocaleString(), 'pending'], (err) => {
        if (err) return res.status(500).json({message:"Error"});
        logActivity(d.studentId, d.studentName, `Submission: ${d.fileName}`, "Academic");
        res.status(201).json({id, ...d});
    });
});
app.put('/api/submissions/:id', (req, res) => {
    const { grade, feedback, status } = req.body;
    db.run('UPDATE submissions SET grade = ?, feedback = ?, status = ? WHERE id = ?', [grade, feedback, status, req.params.id], (err) => {
        if (err) return res.status(500).json({message:"Error"});
        logActivity("Teacher", "Teacher", `Graded Submission ${req.params.id}`, "Academic");
        res.json({message:"Graded"});
    });
});

app.get('/api/attendance', (req, res) => {
    const { studentId, date } = req.query;
    let sql = 'SELECT * FROM attendance';
    let params = [];
    let conditions = [];
    if (studentId) { conditions.push('studentId = ?'); params.push(studentId); }
    if (date) { conditions.push('date = ?'); params.push(date); }
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    console.log(`Executing SQL: ${sql} with params:`, params);
    db.all(sql, params, (err, rows) => {
        if (err) { console.error("Error fetching attendance:", err); return res.status(500).json({ message: "Error" }); }
        console.log(`GET /api/attendance found ${rows.length} records.`);
        res.json(rows);
    });
});
app.post('/api/attendance', (req, res) => {
    const { studentId, date, status } = req.body;
    db.get('SELECT id FROM attendance WHERE studentId = ? AND date = ?', [studentId, date], (err, row) => {
        if (err) return res.status(500).json({ message: "Error" });
        if (row) {
            db.run('UPDATE attendance SET status = ? WHERE id = ?', [status, row.id], (err) => {
                if (err) return res.status(500).json({ message: "Error" });
                logActivity(studentId, "Teacher", `Updated Attendance: ${status} on ${date}`, "Attendance");
                res.json({ id: row.id, studentId, date, status });
            });
        } else {
            const id = 'att-' + Date.now();
            db.run('INSERT INTO attendance (id, studentId, date, status) VALUES (?, ?, ?, ?)', [id, studentId, date, status], (err) => {
                if (err) return res.status(500).json({ message: "Error" });
                logActivity(studentId, "Teacher", `Marked Attendance: ${status} on ${date}`, "Attendance");
                res.status(201).json({ id, studentId, date, status });
            });
        }
    });
});
app.post('/api/attendance/bulk', (req, res) => {
    const { studentIds, startDate, endDate, status } = req.body;
    console.log(`POST /api/attendance/bulk: ${studentIds.length} students from ${startDate} to ${endDate} as ${status}`);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) { dates.push(new Date(d).toISOString().split('T')[0]); }
    const stmt = db.prepare('INSERT OR REPLACE INTO attendance (id, studentId, date, status) VALUES (COALESCE((SELECT id FROM attendance WHERE studentId = ? AND date = ?), ?), ?, ?, ?)');
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        dates.forEach(date => {
            studentIds.forEach(studentId => {
                const id = 'att-' + Date.now() + Math.random().toString(36).substr(2, 5);
                stmt.run(studentId, date, id, studentId, date, status);
            });
        });
        db.run("COMMIT", (err) => {
            if (err) return res.status(500).json({ message: "Error" });
            logActivity("Teacher", "Teacher", `Bulk Attendance Updated (${status})`, "Attendance");
            res.json({ message: "Bulk attendance updated successfully" });
        });
        stmt.finalize();
    });
});

app.get('/api/dropouts', (req, res) => { db.all('SELECT * FROM dropout_requests', [], (err, rows) => { res.json(rows); }); });
app.post('/api/dropouts', (req, res) => {
    const { studentId, studentName, reason } = req.body;
    const id = 'drp-' + Date.now();
    db.run('INSERT INTO dropout_requests (id, studentId, studentName, reason, status, timestamp) VALUES (?, ?, ?, ?, ?, ?)', 
           [id, studentId, studentName, reason, 'pending', new Date().toLocaleString()], (err) => {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity(studentId, studentName, "Submitted Dropout Request", "Admissions");
        res.status(201).json({ id, studentId, studentName, reason, status: 'pending' });
    });
});
app.put('/api/dropouts/:id', (req, res) => {
    const { status } = req.body;
    db.run('UPDATE dropout_requests SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity("Admin", "Registrar", `Updated Dropout Request ${req.params.id}`, "Admissions");
        res.json({ message: "Updated" });
    });
});

app.get('/api/schedule', (req, res) => { db.all('SELECT * FROM schedule', [], (err, rows) => { res.json(rows); }); });
app.get('/api/clearance', (req, res) => { db.all('SELECT * FROM clearance_items', [], (err, rows) => { res.json(rows); }); });
app.get('/api/library', (req, res) => { db.all('SELECT * FROM library_resources', [], (err, rows) => { res.json(rows); }); });
app.get('/api/health', (req, res) => { db.all('SELECT * FROM health_records', [], (err, rows) => { res.json(rows); }); });

app.get('/api/doc-requests', (req, res) => { db.all('SELECT * FROM document_requests', [], (err, rows) => { res.json(rows); }); });
app.post('/api/doc-requests', (req, res) => {
    const { studentId, studentName, documentType, purpose } = req.body;
    const id = 'req-' + Date.now();
    db.run('INSERT INTO document_requests (id, studentId, studentName, documentType, purpose, status, dateRequested) VALUES (?, ?, ?, ?, ?, ?, ?)', 
           [id, studentId, studentName, documentType, purpose, 'pending', new Date().toLocaleDateString()], (err) => {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity(studentId, studentName, `Requested Document: ${documentType}`, "Admissions");
        res.status(201).json({ id, studentId, studentName, documentType, purpose, status: 'pending' });
    });
});
app.put('/api/doc-requests/:id', (req, res) => {
    const { status } = req.body;
    db.run('UPDATE document_requests SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity("Admin", "Registrar", `Updated Doc Request ${req.params.id}`, "Admissions");
        res.json({ message: "Updated" });
    });
});
app.get('/api/finances', (req, res) => { db.all('SELECT * FROM fee_records', [], (err, rows) => { res.json(rows); }); });
app.get('/api/email-logs', (req, res) => { db.all('SELECT * FROM email_logs ORDER BY timestamp DESC', [], (err, rows) => { res.json(rows); }); });

// Tables API (Database Forge)
app.get('/api/tables', (req, res) => { db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [], (err, rows) => { res.json(rows.map(r=>r.name)); }); });
app.get('/api/table/:tableName/info', (req, res) => { db.all(`PRAGMA table_info(${req.params.tableName})`, [], (err, rows) => { res.json(rows); }); });
app.get('/api/table/:tableName', (req, res) => { db.all(`SELECT * FROM ${req.params.tableName}`, [], (err, rows) => { res.json(rows); }); });
app.post('/api/table/:tableName', (req, res) => {
    const { tableName } = req.params;
    const data = req.body;
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    db.run(sql, values, function(err) {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity("Admin", "Admin", `Direct Insert to ${tableName}`, "Database Forge");
        res.status(201).json({ id: this.lastID, ...data });
    });
});
app.put('/api/table/:tableName/:id', (req, res) => {
    const { tableName, id } = req.params;
    const data = req.body;
    const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    db.run(`UPDATE ${tableName} SET ${updates} WHERE id = ?`, values, function(err) {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity("Admin", "Admin", `Direct Update to ${tableName} (${id})`, "Database Forge");
        res.json({ message: "Updated" });
    });
});
app.delete('/api/table/:tableName/:id', (req, res) => {
    const { tableName, id } = req.params;
    db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity("Admin", "Admin", `Direct Delete from ${tableName} (${id})`, "Database Forge");
        res.json({ message: "Deleted" });
    });
});

app.post('/api/email-broadcast', async (req, res) => {
    const { targets, subject, message } = req.body;
    const id = 'email-' + Date.now();
    if (!targets || !targets.length) return res.status(400).json({message:"No targets"});
    try {
        const resolvedUsers = new Map();
        for (const target of targets) {
            if (target.type === 'user') {
                const user = await new Promise((r) => db.get('SELECT * FROM users WHERE id = ?', [target.value], (e, row) => r(row)));
                if(user) resolvedUsers.set(user.id, user);
            } else if (target.type === 'role' || target.type === 'section') {
                const col = target.type === 'role' ? 'role' : 'section';
                const users = await new Promise((r) => db.all(`SELECT * FROM users WHERE ${col} = ?`, [target.value], (e, rows) => r(rows)));
                users.forEach(u => resolvedUsers.set(u.id, u));
            }
        }
        const uniqueUsers = Array.from(resolvedUsers.values());
        if (uniqueUsers.length === 0) return res.status(404).json({ message: "No users" });
        
        // 2. Insert In-App Messages
        const msgIdBase = 'msg-' + Date.now();
        const messageInserts = uniqueUsers.map((u, idx) => {
            return new Promise((resolve) => {
                db.run('INSERT INTO messages (id, sender, recipientId, recipientGroup, subject, content, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [`${msgIdBase}-${idx}`, 'School Administration', u.id, 'Direct', subject, message, new Date().toLocaleString()],
                    (err) => resolve(err ? false : true)
                );
            });
        });
        await Promise.all(messageInserts);

        if (process.env.EMAIL_USER) {
             const emails = uniqueUsers.map(u => u.email).filter(e => e && e.includes('@'));
             if(emails.length) await transporter.sendMail({
                from: process.env.EMAIL_USER, bcc: emails, subject: subject || "Announcement", text: message
             });
        }
        const recipientSummary = targets.map(t => t.label || t.value).join(', ');
        db.run('INSERT INTO email_logs (id, recipient, subject, message, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)', 
               [id, `Broadcast: ${recipientSummary}`, subject, message, new Date().toLocaleString(), 'sent'], (err) => {});
        logActivity("Admin/Faculty", "Sender", `Broadcast Sent to ${uniqueUsers.length} users`, "Communication");
        res.status(201).json({ message: "Broadcast sent" });
    } catch (e) { console.error(e); res.status(500).json({ message: "Error" }); }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});