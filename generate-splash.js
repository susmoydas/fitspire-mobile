#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateSplashScreen() {
  try {
    // Create SVG with background and centered logo
    const splashSvg = `
      <svg width="540" height="720" xmlns="http://www.w3.org/2000/svg">
        <!-- Dark background -->
        <rect width="540" height="720" fill="#0F172A"/>
        <!-- Centered logo from image -->
        <image x="172" y="242" width="196" height="196" href="data:image/png;base64,${fs.readFileSync('./assets/logo.png').toString('base64')}"/>
        <!-- App name -->
        <text x="270" y="580" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="700" fill="#FFFFFF" text-anchor="middle">Fitspire</text>
      </svg>
    `;

    // Convert SVG to PNG
    await sharp(Buffer.from(splashSvg))
      .png()
      .toFile('./assets/splash.png');

    console.log('✓ Splash screen created: assets/splash.png');
  } catch (error) {
    console.error('Error generating splash screen:', error);
    process.exit(1);
  }
}

generateSplashScreen();
