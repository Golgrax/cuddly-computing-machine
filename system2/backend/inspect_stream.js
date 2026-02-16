const { PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } = require('pdf-lib');
const fs = require('fs-extra');
const pako = require('pako'); // You might need to install pako if pdf-lib doesn't expose its inflator easily, but usually pdf-lib handles it. 
// Actually, pdf-lib objects usually allow getting data.

async function inspect() {
    const pdfBytes = await fs.readFile('../../sample/k12.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    
    const pageNode = page.node;
    console.log("Page node keys:", pageNode.dict.keys().map(k => k.toString()));
    
    let contents = pageNode.Contents();
    console.log("Contents type:", contents ? contents.constructor.name : "null");

    if (!contents) return;

    if (!Array.isArray(contents)) contents = [contents];

    for (let i = 0; i < contents.length; i++) {
        const refOrStream = contents[i];
        const stream = pdfDoc.context.lookup(refOrStream);
        
        console.log(`Stream ${i} type:`, stream.constructor.name);

        if (stream instanceof PDFRawStream) {
            console.log("Stream contents:", stream.contents);
            const buffer = stream.getData(); // This might get the raw compressed data
            console.log("Buffer length:", buffer.length);
            
            // Try to decompress manually if pdf-lib isn't doing it
            const decompressed = decodePDFRawStream(stream).decode();
            let text = "";
            for(let j=0; j<decompressed.length; j++) text += String.fromCharCode(decompressed[j]);
            console.log(`--- Stream ${i} Decompressed ---`);
            console.log(text.substring(0, 2000));
        }
    }
}

inspect().catch(console.error);
