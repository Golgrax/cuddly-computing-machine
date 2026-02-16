const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const cheerio = require('cheerio');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());
// Serve resources (images, etc.)
app.use('/resources', express.static(path.join(__dirname, 'files/resources')));

const SAMPLE_EXCEL_PATH = path.join(__dirname, '../../samples/SF 9 REPORT CARD AUTOMATED (SY 2025-2026) GRADE 5(1)(1).xlsx');

console.log(`[S2-Backend] Checking for sample Excel at: ${SAMPLE_EXCEL_PATH}`);
if (!fs.existsSync(SAMPLE_EXCEL_PATH)) {
  console.error(`❌ [S2-Backend] ERROR: Sample Excel file not found at ${SAMPLE_EXCEL_PATH}`);
  // We don't exit, but we warn loudly
} else {
  console.log(`✅ [S2-Backend] Sample Excel file found.`);
}

// Helper to process page for HTML Preview
async function getPreviewHtml(fileName, userData) {
  const filePath = path.join(__dirname, 'files', fileName);
  const cssPath = path.join(__dirname, 'files/resources/sheet.css');
  
  let html = await fs.readFile(filePath, 'utf8');
  let css = '';
  try { css = await fs.readFile(cssPath, 'utf8'); } catch(e) {}

  const $ = cheerio.load(html);

  // 1. Inject Data
  const MAP = {
    'Carlo Dela Cruz': userData.name,
    '123456789012': userData.lrn,
    '10': userData.age,
    'MALE': userData.sex,
    'FIVE': userData.grade,
    'RIZAL': userData.section,
    '2025-2026': userData.schoolYear || '2025-2026'
  };

  $('td, span, div').each((i, el) => {
    let text = $(el).text().trim();
    if (MAP[text]) $(el).text(MAP[text]);
  });

  // 2. Fix Images (Use absolute path /resources/...)
  $('img').each((i, el) => {
    let src = $(el).attr('src');
    if (src && !src.startsWith('/') && !src.startsWith('data:')) {
       // Assuming src is something like "resources/image.jpg" or just "image.jpg" inside resources in the original HTML structure logic
       // The original file structure seems to have resources folder.
       // We just prepend /resources/ + filename
       $(el).attr('src', '/resources/' + path.basename(src));
    }
  });

  // 3. Embed CSS (Safe for srcdoc)
  $('link[rel="stylesheet"]').remove();
  $('head').append(`<style>${css}</style>`);
  
  // 4. Ensure white background and hide sheet headers
  $('head').append(`
    <style>
      body { background: white; margin: 0; padding: 0; }
      .row-headers-background, .column-headers-background, thead { display: none !important; }
      .row-header-wrapper { display: none !important; }
    </style>
  `);

  return $.html();
}

app.post('/api/preview-sf9-page/:page', async (req, res) => {
  const { userData } = req.body;
  const page = req.params.page;
  try {
    const fileName = page === '1' ? 'K-12 Front.html' : 'Grade 5 Inside.html';
    const html = await getPreviewHtml(fileName, userData || {});
    res.send(html);
  } catch (err) {
    console.error("Preview error:", err);
    res.status(500).send("Error generating preview");
  }
});

// Endpoint to generate and download the full Excel file
app.post('/api/generate-excel', async (req, res) => {
  const { userData, role } = req.body;
  
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(SAMPLE_EXCEL_PATH);
    
    // 1. Fill Student Data in "K-12 Front"
    const frontSheet = workbook.getWorksheet('K-12 Front');
    if (userData && frontSheet) {
      // Mapping based on find_cells.js
      if (userData.name) frontSheet.getCell('Q12').value = userData.name;
      if (userData.age) frontSheet.getCell('Q13').value = userData.age;
      if (userData.sex) frontSheet.getCell('U13').value = userData.sex;
      if (userData.lrn) frontSheet.getCell('X13').value = userData.lrn;
      if (userData.grade) frontSheet.getCell('R14').value = userData.grade;
      if (userData.section) frontSheet.getCell('V14').value = userData.section;
    }

    // 2. Role-based sheet removal
    if (role === 'student') {
      const sheetsToKeep = ['K-12 Front', 'Grade 5 Inside'];
      // We must iterate backwards when removing by index, or use names
      workbook.worksheets.forEach(sheet => {
        if (!sheetsToKeep.includes(sheet.name)) {
          workbook.removeWorksheet(sheet.id);
        }
      });
    }

    // 3. Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // 4. Send File
    const fileName = `SF9_${userData?.name?.replace(/\s+/g, '_') || 'Report'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
    
  } catch (err) {
    console.error("Error generating Excel:", err);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`System2 Local-Ready Backend running on port ${PORT}`);
});