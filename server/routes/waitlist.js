const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const router = express.Router();

// Initialize auth
const serviceAccountAuth = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY 
  ? new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
  : null;

router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // If no auth is configured, just log it for now (simulated success)
  if (!serviceAccountAuth) {
    console.log(`[Waitlist] New signup (No Google Config): ${email}`);
    return res.json({ success: true, message: 'Waitlist signup successful (simulated)' });
  }

  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // Assuming use of the first sheet

    await sheet.addRow({
      Email: email,
      Date: new Date().toISOString(),
      Source: 'LitHub Landing'
    });

    res.json({ success: true, message: 'Added to waitlist!' });
  } catch (error) {
    console.error('Error adding to waitlist:', error.message);
    res.status(500).json({ error: 'Failed to add to waitlist', detail: error.message });
  }
});

module.exports = router;
