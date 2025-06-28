require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());

// 🔐 Load Firebase credentials from uploaded Render secret
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 🌐 Root Route
app.get('/', (req, res) => {
  res.send('🎉 ESP32 backend is live! Visit /esp32/events for data.');
});

// 🔁 Get all events
app.get('/esp32/events', async (req, res) => {
  try {
    const events = [];

    // 🟢 Fetch normalEvents
    const normalSnap = await db.collection('normalEvents').get();
    normalSnap.forEach(doc => {
      const data = doc.data();
      events.push({
        id: doc.id,
        type: 'normal',
        time: data.time,
        tone: data.tone,
        delay: data.delay || 0,
        title: data.title || 'No Title',
        days: data.days || [],
        active: data.active ?? true,
      });
    });

    // 🔵 Fetch specialEvents
    const specialSnap = await db.collection('specialEvents').get();
    specialSnap.forEach(doc => {
      const data = doc.data();
      events.push({
        id: doc.id,
        type: 'special',
        time: data.time,
        tone: data.tone,
        delay: 0,
        date: data.date,
        description: data.description || 'No Description',
      });
    });

    // ⏳ Sort events by time
    events.sort((a, b) => a.time.localeCompare(b.time));
    res.json(events);
  } catch (err) {
    console.error('❌ Error fetching events:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
