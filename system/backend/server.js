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
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadRoot = path.join(__dirname, '../uploads');
const uploadDir = path.join(uploadRoot, 'avatars');
const docsDir = path.join(uploadRoot, 'documents');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
}

// Multer Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'file' || file.fieldname === 'sf9') {
      cb(null, docsDir);
    } else {
      cb(null, uploadDir); // Default or fallback (avatars)
    }
  },
  filename: function (req, file, cb) {
    // Keep original extension
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Memory upload for avatars (specific handling if needed, or reuse disk storage but resizing handles it)
// For now, let's keep the existing avatar route using buffer if possible, BUT
// the previous code used `multer.memoryStorage()` for everything. 
// We need to mix them or use conditional logic. 
// Simpler: Use memory storage for avatar route specifically if we want to process with Sharp immediately.
// But we can also process from disk.
// To avoid breaking the avatar route which expects `req.file.buffer`, let's define a separate upload middleware for avatars if we want to keep memory storage there, 
// OR simpler: Use disk storage for everything and read from disk for Sharp.
// However, let's just make a specific instance for documents.

const documentUpload = multer({ storage: storage });
const avatarUpload = multer({ storage: multer.memoryStorage() }); // Keep original for avatars

// Serve Static Files
app.use('/uploads', express.static(uploadRoot));

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: true, // show debug output
  logger: true // log information in console
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

app.get('/api/logs', (req, res) => {
    db.all('SELECT * FROM activity_logs ORDER BY timestamp DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error fetching logs" });
        res.json(rows);
    });
});

// Middleware for request logging
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});

// --- VERIFICATION ROUTES ---
app.post('/api/resend-verification', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) return res.status(404).json({ message: "User not found" });
        if (user.emailVerified) return res.status(400).json({ message: "Email already verified" });

        const verificationLink = `http://localhost:${PORT}/api/verify?token=${user.verificationToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your email - Sto. Niño Portal',
            html: `
                <h1>Welcome Back to Sto. Niño Portal!</h1>
                <p>Hello ${user.name},</p>
                <p>You requested a new verification email. Please click the link below to verify your email address:</p>
                <a href="${verificationLink}">Verify Email</a>
                <p>If you did not request this, please ignore this email.</p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending verification email:', error);
                return res.status(500).json({ message: "Failed to send email" });
            }
            console.log('Verification email resent:', info.response);
            res.json({ message: "Verification email sent" });
        });
    });
});

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

app.post('/api/users/:id/avatar', avatarUpload.single('avatar'), async (req, res) => {
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
  { id: 'u-admin', name: 'System Admin', email: 'admin@gmail.com', role: 'ADMIN', gradeLevel: 'Grade 1', section: 'Sampaguita', password: '123', schoolYear: '2025-2026', birthDate: '1990-01-01' },
  { id: 'u-stu1', name: 'Juan Dela Cruz', email: 'student@gmail.com', role: 'STUDENT', lrn: '123456789012', gradeLevel: 'Grade 4', section: 'Narra', attendanceRate: 98, gwa: 92.5, honorStatus: 'With High Honors', is4Ps: true, phone: '09123456789', address: 'Brgy. Santo Niño, City', guardianName: 'Maria Dela Cruz', guardianPhone: '09171234567', psaStatus: 'Verified', feedingProgramStatus: 'Beneficiary', password: '123', schoolYear: '2025-2026', birthDate: '2015-06-15' },
  { id: 'u-tea1', name: 'Teacher Rose', email: 'teacher@gmail.com', role: 'TEACHER', assignedSections: ['Sampaguita', 'Narra'], password: '123', schoolYear: '2025-2026', birthDate: '1985-05-20' }
];
const seedDatabase = () => {
    db.run("ALTER TABLE document_requests ADD COLUMN feedback TEXT", (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error("Migration error (feedback):", err.message);
    });

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
    console.log(`[LOGIN ATTEMPT] Identifier: ${email}`);
    // Check against email OR id
    db.get('SELECT * FROM users WHERE email = ? OR id = ?', [email, email], (err, user) => {
        if (err) return res.status(500).json({ message: "Error" });
        if (!user || user.password !== password) return res.status(401).json({ message: "Invalid credentials" });
        
        if (user.status === 'dropped') {
            return res.status(403).json({ message: "Account is dropped. Please re-apply for admission." });
        }

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
            if (err) {
                console.error("GET /api/users Error:", err);
                return res.status(500).json({ message: "Error", error: err.message });
            }
            if (!row) return res.status(404).json({ message: "User not found" });
            const { password, ...rest } = row;
            res.json(rest);
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
    const { firstName, middleName, lastName, extension, email, role } = req.body;
    // Fallback if legacy 'name' is sent but not parts (should be handled by frontend, but safety check)
    let finalName = req.body.name;
    if (!finalName && firstName) {
        finalName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}${extension ? ' ' + extension : ''}`.trim();
    }

    console.log(`[SIGNUP ATTEMPT] Email: ${email}`);
    const id = 'u-' + Date.now();
    const pwd = req.body.password || '123';
    const token = crypto.randomBytes(32).toString('hex');
    db.run('INSERT INTO users (id, name, firstName, middleName, lastName, extension, email, role, password, verificationToken, emailVerified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [id, finalName, firstName, middleName, lastName, extension, email, role, pwd, token, 0, 'active'], 
        async function(err) {
            if (err) {
                console.error("Error creating user:", err.message);
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: "Email already exists" });
                }
                return res.status(500).json({ message: "Error creating user" });
            }
            try {
                // Email Verification Logic
                const verificationLink = `http://localhost:${PORT}/api/verify?token=${token}`;
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Verify your email - Sto. Niño Portal',
                    html: `
                        <h1>Welcome to Sto. Niño Portal!</h1>
                        <p>Hello ${finalName},</p>
                        <p>Please click the link below to verify your email address:</p>
                        <a href="${verificationLink}">Verify Email</a>
                        <p>If you did not sign up, please ignore this email.</p>
                    `
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log('Error sending verification email:', error);
                    } else {
                        console.log('Verification email sent:', info.response);
                    }
                });

                logActivity(id, finalName, `New User Created (${role})`, "Admin");
                res.status(201).json({ id, name: finalName, email, role });
            } catch(e) { res.status(201).json({ id, name: finalName, email, role }); }
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
    db.run('UPDATE users SET status = ? WHERE id = ?', ['dropped', req.params.id], (err) => {
        if (err) return res.status(500).json({ message: "Error" });
        logActivity(req.params.id, "Admin", "User Dropped (Soft Delete)", "Management");
        res.json({ message: "User dropped successfully" });
    });
});

// GENERIC ROUTES
app.get('/api/grades', (req, res) => {
    const { studentId } = req.query;
    let sql = 'SELECT * FROM grades';
    let params = [];
    if (studentId) { sql += ' WHERE studentId = ?'; params.push(studentId); }
    console.log(`[DEBUG] Executing Grades SQL: ${sql} with params:`, params);
    db.all(sql, params, (err, rows) => { 
        if (err) {
            console.error("[ERROR] Grades query failed:", err);
            return res.status(500).json({message:"Error"}); 
        }
        console.log(`[DEBUG] Found ${rows.length} grade records.`);
        res.json(rows); 
    });
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
app.put('/api/grades/:id', (req, res) => {
    const d = req.body;
    db.run('UPDATE grades SET q1 = ?, q2 = ?, q3 = ?, q4 = ?, finalAverage = ?, remarks = ?, subject = ? WHERE id = ?',
           [d.q1, d.q2, d.q3, d.q4, d.finalAverage, d.remarks, d.subject, req.params.id], (err) => {
        if (err) return res.status(500).json({message:"Error"});
        logActivity("Teacher", "Teacher", "Grade Updated", "Academic");
        res.json({message:"Updated"});
    });
});
app.delete('/api/grades/:id', (req, res) => {
    db.run('DELETE FROM grades WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({message:"Error"});
        logActivity("Teacher", "Teacher", "Grade Deleted", "Academic");
        res.json({message:"Deleted"});
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
    db.run('INSERT INTO assignments (id, title, subject, dueDate, dueTime, section, status, allowedFileTypes, isLocked, resourceLink) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
           [id, d.title, d.subject, d.dueDate, d.dueTime, d.section, d.status, d.allowedFileTypes, 0, d.resourceLink], (err) => {
        if (err) return res.status(500).json({message:"Error"});
        logActivity("Teacher", "Teacher", `Assignment Created: ${d.title}`, "Academic");
        res.status(201).json({id, ...d, isLocked: 0});
    });
});
app.put('/api/assignments/:id', (req, res) => {
    const d = req.body;
    db.run('UPDATE assignments SET title = ?, subject = ?, dueDate = ?, dueTime = ?, section = ?, status = ?, allowedFileTypes = ?, isLocked = ?, resourceLink = ? WHERE id = ?', 
           [d.title, d.subject, d.dueDate, d.dueTime, d.section, d.status, d.allowedFileTypes, d.isLocked, d.resourceLink, req.params.id], (err) => {
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
app.post('/api/submissions', documentUpload.single('file'), (req, res) => {
    try {
        const d = req.body;
        console.log('[DEBUG] POST /api/submissions body:', JSON.stringify(d, null, 2));
        
        // 1. Check for existing submission
        db.get('SELECT id FROM submissions WHERE assignmentId = ? AND studentId = ?', [d.assignmentId, d.studentId], (err, row) => {
             if (err) return res.status(500).json({message: "Database error"});
             if (row) return res.status(400).json({message: "You have already submitted for this assignment."});

             // 2. Check assignment details (Deadline, Lock Status, File Type)
             db.get('SELECT * FROM assignments WHERE id = ?', [d.assignmentId], (err, assignment) => {
                 if (err || !assignment) return res.status(404).json({message: "Assignment not found"});
                 
                 // Check if locked
                 if (assignment.isLocked) return res.status(400).json({message: "This assignment is closed for submissions."});
                 
                 // Check deadline
                 if (assignment.dueDate) {
                     const deadlineString = assignment.dueTime ? `${assignment.dueDate}T${assignment.dueTime}` : `${assignment.dueDate}T23:59:00`;
                     const deadline = new Date(deadlineString);
                     if (new Date() > deadline) {
                         return res.status(400).json({message: "The deadline for this assignment has passed."});
                     }
                 }

                 // Check file type
                 let fileName = d.fileName;
                 if (req.file) fileName = req.file.originalname;
                 
                 if (assignment.allowedFileTypes && assignment.allowedFileTypes.length > 0) {
                     const allowed = assignment.allowedFileTypes.split(',').map(t => t.trim().toLowerCase());
                     const ext = '.' + fileName.split('.').pop().toLowerCase();
                     const normalizedAllowed = allowed.map(t => t.startsWith('.') ? t : '.' + t);
                     
                     // Allow if ext matches any allowed type
                     if (!normalizedAllowed.includes(ext)) {
                         return res.status(400).json({message: `Invalid file format. Allowed: ${assignment.allowedFileTypes}`});
                     }
                 }

                 // Proceed with insertion
                 const id = 'sub-' + Date.now();
                 let fileData = d.fileData;
                 if (req.file) {
                     const relativePath = '/uploads/documents/' + req.file.filename;
                     fileData = relativePath;
                 }
         
                 db.run('INSERT INTO submissions (id, assignmentId, studentId, studentName, fileName, fileData, submittedAt, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
                     [id, d.assignmentId, d.studentId, d.studentName, fileName, fileData, new Date().toLocaleString(), 'pending'], (err) => {
                     if (err) {
                         console.error('[ERROR] Database insert failed:', err);
                         return res.status(500).json({message:"Error inserting into database", error: err.message});
                     }
                     logActivity(d.studentId, d.studentName, `Submission: ${fileName}`, "Academic");
                     res.status(201).json({id, ...d, fileName, fileData});
                 });
             });
        });
    } catch (error) {
        console.error('[ERROR] Exception in /api/submissions:', error);
        res.status(500).json({message: "Internal Server Error", error: error.message});
    }
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
    const { id } = req.params;

    db.get('SELECT * FROM dropout_requests WHERE id = ?', [id], (err, request) => {
        if (err || !request) return res.status(404).json({ message: "Request not found" });

        db.run('UPDATE dropout_requests SET status = ? WHERE id = ?', [status, id], (err) => {
            if (err) return res.status(500).json({ message: "Error updating request" });
            
            if (status === 'approved') {
                db.run('UPDATE users SET status = ? WHERE id = ?', ['dropped', request.studentId], (err) => {
                    if (err) console.error("Failed to update user status:", err);
                    logActivity("Admin", "Registrar", `Approved Dropout for ${request.studentName}`, "Admissions");
                });
            } else {
                logActivity("Admin", "Registrar", `Updated Dropout Request ${id} to ${status}`, "Admissions");
            }
            
            res.json({ message: "Updated" });
        });
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
    const { status, feedback } = req.body;
    const { id } = req.params;

    db.get('SELECT * FROM document_requests WHERE id = ?', [id], (err, request) => {
        if (err || !request) return res.status(404).json({ message: "Request not found" });

        db.run('UPDATE document_requests SET status = ?, feedback = ? WHERE id = ?', [status, feedback || '', id], (err) => {
            if (err) return res.status(500).json({ message: "Error" });
            
            logActivity("Admin", "Registrar", `Updated Doc Request ${id} to ${status}`, "Admissions");

            // Notification Logic
            if (status === 'ready' || status === 'rejected' || status === 'approved') {
                db.get('SELECT * FROM users WHERE id = ?', [request.studentId], (err, user) => {
                    if (user) {
                        const subject = `Document Request Update: ${request.documentType}`;
                        let message = `Your request for ${request.documentType} has been marked as: ${status.toUpperCase()}.`;
                        
                        if (status === 'ready') message += ' You may claim it at the Registrar Office.';
                        if (feedback) message += `\n\nAdmin Remarks: "${feedback}"`;

                        // 1. In-App Message
                        const msgId = 'msg-' + Date.now();
                        db.run('INSERT INTO messages (id, sender, recipientId, recipientGroup, subject, content, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [msgId, 'Registrar', user.id, 'Direct', subject, message, new Date().toLocaleString()],
                            (err) => { if (err) console.error("Failed to send in-app msg:", err); }
                        );

                        // 2. Email
                        if (process.env.EMAIL_USER && user.email) {
                            transporter.sendMail({
                                from: process.env.EMAIL_USER,
                                to: user.email,
                                subject: subject,
                                text: message
                            }, (err) => { if (err) console.error("Failed to send email:", err); });
                        }
                    }
                });
            }

            res.json({ message: "Updated" });
        });
    });
});

// ENROLLMENT API
app.get('/api/enrollment', (req, res) => {
    db.all('SELECT * FROM enrollment_applications', [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error" });
        res.json(rows.map(r => ({ id: r.id, ...r })));
    });
});
app.post('/api/enrollment', (req, res, next) => {
    documentUpload.array('sf9', 10)(req, res, function (err) {
        if (err) {
            console.error("Multer Error:", err);
            return res.status(500).json({ message: "File upload error: " + err.message });
        }
        next();
    });
}, (req, res) => {
    console.log("Enrollment Req Body:", req.body);
    // If no text fields, body might be empty if not parsed correctly, but multer array handles mixed multipart.
    // However, if no files are sent, req.body is still populated.
    
    if (!req.body) return res.status(400).json({ message: "No body data" });
    
    const { firstName, middleName, lastName, extension, email, targetGrade, previousSchool, parentName, parentContact } = req.body;
    let fullName = req.body.fullName;
    if (!fullName && firstName) {
        fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}${extension ? ' ' + extension : ''}`.trim();
    }

    const id = 'app-' + Date.now();
    
    let sf9Path = '';
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        sf9Path = req.files.map(f => '/uploads/documents/' + f.filename).join(',');
    } else if (req.file) {
        // Fallback if single was used or logic varies (though we used array())
        sf9Path = '/uploads/documents/' + req.file.filename;
    }

    db.run('INSERT INTO enrollment_applications (id, fullName, firstName, middleName, lastName, extension, email, targetGrade, previousSchool, parentName, parentContact, status, dateApplied, sf9Path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, fullName, firstName, middleName, lastName, extension, email, targetGrade, previousSchool, parentName, parentContact, 'pending', new Date().toLocaleDateString(), sf9Path],
        function(err) {
            if (err) {
                console.error("Enrollment Insert Error:", err);
                return res.status(500).json({ message: "Error saving application" });
            }
            logActivity("System", "Applicant", `New Enrollment App: ${fullName}`, "Admissions");
            res.status(201).json({ id, fullName, email, status: 'pending' });
        }
    );
});
app.put('/api/enrollment/:id', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (status === 'approved') {
        db.get('SELECT * FROM enrollment_applications WHERE id = ?', [id], (err, app) => {
            if (err || !app) return res.status(404).json({ message: "Application not found" });

            // Check if user already exists
            db.get('SELECT * FROM users WHERE email = ?', [app.email], (err, existingUser) => {
                if (existingUser) {
                    if (existingUser.status === 'dropped') {
                        // Reactivate user
                        db.run(`UPDATE users SET 
                            status = 'active', 
                            gradeLevel = ?, 
                            section = ?, 
                            guardianName = ?, 
                            guardianPhone = ?,
                            role = 'STUDENT'
                            WHERE id = ?`, 
                            [app.targetGrade, 'TBD', app.parentName, app.parentContact, existingUser.id],
                            (err) => {
                                if (err) return res.status(500).json({ message: "Error reactivating user" });
                                
                                db.run('UPDATE enrollment_applications SET status = ? WHERE id = ?', [status, id], (err) => {
                                    if (err) return res.status(500).json({ message: "Error updating app status" });
                                    logActivity("Admin", "Registrar", `Re-admitted User ${existingUser.name}`, "Admissions");
                                    res.json({ message: "User re-admitted successfully" });
                                });
                            }
                        );
                        return;
                    }
                    return res.status(400).json({ message: "User with this email already exists" });
                }

                // Generate Password and LRN
                const generatedPassword = Math.random().toString(36).slice(-8);
                const generatedLRN = Math.floor(100000000000 + Math.random() * 900000000000).toString();
                const userId = 'u-' + Date.now();

                // Create User
                const academicHistory = JSON.stringify([{
                    grade: 'Previous',
                    school: app.previousSchool || 'N/A',
                    year: 'N/A'
                }]);
                const requirements = JSON.stringify({
                    SF9: app.sf9Path || ''
                });

                db.run(`INSERT INTO users (id, name, firstName, middleName, lastName, extension, email, password, role, lrn, gradeLevel, guardianName, guardianPhone, academicHistory, requirements, status, emailVerified) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId, 
                        app.fullName, 
                        app.firstName, 
                        app.middleName, 
                        app.lastName, 
                        app.extension, 
                        app.email, 
                        generatedPassword, 
                        'STUDENT', 
                        generatedLRN,
                        app.targetGrade, 
                        app.parentName,
                        app.parentContact,
                        academicHistory,
                        requirements,
                        'active', 
                        1 // Verified
                    ], 
                    (err) => {
                        if (err) {
                            console.error("Failed to create user from enrollment:", err);
                            return res.status(500).json({ message: "Failed to create user record" });
                        }

                        // Send Email
                        if (process.env.EMAIL_USER) {
                            const mailOptions = {
                                from: process.env.EMAIL_USER,
                                to: app.email,
                                subject: 'Admission Approved - Sto. Niño Portal',
                                html: `
                                    <h1>Welcome to Sto. Niño Elementary School!</h1>
                                    <p>Dear ${app.fullName},</p>
                                    <p>Your admission application has been <strong>APPROVED</strong>.</p>
                                    <p>Your Learner Reference Number (LRN) is: <strong>${generatedLRN}</strong></p>
                                    <p>You can now log in to the student portal using the credentials below:</p>
                                    <p><strong>Email:</strong> ${app.email}</p>
                                    <p><strong>Password:</strong> ${generatedPassword}</p>
                                    <p>Please change your password after your first login.</p>
                                `
                            };

                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) console.error("Failed to send approval email:", error);
                                else console.log("Approval email sent:", info.response);
                            });
                        }

                        // Update Status
                        db.run('UPDATE enrollment_applications SET status = ? WHERE id = ?', [status, id], (err) => {
                            if (err) return res.status(500).json({ message: "Error updating status" });
                            logActivity("Admin", "Registrar", `Approved & Created User for ${app.fullName} (LRN: ${generatedLRN})`, "Admissions");
                            res.json({ message: "Application approved and user created" });
                        });
                    }
                );
            });
        });
    } else {
        db.run('UPDATE enrollment_applications SET status = ? WHERE id = ?', [status, id], (err) => {
            if (err) return res.status(500).json({ message: "Error" });
            logActivity("Admin", "Registrar", `Updated Enrollment App ${id}`, "Admissions");
            res.json({ message: "Updated" });
        });
    }
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

// --- PASSWORD RESET ROUTES ---
app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) return res.status(404).json({ message: "User not found" });
        if (user.role === 'ADMIN') return res.status(403).json({ message: "Admin password reset is restricted. Please contact system support." });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        db.run('UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?', [resetToken, resetTokenExpiry, user.id], (err) => {
            if (err) return res.status(500).json({ message: "Database error" });

            const resetLink = `http://localhost:3000/forgot-password?token=${resetToken}`;
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Password Reset Token - Sto. Niño Portal',
                html: `
                    <h1>Password Reset Request</h1>
                    <p>Hello ${user.name},</p>
                    <p>You requested a password reset. Please copy the token below and paste it into the recovery form:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0;">
                        ${resetToken}
                    </div>
                    <p>Or click this link to auto-fill: <a href="${resetLink}">Reset Password</a></p>
                    <p>This token will expire in 1 hour.</p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('Error sending reset email:', error);
                    return res.status(500).json({ message: "Failed to send email" });
                }
                console.log('Reset email sent:', info.response);
                res.json({ message: "Password reset email sent" });
            });
        });
    });
});

app.post('/api/auth/reset-password', (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Token and new password required" });

    db.get('SELECT * FROM users WHERE resetToken = ?', [token], (err, user) => {
        if (err || !user) return res.status(400).json({ message: "Invalid or expired token" });
        
        if (Date.now() > user.resetTokenExpiry) {
            return res.status(400).json({ message: "Token expired" });
        }

        db.run('UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?', [newPassword, user.id], (err) => {
            if (err) return res.status(500).json({ message: "Database error" });
            logActivity(user.id, user.name, "Password Reset", "Auth");
            res.json({ message: "Password reset successfully" });
        });
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});