import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5002;

// Helper to escape XML special characters
const escapeXml = (unsafe) => {
    if (!unsafe) return '';
    return unsafe.toString().replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Route to generate ID Card as SVG
app.post('/api/generate-id', async (req, res) => {
    try {
        const { user, side = 'front' } = req.body;
        if (!user) return res.status(400).json({ error: 'User data required' });

        const width = 638;
        const height = 1013;
        
        // Load background image and convert to Base64
        const bgPath = path.join(__dirname, 'public', 'id', `${side}.png`);
        let bgBase64 = '';
        if (fs.existsSync(bgPath)) {
            const bgBuffer = fs.readFileSync(bgPath);
            bgBase64 = `data:image/png;base64,${bgBuffer.toString('base64')}`;
        }

        if (side === 'front') {
            // Generate QR Code as High-Res PNG Base64
            const qrDataUrl = await QRCode.toDataURL(user.id || 'N/A', { 
                width: 400,
                margin: 1, 
                color: { dark: '#000000', light: '#ffffff' } 
            });

            let pfpBase64 = '';
            if (user.avatar && user.avatar.startsWith('/uploads/')) {
                const avatarPath = path.join(__dirname, '..', 'system', user.avatar);
                if (fs.existsSync(avatarPath)) {
                    const avatarBuffer = fs.readFileSync(avatarPath);
                    const ext = path.extname(avatarPath).toLowerCase().replace('.', '');
                    pfpBase64 = `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${avatarBuffer.toString('base64')}`;
                }
            }
            
            if (!pfpBase64) {
                pfpBase64 = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'S')}&background=EBF4FF&color=7F9CF5&size=512`;
            }

            const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Background Image -->
    <image width="${width}" height="${height}" href="${escapeXml(bgBase64)}" />
    
    <!-- Student Photo -->
    <rect x="75" y="240" width="265" height="265" fill="white" />
    <image x="80" y="245" width="255" height="255" href="${escapeXml(pfpBase64)}" preserveAspectRatio="xMidYMid slice" />
    <rect x="75" y="240" width="265" height="265" fill="none" stroke="black" stroke-width="2" />

    <!-- QR Code -->
    <image x="365" y="240" width="200" height="200" href="${escapeXml(qrDataUrl)}" />
    
    <!-- LRN Background -->
    <rect x="365" y="440" width="200" height="30" fill="white" />
    <text x="465" y="465" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#000000" text-anchor="middle">${escapeXml(user.lrn || '123456789012')}</text>

    <!-- Learner's Name -->
    <rect x="90" y="525" width="455" height="50" fill="white" />
    <text x="95" y="565" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#000000" text-anchor="start">${escapeXml((user.name || 'Student Name').toUpperCase())}</text>
    
    <!-- Grade & Section -->
    <rect x="90" y="625" width="455" height="50" fill="white" />
    <text x="95" y="665" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#000000" text-anchor="start">${escapeXml((user.gradeLevel || 'V').toUpperCase())} - ${escapeXml((user.section || 'RIZAL').toUpperCase())}</text>
    
    <!-- Adviser -->
    <rect x="90" y="725" width="455" height="50" fill="white" />
    <text x="95" y="765" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#000000" text-anchor="start">${escapeXml((user.adviser || 'Jane De Castro').toUpperCase())}</text>
    
    <!-- School Year -->
    <rect x="200" y="895" width="240" height="95" fill="#1e3a8a" rx="10" /> 
    <text x="${width/2}" y="930" font-family="Arial, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle" style="letter-spacing: 2px;">SCHOOL YEAR</text>
    <text x="${width/2}" y="975" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#ffffff" text-anchor="middle">${escapeXml(user.schoolYear || '2025-2026')}</text>
</svg>`;
            res.setHeader('Content-Type', 'image/svg+xml');
            return res.send(svg.trim());
        } else {
            // Back Side
            const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Background Image -->
    <image width="${width}" height="${height}" href="${escapeXml(bgBase64)}" />
    
    <!-- Parent/Guardian Name -->
    <rect x="90" y="335.5" width="455" height="50" fill="white" />
    <text x="95" y="375.5" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#000000" text-anchor="start">${escapeXml((user.guardianName || 'Sophia L. Dela Cruz').toUpperCase())}</text>
    
    <!-- Contact Number -->
    <rect x="90" y="435" width="455" height="50" fill="white" />
    <text x="95" y="475" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#000000" text-anchor="start">${escapeXml(user.guardianPhone || '09123456789')}</text>
    
    <!-- Grade & Section (Back) -->
    <rect x="90" y="535" width="455" height="50" fill="white" />
    <text x="95" y="575" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#000000" text-anchor="start">${escapeXml((user.gradeLevel || 'V').toUpperCase())} - ${escapeXml((user.section || 'RIZAL').toUpperCase())}</text>
</svg>`;
            res.setHeader('Content-Type', 'image/svg+xml');
            return res.send(svg.trim());
        }

    } catch (error) {
        console.error('ID Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate ID' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`System 1 (SVG ID Generator) running on port ${PORT}`);
});