#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateAllIcons() {
  try {
    const svgFile = fs.readFileSync('./assets/Logo.svg');

    // Create logo PNG (base image)
    await sharp(svgFile)
      .resize(196, 196, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile('./assets/logo.png');
    console.log('✓ logo.png (196x196)');

    // Create app icon (192x192)
    await sharp(svgFile)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile('./assets/icon.png');
    console.log('✓ icon.png (192x192)');

    // Create adaptive icon (108x108)
    await sharp(svgFile)
      .resize(108, 108, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile('./assets/adaptive-icon.png');
    console.log('✓ adaptive-icon.png (108x108)');

    // Create favicon
    await sharp(svgFile)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile('./assets/favicon.png');
    console.log('✓ favicon.png (192x192)');

    // Copy favicon to public folder
    fs.copyFileSync('./assets/favicon.png', './public/favicon.png');
    console.log('✓ public/favicon.png');

    // Create splash screen with new logo
    const splashSvg = `
      <svg width="540" height="720" xmlns="http://www.w3.org/2000/svg">
        <rect width="540" height="720" fill="#0F172A"/>
        <g transform="translate(172, 242)">
          <rect width="196" height="196" fill="#1D1D1D" rx="20"/>
          <path d="M97.7686 43L112.495 57.2425L57.2695 110.652V82.167L97.7686 43Z" fill="#FE7A1B"/>
          <path d="M65.1663 118.451L97.9986 149.999L138.728 110.864V82.4008L112.809 57.4961L57.2695 110.864L57.2808 110.874L112.809 57.4961V98.411L87.8163 122.426V96.9854L65.1663 118.451Z" fill="#FE7A1B"/>
        </g>
        <text x="270" y="580" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="700" fill="#FFFFFF" text-anchor="middle">Fitspire</text>
      </svg>
    `;

    await sharp(Buffer.from(splashSvg))
      .png()
      .toFile('./assets/splash.png');
    console.log('✓ splash.png (540x720)');

    console.log('\n✅ All icons regenerated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateAllIcons();
