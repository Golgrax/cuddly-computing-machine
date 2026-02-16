const ExcelJS = require('exceljs');
const path = require('path');

const filePath = path.join(__dirname, '../../samples/SF 9 REPORT CARD AUTOMATED (SY 2025-2026) GRADE 5(1)(1).xlsx');

async function findCells() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  console.log('Sheets:', workbook.worksheets.map(w => w.name));

  workbook.worksheets.forEach(worksheet => {
    console.log(`\n--- Searching in sheet: ${worksheet.name} ---`);
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        const val = cell.value ? cell.value.toString() : '';
        if (typeof val === 'string' && (val.includes('Average') || val.includes('Name:') || val.includes('Age:') || val.includes('Sex:') || val.includes('Grade:') || val.includes('Section:') || val.includes('LRN:'))) {
           // Check neighboring cells for context if needed, but for now just print location
           console.log(`Found "${val}" at ${cell.address}`);
        }
      });
    });
  });
}

findCells().catch(console.error);