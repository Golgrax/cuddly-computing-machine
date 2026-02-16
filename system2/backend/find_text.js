const PDFParser = require("pdf2json");
const fs = require('fs');

const pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
pdfParser.on("pdfParser_dataReady", pdfData => {
    // console.log(JSON.stringify(pdfData));
    pdfData.Pages.forEach(page => {
        page.Texts.forEach(text => {
            const str = decodeURIComponent(text.R[0].T);
            console.log(`Text: "${str}" at x: ${text.x}, y: ${text.y}`);
        });
    });
});

pdfParser.loadPDF("../../sample/k12.pdf");
