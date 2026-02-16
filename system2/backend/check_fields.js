const { PDFDocument } = require('pdf-lib');
const fs = require('fs-extra');

async function checkFields() {
    const pdfBytes = await fs.readFile('../../sample/k12.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    console.log(`Found ${fields.length} fields.`);
    fields.forEach(field => {
        const name = field.getName();
        const type = field.constructor.name;
        console.log(`${name} (${type})`);
    });
}

checkFields().catch(console.error);
