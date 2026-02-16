const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { PDFDocument, rgb, StandardFonts, PDFName, PDFRawStream } = require('pdf-lib');
const ExcelJS = require('exceljs');
const sqlite3 = require('sqlite3').verbose();
const pako = require('pako');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const DB_PATH = path.join(__dirname, '../../system/backend/db.sqlite');
const db = new sqlite3.Database(DB_PATH);

const SAMPLE_K12_PDF = path.join(__dirname, '../../sample/k12.pdf');
const SAMPLE_INSIDE_PDF = path.join(__dirname, '../../sample/inside.pdf');
const SAMPLE_EXCEL_PATH = path.join(__dirname, '../../samples/SF 9 REPORT CARD AUTOMATED (SY 2025-2026) GRADE 5(1)(1).xlsx');

// --- STREAM CLEANING UTILITY ---
async function cleanPageContent(page, stringsToRemove) {
    const { Contents } = page.node.normalizedEntries();
    if (!Contents) return;

    const streams = Array.isArray(Contents) ? Contents : [Contents];
    
    for (const streamRef of streams) {
        const stream = page.doc.context.lookup(streamRef);
        if (!(stream instanceof PDFRawStream)) continue;

        let decoded;
        try {
            const buffer = stream.contents;
            // pdf-lib raw streams might be FlateDecoded
            decoded = pako.inflate(buffer);
        } catch (e) {
            // If not compressed or failed to decompress, try raw
            decoded = stream.contents;
        }

        let text = new TextDecoder().decode(decoded);
        let modified = false;

        stringsToRemove.forEach(str => {
            if (!str) return;
            const escapedStr = str.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Match various ways text is stored in PDF content streams
            const patterns = [
                `\\(${escapedStr}\\)Tj`,
                `\\(${escapedStr}\\) Tj`,
                `\\(${escapedStr}\\)  Tj`,
                `\\[\\(${escapedStr}\\)\\]TJ`,
                `\\(${escapedStr}\\)'`,
            ];
            
            patterns.forEach(p => {
                const regex = new RegExp(p, 'g');
                if (regex.test(text)) {
                    text = text.replace(regex, '()Tj'); 
                    modified = true;
                }
            });
        });

        if (modified) {
            const recompressed = pako.deflate(new TextEncoder().encode(text));
            stream.contents = recompressed;
            stream.dict.set(PDFName.of('Filter'), PDFName.of('FlateDecode'));
            stream.dict.set(PDFName.of('Length'), page.doc.context.obj(recompressed.length));
        }
    }
}

// --- DB HELPERS ---
async function getStudentData(studentId) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE id = ?", [studentId], (err, row) => {
            if (err) reject(err); else resolve(row);
        });
    });
}

async function getGrades(studentId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM grades WHERE studentId = ?", [studentId], (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });
}

async function getAttendance(studentId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM attendance WHERE studentId = ?", [studentId], (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });
}

async function getSchoolDays() {
    return new Promise((resolve, reject) => {
        db.all("SELECT date FROM attendance GROUP BY date", (err, rows) => {
            if (err) reject(err); else resolve(rows.map(r => r.date));
        });
    });
}

function calculateAge(birthDate) {
    if (!birthDate) return '10';
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age.toString();
}

// --- PDF FILLING ---
const PAGE_UNIT_WIDTH = 52.625;
const PAGE_UNIT_HEIGHT = 37.188;

async function fillPdf(pdfPath, userData, grades = [], attendance = [], allDates = []) {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const isFront = pdfPath.includes('k12.pdf');
    const isInside = pdfPath.includes('inside.pdf');

    // Strings to remove from the template to make "modification" clean
    const toRemove = isFront ? [
        'Carlo Dela Cruz', '10', 'MALE', '123456789012', 'FIVE', 'RIZAL', '2025-2026',
        '9', '8', '10', '90', '1', '2', '0', '10', '100'
    ] : [
        '77', '78', '84', '81', '79', '80', '85', '87', '83', '86', '88', '82', 'Passed'
    ];
    
    await cleanPageContent(page, toRemove);

    const draw = (px, py, text, size = 9) => {
        if (text === undefined || text === null || text === '') return;
        const x = px * (width / PAGE_UNIT_WIDTH);
        const y = height - (py * (height / PAGE_UNIT_HEIGHT));
        page.drawText(text.toString(), { x, y, size, font, color: rgb(0, 0, 0) });
    };

    if (isFront) {
        draw(34.85, 11.24, userData.name, 10);
        draw(29.73, 12.02, calculateAge(userData.birthDate));
        draw(36.33, 12.02, userData.sex || 'MALE');
        draw(40.82, 12.02, userData.lrn || '');
        draw(31.04, 12.87, (userData.gradeLevel || '').replace('Grade ', '').toUpperCase());
        draw(40.52, 12.87, (userData.section || '').toUpperCase());
        draw(32.52, 13.71, userData.schoolYear || '2025-2026');

        const months = ['June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
        let ts = 0, tp = 0, ta = 0;
        months.forEach((m, i) => {
            const mDates = allDates.filter(d => new Date(d).toLocaleString('default', { month: 'long' }) === m);
            const mAtt = attendance.filter(a => new Date(a.date).toLocaleString('default', { month: 'long' }) === m);
            const s = mDates.length;
            const p = mAtt.filter(a => a.status === 'present').length;
            const a = mAtt.filter(a => a.status === 'absent' || a.status === 'excused').length;
            
            const x = 5.01 + (i * 1.101);
            draw(x, 11.94, p.toString(), 8);
            draw(x, 13.16, s.toString(), 8);
            draw(x, 14.39, a.toString(), 8);
            ts += s; tp += p; ta += a;
        });
        draw(18.05, 11.93, tp.toString(), 9);
        draw(18.05, 13.16, ts.toString(), 9);
        draw(18.05, 14.39, ta.toString(), 9);
    }

    if (isInside) {
        const mapping = { 
            'filipino': 5.09, 'english': 6.57, 'mathematics': 8.04, 'science': 9.52, 
            'good manners': 11.60, 'esp': 11.60, 'araling panlipunan': 13.98, 
            'epp': 16.80, 'tle': 16.80, 'mapeh': 19.02, 'music & arts': 20.13, 'pe & health': 21.09
        };
        
        grades.forEach(g => {
            const sub = g.subject.toLowerCase();
            let y = null;
            for (const [key, val] of Object.entries(mapping)) {
                if (sub.includes(key)) { y = val; break; }
            }
            if (y) {
                const x_offset = (sub.includes('music') || sub.includes('pe & health')) ? 0.61 : 0;
                draw(7.72 + x_offset, y, g.q1, 9);
                draw(9.76 + x_offset, y, g.q2, 9);
                draw(11.80 + x_offset, y, g.q3, 9);
                draw(13.84 + x_offset, y, g.q4, 9);
                const fa_x = (sub.includes('music') || sub.includes('pe & health')) ? 17.22 : 16.31;
                draw(fa_x, y, g.finalAverage, 9);
                draw(18.65, y, g.remarks || (g.finalAverage >= 75 ? 'Passed' : 'Failed'), 8);
            }
        });
        draw(16.27, 23.83, userData.gwa, 10);
    }
    return await pdfDoc.save();
}

app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { studentId } = req.body;
        const userData = await getStudentData(studentId);
        if (!userData) return res.status(404).send("Student not found");
        
        const grades = await getGrades(studentId);
        const attendance = await getAttendance(studentId);
        const allDates = await getSchoolDays();

        const fullPdf = await PDFDocument.create();
        const fBytes = await fillPdf(SAMPLE_K12_PDF, userData, grades, attendance, allDates);
        const iBytes = await fillPdf(SAMPLE_INSIDE_PDF, userData, grades, attendance, allDates);
        
        const d1 = await PDFDocument.load(fBytes);
        const d2 = await PDFDocument.load(iBytes);
        const [p1] = await fullPdf.copyPages(d1, [0]);
        const [p2] = await fullPdf.copyPages(d2, [0]);
        fullPdf.addPage(p1);
        fullPdf.addPage(p2);
        
        res.contentType("application/pdf");
        res.send(Buffer.from(await fullPdf.save()));
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
    }
});

app.post('/api/generate-excel', async (req, res) => {
    const { studentId } = req.body;
    try {
        const userData = await getStudentData(studentId);
        const grades = await getGrades(studentId);
        const attendance = await getAttendance(studentId);
        const allDates = await getSchoolDays();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(SAMPLE_EXCEL_PATH);
        const frontSheet = workbook.getWorksheet('K-12 Front');
        if (userData && frontSheet) {
            frontSheet.getCell('Q12').value = userData.name;
            frontSheet.getCell('Q13').value = calculateAge(userData.birthDate);
            frontSheet.getCell('U13').value = userData.sex;
            frontSheet.getCell('X13').value = userData.lrn;
            frontSheet.getCell('R14').value = (userData.gradeLevel || '').replace('Grade ', '').toUpperCase();
            frontSheet.getCell('V14').value = (userData.section || '').toUpperCase();
            frontSheet.getCell('V15').value = userData.schoolYear || '2025-2026';

            const months = ['June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
            months.forEach((month, idx) => {
                const mDates = allDates.filter(d => new Date(d).toLocaleString('default', { month: 'long' }) === month);
                const monthAtt = attendance.filter(a => new Date(a.date).toLocaleString('default', { month: 'long' }) === month);
                const col = String.fromCharCode(66 + idx);
                frontSheet.getCell(`${col}12`).value = monthAtt.filter(a => a.status === 'present').length;
                frontSheet.getCell(`${col}15`).value = monthAtt.filter(a => a.status === 'absent' || a.status === 'excused').length;
                frontSheet.getCell(`${col}11`).value = mDates.length;
            });
        }
        const insideSheet = workbook.getWorksheet('Grade 5 Inside');
        if (grades && insideSheet) {
            const mapping = { 'filipino': 5, 'english': 7, 'mathematics': 9, 'science': 11, 'good manners': 13, 'esp': 13, 'araling panlipunan': 16, 'epp': 19, 'tle': 19, 'mapeh': 22 };
            grades.forEach(grade => {
                const sub = grade.subject.toLowerCase();
                let row = null;
                for (const [key, val] of Object.entries(mapping)) { if (sub.includes(key)) { row = val; break; } }
                if (row) {
                    insideSheet.getCell(`B${row}`).value = grade.q1 || '';
                    insideSheet.getCell(`C${row}`).value = grade.q2 || '';
                    insideSheet.getCell(`D${row}`).value = grade.q3 || '';
                    insideSheet.getCell(`E${row}`).value = grade.q4 || '';
                    insideSheet.getCell(`F${row}`).value = grade.finalAverage || '';
                    insideSheet.getCell(`G${row}`).value = grade.remarks || (grade.finalAverage >= 75 ? 'Passed' : 'Failed');
                }
            });
            if (userData.gwa) insideSheet.getCell('F27').value = userData.gwa;
        }
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="SF9_${userData.name.replace(/\s+/g, '_')}.xlsx"`);
        res.send(await workbook.xlsx.writeBuffer());
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

app.listen(PORT, '0.0.0.0', () => { console.log(`System2 Backend running on port ${PORT}`); });
