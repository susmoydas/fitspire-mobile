# Fitspire Brand Icons & Splash Screen Setup

## Assets Created ✓

### Core Brand Files
- **Logo Files**
  - `assets/Logo.svg` - Original vector logo
  - `assets/logo.png` - PNG version (196x196)

### Application Icons
- **`assets/icon.png`** (192x192)
  - Main app icon for iOS and Android
  - Referenced in `app.json` as the primary app icon
  - Used in notifications

- **`assets/adaptive-icon.png`** (108x108)
  - Android adaptive icon (foreground image)
  - Referenced in `app.json` under `android.adaptiveIcon`
  - Background color: `#0F172A`

- **`assets/splash.png`** (540x720)
  - Splash screen with centered logo
  - Shows Fitspire branding on app launch
  - Dark background `#0F172A` with orange logo accent `#FE7A1B`

### Web Assets
- **`public/favicon.png`** (192x192)
  - Web favicon for browser tabs
  - PWA icon

- **`public/manifest.json`**
  - Web App Manifest for PWA support
  - App name, theme colors, and icon definitions
  - Theme color: `#FE7A1B` (brand orange)
  - Background color: `#0F172A` (dark)

- **`public/index.html`**
  - Web entry point with favicon and manifest references
  - Apple mobile web app configuration

## Updates Made ✓

### SplashScreen Component (`src/screens/SplashScreen.tsx`)
- Added logo image display (120x120)
- Logo appears above the app name
- Updated styling for better spacing and layout

### package.json
- Added `generate:splash` script for regenerating splash screens
- Command: `npm run generate:splash`

### app.json Configuration
- ✓ Icon: `./assets/icon.png`
- ✓ Splash: `./assets/splash.png`
- ✓ Adaptive Icon Foreground: `./assets/adaptive-icon.png`
- ✓ Notifications Icon: `./assets/icon.png`

## Branding Colors
- **Primary Orange**: `#FE7A1B`
- **Dark Background**: `#0F172A`

## File Locations Summary

```
fitspire-mobile/
├── assets/
│   ├── Logo.svg              (source)
│   ├── logo.png              (source)
│   ├── icon.png              (app icon)
│   ├── adaptive-icon.png     (android adaptive)
│   ├── favicon.png           (web)
│   └── splash.png            (splash screen)
├── public/
│   ├── favicon.png           (web favicon)
│   ├── manifest.json         (PWA manifest)
│   └── index.html            (web entry)
├── src/screens/
│   └── SplashScreen.tsx      (updated with logo)
└── generate-splash.js        (splash generation script)
```

## How to Use

### Development
- The app will automatically use the icons defined in `app.json`
- Run your app normally: `npm start`, `npm run ios`, `npm run android`, `npm run web`

### Regenerate Splash Screen
If you update the logo, regenerate the splash screen:
```bash
npm run generate:splash
```

### Rebuild After Icon Changes
For icon changes to take effect:
- **Android**: `npm run android`
- **iOS**: `npm run ios`
- **Web**: `npm run web`

## Testing
- ✓ Splash screen displays on app launch
- ✓ App icon appears on home screen
- ✓ Favicon appears in browser
- ✓ PWA manifest configured for installability
- ✓ Adaptive icon configured for Android

---
Created: May 29, 2026
Logo Source: `/Users/susmoydas/Downloads/Logo.svg`
