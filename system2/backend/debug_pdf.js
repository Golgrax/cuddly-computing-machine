const html_to_pdf = require('html-pdf-node');
const path = require('path');

const options = { format: 'A4', printBackground: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
const file = { content: "<h1>Test PDF</h1>" };

console.log("Starting PDF generation test...");
html_to_pdf.generatePdf(file, options).then(pdfBuffer => {
    console.log("Success! PDF generated, size:", pdfBuffer.length);
    process.exit(0);
}).catch(err => {
    console.error("Failed!", err);
    process.exit(1);
});
