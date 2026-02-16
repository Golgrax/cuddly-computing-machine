const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { PDFDocument, rgb, StandardFonts, PDFName, PDFRawStream } = require('pdf-lib');
const ExcelJS = require('exceljs');
const cheerio = require('cheerio');
const pako = require('pako');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// ... (existing constants)

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
            // Attempt raw decompression
            // pdf-lib raw streams are usually FlateDecode
            const buffer = stream.contents;
            decoded = pako.inflate(buffer);
        } catch (e) {
            console.warn("Failed to decompress stream, skipping cleanup:", e.message);
            continue;
        }

        let text = new TextDecoder().decode(decoded);
        let modified = false;

        stringsToRemove.forEach(str => {
            // PDF text is usually (Text)Tj
            // We escape special regex chars in str just in case
            const escapedStr = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const patterns = [
                `\\(${escapedStr}\\)Tj`,      // Standard
                `\\(${escapedStr}\\) Tj`,     // Standard with space
                `\\(${escapedStr}\\) TJ`,     // Array based (less common for single words)
                `\\(${escapedStr}\\)'`,       // New line text
            ];
            
            patterns.forEach(p => {
                const regex = new RegExp(p, 'g');
                if (regex.test(text)) {
                    text = text.replace(regex, '()Tj'); // Replace with empty text command
                    modified = true;
                }
            });
        });

        if (modified) {
            // Re-compress and update stream
            const recompressed = pako.deflate(new TextEncoder().encode(text));
            // We need to update the stream content in place or replace it.
            // In pdf-lib, modifying the buffer directly on the stream object usually works 
            // if we haven't flushed it yet.
            stream.contents = recompressed;
            // Ensure Filter is FlateDecode
            stream.dict.set(PDFName.of('Filter'), PDFName.of('FlateDecode'));
            // Update length
            stream.dict.set(PDFName.of('Length'), page.doc.context.obj(recompressed.length));
        }
    }
}

// ... (rest of imports/setup)

const FILES_DIR = path.join(__dirname, 'files');
const SAMPLE_EXCEL_PATH = path.join(__dirname, '../../samples/SF 9 REPORT CARD AUTOMATED (SY 2025-2026) GRADE 5(1)(1).xlsx');
const SAMPLE_K12_PDF = path.join(__dirname, '../../sample/k12.pdf');
const SAMPLE_INSIDE_PDF = path.join(__dirname, '../../sample/inside.pdf');

// Serve static resources
app.use('/resources', express.static(path.join(FILES_DIR, 'resources')));

// --- HTML PROCESSING ---
async function processHtmlForClient(htmlPath, userData, grades = [], attendance = []) {
    const html = await fs.readFile(htmlPath, 'utf8');
    const $ = cheerio.load(html);
    $('link[href="resources/sheet.css"]').attr('href', '/system2-api/resources/sheet.css');
    $('img').each(function() {
        const src = $(this).attr('src');
        if (src && src.startsWith('resources/')) $(this).attr('src', `/system2-api/resources/${src.replace('resources/', '')}`);
    });
    $('td').each(function() {
        const t = $(this).text().trim();
        if (t === 'Carlo Dela Cruz') $(this).text(userData.name || '');
        if (t === '10' && $(this).prev().text().includes('Age:')) $(this).text(userData.age || '');
        if (t === 'MALE') $(this).text(userData.sex || 'MALE');
        if (t === '123456789012') $(this).text(userData.lrn || '');
        if (t === 'FIVE') $(this).text(userData.grade || '');
        if (t === 'RIZAL') $(this).text(userData.section || '');
        if (t === '2025-2026') $(this).text(userData.schoolYear || '');
        if (t === 'JUAN DELA CRUZ') $(this).text(userData.teacherName || userData.parentName || 'JUAN DELA CRUZ');
    });
    const months = ['June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
    const pRow = $('tr:contains("No. of days present")');
    const aRow = $('tr:contains("No. of days absent")');
    if (pRow.length) {
        let tp = 0; let ta = 0;
        months.forEach((m, idx) => {
            const att = (attendance || []).filter(a => { const d = new Date(a.date); return d.toLocaleString('default', { month: 'long' }) === m; });
            const p = att.filter(a => a.status === 'present').length;
            const a = att.filter(a => a.status === 'absent' || a.status === 'excused').length;
            pRow.find('td').eq(idx + 1).text(p.toString());
            aRow.find('td').eq(idx + 1).text(a.toString());
            tp += p; ta += a;
        });
        pRow.find('td').last().text(tp.toString());
        aRow.find('td').last().text(ta.toString());
    }
    const subj = { 'Filipino': 'Filipino', 'English': 'English', 'Mathematics': 'Mathematics', 'Science': 'Science', 'Good Manners': 'Good Manners', 'Araling Panlipunan': 'Araling Panlipunan', 'EPP': 'Edukasyong Pantahanan', 'MAPEH': 'MAPEH' };
    Object.entries(subj).forEach(([k, l]) => {
        const r = $(`tr:contains("${l}")`);
        const g = (grades || []).find(gr => gr.subject.toLowerCase().includes(k.toLowerCase()));
        if (r.length && g) { [1,2,3,4].forEach(i => r.find('td').eq(i).text(g[`q${i}`] || '')); r.find('td').eq(5).text(g.finalAverage || ''); r.find('td').eq(6).text(g.remarks || ''); }
    });
    $('tr:contains("General Average")').find('td').each(function() { if ($(this).text().trim() === '82') $(this).text(userData.gwa || ''); });
    const cssPath = path.join(FILES_DIR, 'resources/sheet.css');
    if (fs.existsSync(cssPath)) { const css = await fs.readFile(cssPath, 'utf8'); $('head').append(`<style>${css}</style>`); }
    return $.html();
}

app.post('/api/process-html/:page', async (req, res) => {
    try {
        const page = req.params.page;
        const htmlPath = path.join(FILES_DIR, page === '1' ? 'K-12 Front.html' : 'Grade 5 Inside.html');
        const html = await processHtmlForClient(htmlPath, req.body.userData, req.body.grades, req.body.attendance);
        res.send(html);
    } catch (e) { res.status(500).send(e.message); }
});

// --- PDF PROCESSING ---
const PAGE_UNIT_WIDTH = 52.625;
const PAGE_UNIT_HEIGHT = 37.188;

async function fillPdf(pdfPath, userData, grades = [], attendance = []) {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const isFront = pdfPath.includes('k12.pdf');
    const isInside = pdfPath.includes('inside.pdf');

    // Remove text instead of blanking
    const toRemove = [];
    if (isFront) {
        toRemove.push(
            'Carlo Dela Cruz', '10', 'MALE', '123456789012', 
            'FIVE', 'RIZAL', '2025-2026', 
            '9', '8', '10', '90', // Attendance place holders
            '1', '2', '0' // Absent placeholders
        );
    }
    if (isInside) {
        toRemove.push(
            '77', '78', '84', '81', '80', '79', '85', '87', '83', '86', '88', '82', // Grades
            'Passed'
        );
    }
    
    await cleanPageContent(page, toRemove);

    const replace = (px, py, text, size=9) => {
        const x = px * (width / PAGE_UNIT_WIDTH);
        const y = height - (py * (height / PAGE_UNIT_HEIGHT));
        // No blanking needed now!
        if (text !== undefined && text !== null) {
            page.drawText(text.toString(), { x, y, size, font });
        }
    };

    if (isFront) {
        replace(34.85, 11.24, userData.name, 10);
        replace(29.73, 12.02, userData.age);
        replace(36.33, 12.02, userData.sex);
        replace(40.82, 12.02, userData.lrn);
        replace(31.04, 12.87, userData.grade);
        replace(40.52, 12.87, userData.section);
        replace(32.52, 13.71, userData.schoolYear);

        const months = ['June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
        let tp = 0; let ta = 0;
        months.forEach((m, i) => {
            const att = (attendance || []).filter(a => { const d = new Date(a.date); return d.toLocaleString('default', { month: 'long' }) === m; });
            const p = att.filter(a => a.status === 'present').length;
            const a = att.filter(a => a.status === 'absent' || a.status === 'excused').length;
            const x = 5.01 + (i * 1.101);
            replace(x, 11.94, p > 0 ? p : '0', 8);
            replace(x, 14.39, a > 0 ? a : '0', 8);
            tp += p; ta += a;
        });
        replace(18.05, 11.93, tp, 9);
        replace(18.05, 14.39, ta, 9);
    }

    if (isInside) {
        const subj = { 
            'Filipino': 5.09, 
            'English': 6.57, 
            'Mathematics': 8.04, 
            'Science': 9.52, 
            'Good Manners': 11.60, 
            'Araling Panlipunan': 13.98, 
            'EPP': 16.80, 
            'MAPEH': 19.02,
            'Music & Arts': 20.13,
            'PE & Health': 21.09
        };
        Object.entries(subj).forEach(([k, y]) => {
            const g = (grades || []).find(gr => gr.subject.toLowerCase().includes(k.toLowerCase()));
            if (g) {
                const x_offset = (k === 'Music & Arts' || k === 'PE & Health') ? 0.61 : 0;
                replace(7.72 + x_offset, y, g.q1, 15); 
                replace(9.76 + x_offset, y, g.q2, 15); 
                replace(11.80 + x_offset, y, g.q3, 15); 
                replace(13.84 + x_offset, y, g.q4, 15);
                const fa_x = (k === 'Music & Arts' || k === 'PE & Health') ? 17.22 : 16.31;
                replace(fa_x, y, g.finalAverage, 15); 
                replace(18.65, y, g.remarks, 30, 8);
            }
        });
        replace(16.27, 23.83, userData.gwa, 30, 10);
    }
    return await pdfDoc.save();
}

app.post('/api/generate-pdf', async (req, res) => {
    try {
        const fullPdf = await PDFDocument.create();
        const f = await fillPdf(SAMPLE_K12_PDF, req.body.userData, req.body.grades, req.body.attendance);
        const i = await fillPdf(SAMPLE_INSIDE_PDF, req.body.userData, req.body.grades, req.body.attendance);
        const d1 = await PDFDocument.load(f); const d2 = await PDFDocument.load(i);
        const [p1] = await fullPdf.copyPages(d1, [0]); const [p2] = await fullPdf.copyPages(d2, [0]);
        fullPdf.addPage(p1); fullPdf.addPage(p2);
        res.contentType("application/pdf");
        res.send(Buffer.from(await fullPdf.save()));
    } catch (e) { 
        console.error(e);
        res.status(500).send(e.message); 
    }
});

app.post('/api/generate-excel', async (req, res) => {
  const { userData, grades, attendance, role } = req.body;
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(SAMPLE_EXCEL_PATH);
    const frontSheet = workbook.getWorksheet('K-12 Front');
    if (userData && frontSheet) {
      if (userData.name) frontSheet.getCell('Q12').value = userData.name;
      if (userData.age) frontSheet.getCell('Q13').value = userData.age;
      if (userData.sex) frontSheet.getCell('U13').value = userData.sex;
      if (userData.lrn) frontSheet.getCell('X13').value = userData.lrn;
      if (userData.grade) frontSheet.getCell('R14').value = userData.grade;
      if (userData.section) frontSheet.getCell('V14').value = userData.section;
      if (userData.schoolYear) frontSheet.getCell('V15').value = userData.schoolYear;
      if (attendance) {
        const months = ['June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
        months.forEach((month, idx) => {
          const monthAtt = attendance.filter(a => { const d = new Date(a.date); return d.toLocaleString('default', { month: 'long' }) === month; });
          const p = monthAtt.filter(a => a.status === 'present').length;
          const a = monthAtt.filter(a => a.status === 'absent' || a.status === 'excused').length;
          const col = String.fromCharCode(66 + idx);
          frontSheet.getCell(`${col}12`).value = p;
          frontSheet.getCell(`${col}15`).value = a;
        });
      }
    }
    const insideSheet = workbook.getWorksheet('Grade 5 Inside');
    if (grades && insideSheet) {
      const mapping = { 'Filipino': 5, 'English': 7, 'Mathematics': 9, 'Science': 11, 'Good Manners': 13, 'Araling Panlipunan': 16, 'EPP': 19, 'MAPEH': 22 };
      Object.entries(mapping).forEach(([sub, row]) => {
        const grade = grades.find(g => g.subject.toLowerCase().includes(sub.toLowerCase()));
        if (grade) {
          insideSheet.getCell(`B${row}`).value = grade.q1 || '';
          insideSheet.getCell(`C${row}`).value = grade.q2 || '';
          insideSheet.getCell(`D${row}`).value = grade.q3 || '';
          insideSheet.getCell(`E${row}`).value = grade.q4 || '';
          insideSheet.getCell(`F${row}`).value = grade.finalAverage || '';
          insideSheet.getCell(`G${row}`).value = grade.remarks || '';
        }
      });
      if (userData.gwa) {
        insideSheet.getCell('F27').value = userData.gwa;
      }
    }
    if (role === 'student') {
      const sheetsToKeep = ['K-12 Front', 'Grade 5 Inside'];
      workbook.worksheets.forEach(sheet => { if (!sheetsToKeep.includes(sheet.name)) workbook.removeWorksheet(sheet.id); });
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="SF9.xlsx"');
    res.send(await workbook.xlsx.writeBuffer());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => { console.log(`System2 Backend running on port ${PORT}`); });
