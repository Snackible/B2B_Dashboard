// Apps Script web-app endpoints (each returns { "<Tab name>": [[row], …] }).
export const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwPVvV-1OACvRgDYtmHpTS9QnDbc556B-G_C-nvradUY_PGjP2NsDr1DTJydIu82ID8/exec';
export const BD_URL = 'https://script.google.com/macros/s/AKfycbwZOjviZgLXKd0nuXKxiGHUeJ9vrqRHxv3_-Hdc1fX-5UrTSNxiuMV_op4X_ey-7h4iNg/exec';
export const SAMPLES_URL = 'https://script.google.com/macros/s/AKfycbwHPMP6i9NcDOZCR7xL7eEdJZXho8Ju0BWs0H7RVLKJmMs1h4JqJ7r3qRpHP-3iyAU/exec';
export const DIWALI_URL = 'https://script.google.com/macros/s/AKfycbwWOXAeQl5-KCG90vYob0uoCRA10QGq9qE9lPzc12Te3wP__7mt9IEGdB8g1gxFC0xF/exec';
// Old multi-tab sheet (Mails / Ads / InMails / CCBD / Pending_*)
export const LEGACY_URL = 'https://script.google.com/macros/s/AKfycbzsb5FX-sds7Hv25Cd_crPLtJGqTDWaPDuNz10Z68UvaHjD_US5bLys6ncfkY_Wm1ibzA/exec';
// Noor Database (mail-merge contact tracker); loops every tab in the sheet.
export const NOOR_URL = 'https://script.google.com/macros/s/AKfycbxSHX1_69dPwbYqMgec7iKxQuXPCECRPCDg4cn5ePrxcQJNCkvom98tJGIQLTIKodcRtQ/exec';

// Sample_sheet spans years (~7MB full read), so it's loaded small-to-large.
export const SAMPLE_TIERS = [
  { key: 'today', limit: 300, label: "Loading today's samples…" },
  { key: 'week', limit: 1500, label: 'Loading this week’s samples…' },
  { key: 'month', limit: 6000, label: "Loading this month's samples…" },
  { key: 'all', limit: null, label: 'Loading full sample history… (this can take a while)' },
];

export const PENDING_ALLOWED_POCS = ['Mahi', 'Bhoomika', 'Prabhnoor', 'Kritik', 'Dhyana', 'Khushi'];
