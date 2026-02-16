const { PDFDocument, PDFRawStream, decodePDFRawStream } = require('pdf-lib');
const fs = require('fs-extra');

async function removeText(pdfPath, outputText) {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0];
    
    const { Contents } = page.node.normalizedEntries();
    if (!Contents) return;

    const stream = Contents instanceof PDFRawStream ? Contents : Contents[0]; // Simplified
    
    // Decompress
    const buffer = decodePDFRawStream(stream).decode();
    let text = "";
    for(let j=0; j<buffer.length; j++) text += String.fromCharCode(buffer[j]);

    // PATTERNS TO REMOVE
    // PDF text is usually (Text) Tj or (Text) &#39;
    // We will replace with ( ) Tj to keep spacing or just remove.
    // CAUTION: Encoding! Parentheses in text might be escaped.
    
    const replacements = [
        'Carlo Dela Cruz',
        'RIZAL',
        '123456789012',
        'MALE',
        'FIVE',
        '2025-2026',
        '10' // Be careful with numbers
    ];

    let modified = text;
    replacements.forEach(str => {
        // Simple regex for standard parens text. 
        // Might need adjustment if text is hex encoded <FEFF...>
        const regex = new RegExp(`\(${str}\)`, 'g');
        modified = modified.replace(regex, '()'); // Replace with empty string operator
    });

    if (text === modified) {
        console.log("No text replaced. Encoding might be different.");
        console.log("Snippet:", text.substring(0, 500));
    } else {
        console.log("Text replaced successfully!");
    }

    // Create new stream
    // pdf-lib doesn't easily let us replace the stream content of an existing page node 
    // without some hacking or creating a new page.
    // Easier: Draw white rectangles? User hates them.
    // Harder: Replace the stream data.
    
    // We can't re-compress easily without pako, but pdf-lib can handle uncompressed.
    
    // Hack: We will use the modified text to create a fresh PDF? No, we lose formatting.
    
    // We must update the stream in place.
    // pdf-lib's PDFRawStream is immutable-ish.
    
    // Alternative: We can use `page.node.set(PDFName.of('Contents'), ...)`
    // But we need to wrap our string back into a stream.
    
    // Actually, simple string replacement in raw buffer is risky if length changes significantly 
    // and we don't update lengths. But pdf-lib handles saving.
    
    // Let's try to just write the modified stream back.
    const newStream = pdfDoc.context.flateStream(modified);
    
    // Replace the contents reference
    // This is the tricky part with high-level API.
    
    // Let's try a different approach:
    // 1. Get the operators.
    // 2. Filter them.
    // 3. pdf-lib has a `getOperators()`? No.
    
    console.log("Modification logic prepared but saving correctly requires stream replacement.");
}

removeText('../../sample/k12.pdf');
