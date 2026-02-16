const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');

async function createGrid() {
  const pdfBytes = await fs.readFile('../../sample/k12.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let x = 0; x < width; x += 50) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: 1,
      color: rgb(1, 0, 0),
      opacity: 0.3,
    });
    page.drawText(x.toString(), { x: x + 2, y: 10, size: 8, font, color: rgb(1, 0, 0) });
  }

  for (let y = 0; y < height; y += 50) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: 1,
      color: rgb(0, 0, 1),
      opacity: 0.3,
    });
    page.drawText(y.toString(), { x: 10, y: y + 2, size: 8, font, color: rgb(0, 0, 1) });
  }

  const outBytes = await pdfDoc.save();
  await fs.writeFile('debug_grid.pdf', outBytes);
  console.log('Grid PDF created: debug_grid.pdf');
}

createGrid().catch(console.error);
