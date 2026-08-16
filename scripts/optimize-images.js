const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, '..', 'public', 'img');

const webpImages = [
  { name: 'homepagebanner.png', out: 'homepagebanner.webp', width: 800, quality: 80 },
  { name: '1.png', out: '1.webp', width: 800, quality: 80 },
  { name: '2.png', out: '2.webp', width: 800, quality: 80 },
  { name: '3.png', out: '3.webp', width: 800, quality: 80 },
  { name: '4.png', out: '4.webp', width: 800, quality: 80 },
  { name: 'instant-personal-loan-approval.png', out: 'instant-personal-loan-approval.webp', width: 800, quality: 80 },
  { name: 'low-interest-personal-loan-rates.png', out: 'low-interest-personal-loan-rates.webp', width: 800, quality: 80 },
  { name: 'paperless-digital-loan-disbursal.png', out: 'paperless-digital-loan-disbursal.webp', width: 800, quality: 80 },
  { name: 'personal-loan-eligibility-documents.png', out: 'personal-loan-eligibility-documents.webp', width: 800, quality: 80 },
  { name: 'chatbot-avatar.png', out: 'chatbot-avatar.webp', width: 128, quality: 90 }
];

async function run() {
  console.log('Starting image optimization...');
  
  // 1. Optimize WebP images
  for (const img of webpImages) {
    const srcPath = path.join(imgDir, img.name);
    const destPath = path.join(imgDir, img.out);
    
    if (fs.existsSync(srcPath)) {
      try {
        const initialSize = fs.statSync(srcPath).size;
        
        await sharp(srcPath)
          .resize({ width: img.width, withoutEnlargement: true })
          .webp({ quality: img.quality })
          .toFile(destPath);
          
        const finalSize = fs.statSync(destPath).size;
        const savingsPercent = ((initialSize - finalSize) / initialSize * 100).toFixed(1);
        
        console.log(`Optimized ${img.name} -> ${img.out}`);
        console.log(`  Size: ${(initialSize / 1024).toFixed(1)} KB -> ${(finalSize / 1024).toFixed(1)} KB (${savingsPercent}% saved)`);
      } catch (err) {
        console.error(`Failed to optimize ${img.name}:`, err);
      }
    }
  }

  // 2. Optimize logo.jpeg in-place safely on Windows
  const logoSrc = path.join(imgDir, 'logo.jpeg');
  const logoBackup = path.join(imgDir, 'logo_backup.jpeg');
  if (fs.existsSync(logoSrc)) {
    try {
      const initialSize = fs.statSync(logoSrc).size;
      
      // If the file is already small (e.g. optimized previously), skip it to avoid double optimization
      if (initialSize < 10000) {
        console.log('logo.jpeg is already optimized. Skipping.');
        return;
      }
      
      // Copy to backup, read from backup, and write directly back to logoSrc
      fs.copyFileSync(logoSrc, logoBackup);
      
      await sharp(logoBackup)
        .resize({ width: 128, withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(logoSrc);
        
      fs.unlinkSync(logoBackup);
      const finalSize = fs.statSync(logoSrc).size;
      const savingsPercent = ((initialSize - finalSize) / initialSize * 100).toFixed(1);
      
      console.log(`Optimized logo.jpeg (In-Place)`);
      console.log(`  Size: ${(initialSize / 1024).toFixed(1)} KB -> ${(finalSize / 1024).toFixed(1)} KB (${savingsPercent}% saved)`);
    } catch (err) {
      console.error('Failed to optimize logo.jpeg in-place:', err);
      if (fs.existsSync(logoBackup)) {
        fs.unlinkSync(logoBackup);
      }
    }
  }

  console.log('Image optimization complete.');
}

run();
