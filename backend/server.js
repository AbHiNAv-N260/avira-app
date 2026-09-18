const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET;
const configuredOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:8000,http://127.0.0.1:8000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}

let dataDirectory = process.env.DATA_DIR || __dirname;
try {
  fs.mkdirSync(dataDirectory, { recursive: true });
} catch (error) {
  dataDirectory = path.join('/tmp', 'avira-data');
  fs.mkdirSync(dataDirectory, { recursive: true });
  console.warn(`DATA_DIR is not writable; using ${dataDirectory} for this instance.`);
}
const db = new Database(path.join(dataDirectory, 'data.db'));

app.use(cors({
  origin(origin, callback) {
    if (!origin || configuredOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS.'));
  }
}));
app.use(express.json({ limit: '50kb' }));

const ensureSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      provider TEXT DEFAULT 'local',
      avatar TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      value REAL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cycle_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cycle_day INTEGER,
      entry_date TEXT,
      symptoms TEXT,
      flow TEXT DEFAULT 'None',
      mood TEXT DEFAULT 'Steady',
      energy TEXT DEFAULT 'Moderate',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS centres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      specialty TEXT,
      address TEXT,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const cycleColumns = db.prepare('PRAGMA table_info(cycle_entries)').all().map((column) => column.name);
  const missingCycleColumns = [
    ['entry_date', 'TEXT'],
    ['flow', "TEXT DEFAULT 'None'"],
    ['mood', "TEXT DEFAULT 'Steady'"],
    ['energy', "TEXT DEFAULT 'Moderate'"]
  ];
  missingCycleColumns.forEach(([name, definition]) => {
    if (!cycleColumns.includes(name)) {
      db.exec(`ALTER TABLE cycle_entries ADD COLUMN ${name} ${definition}`);
    }
  });

  const centreSeed = db.prepare('SELECT COUNT(*) as count FROM centres').get();
  if (centreSeed.count === 0) {
    db.prepare(`
      INSERT INTO centres (name, city, specialty, address, phone)
      VALUES
        ('Aster Care Clinic', 'Bengaluru', 'Women''s Health', 'MG Road, Bengaluru', '+91 80 4444 2000'),
        ('Nova Diagnostics', 'Hyderabad', 'Screening', 'Gachibowli, Hyderabad', '+91 40 2233 7766'),
        ('Wellness Path Lab', 'Pune', 'General Diagnostics', 'Kharadi, Pune', '+91 20 2654 1122'),
        ('CareNest Health Centre', 'Delhi', 'Support Care', 'Dwarka, Delhi', '+91 11 4567 3300')
    `).run();
  }
};

ensureSchema();

function getCyclePhaseName(cycleDay, cycleLength = 28) {
  const ovulationDay = Math.max(10, Number(cycleLength || 28) - 14);
  if (cycleDay <= 5) return 'Menstrual';
  if (cycleDay < ovulationDay - 1) return 'Follicular';
  if (cycleDay <= ovulationDay + 1) return 'Ovulation';
  return 'Luteal';
}

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !name.trim() || !email.trim() || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password_hash, provider) VALUES (?, ?, ?, ?)')
    .run(name, email.toLowerCase(), passwordHash, 'local');

  const user = db.prepare('SELECT id, name, email, provider, avatar, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = createToken(user);

  return res.status(201).json({ token, user });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !user.password_hash) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    provider: user.provider,
    avatar: user.avatar,
    created_at: user.created_at
  };

  return res.json({ token: createToken(safeUser), user: safeUser });
});

app.post('/api/auth/social', (req, res) => {
  const { name, email, provider, avatar } = req.body;

  if (typeof name !== 'string' || typeof email !== 'string' || typeof provider !== 'string' || !name.trim() || !email.trim() || !provider.trim()) {
    return res.status(400).json({ message: 'Social auth fields are required.' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

  if (existing) {
    const safeUser = {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      provider: existing.provider,
      avatar: existing.avatar,
      created_at: existing.created_at
    };
    return res.json({ token: createToken(safeUser), user: safeUser });
  }

  const result = db.prepare('INSERT INTO users (name, email, provider, avatar) VALUES (?, ?, ?, ?)')
    .run(name, email.toLowerCase(), provider, avatar || '');

  const user = db.prepare('SELECT id, name, email, provider, avatar, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

  return res.status(201).json({ token: createToken(user), user });
});

app.get('/api/user/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, email, provider, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user });
});

app.get('/api/records', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM records WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ records: rows });
});

app.get('/api/insights', authMiddleware, (req, res) => {
  const records = db.prepare('SELECT * FROM records WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const cycleEntries = db.prepare('SELECT * FROM cycle_entries WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);

  const phRecords = records.filter((entry) => entry.type === 'ph' && Number(entry.value));
  const averagePh = phRecords.length
    ? (phRecords.reduce((total, entry) => total + Number(entry.value), 0) / phRecords.length).toFixed(1)
    : '4.2';

  const latestRecord = phRecords[0] || null;
  const latestCycle = cycleEntries[0] || null;
  const lastPhase = latestCycle ? getCyclePhaseName(Number(latestCycle.cycle_day || 1), 28) : 'Ovulation';

  res.json({
    totalRecords: records.length,
    averagePh,
    latestPh: latestRecord ? Number(latestRecord.value).toFixed(1) : '4.2',
    latestPhase: lastPhase,
    cycleEntries: cycleEntries.length,
    healthScore: phRecords.length ? Math.min(100, Math.max(68, Math.round((5 - Math.abs(Number(averagePh) - 4.2)) * 18 + 70))) : 82
  });
});

app.post('/api/records', authMiddleware, (req, res) => {
  const { type, value, notes } = req.body;
  if (!type) return res.status(400).json({ message: 'Record type is required.' });

  const result = db.prepare('INSERT INTO records (user_id, type, value, notes) VALUES (?, ?, ?, ?)')
    .run(req.user.id, type, value ?? null, notes ?? '');

  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ record });
});

app.delete('/api/records/:id', authMiddleware, (req, res) => {
  const result = db.prepare('DELETE FROM records WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ message: 'Record not found.' });
  res.json({ success: true });
});

app.get('/api/cycle', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM cycle_entries WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ entries: rows });
});

app.post('/api/cycle', authMiddleware, (req, res) => {
  const { cycle_day, entry_date, symptoms, flow, mood, energy, notes } = req.body;

  if (!Number.isFinite(Number(cycle_day)) || Number(cycle_day) < 1) {
    return res.status(400).json({ message: 'A valid cycle day is required.' });
  }

  const result = db.prepare(`
    INSERT INTO cycle_entries (user_id, cycle_day, entry_date, symptoms, flow, mood, energy, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    Number(cycle_day),
    entry_date || new Date().toISOString().slice(0, 10),
    symptoms ?? '',
    flow || 'None',
    mood || 'Steady',
    energy || 'Moderate',
    notes ?? ''
  );

  const entry = db.prepare('SELECT * FROM cycle_entries WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ entry });
});

app.delete('/api/cycle/:id', authMiddleware, (req, res) => {
  const result = db.prepare('DELETE FROM cycle_entries WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ message: 'Cycle entry not found.' });
  res.json({ success: true });
});

function buildFallbackCentres(latitude, longitude, keyword) {
  const base = [
    { name: 'Aster Women Care Centre', city: 'Nearby', address: 'Diagnostics and women health screening support', rating: 4.7, open_now: true },
    { name: 'City Women Health Clinic', city: 'Nearby', address: 'Women wellness consultation and screening support', rating: 4.5, open_now: false },
    { name: 'Bloom Diagnostic Centre', city: 'Nearby', address: 'General diagnostic support and specialist referral guidance', rating: 4.6, open_now: true },
    { name: 'CareNest Women Clinic', city: 'Nearby', address: 'Follow-up care coordination and symptom review', rating: 4.4, open_now: false }
  ];

  return base.map((centre, index) => ({
    ...centre,
    name: keyword && index === 0 ? `${keyword} Clinic` : centre.name,
    lat: latitude + (index * 0.003),
    lng: longitude + (index * 0.002),
    isFallback: true
  }));
}

app.get('/api/centres', (req, res) => {
  const { city } = req.query;
  const query = city ? 'SELECT * FROM centres WHERE city LIKE ? ORDER BY name ASC' : 'SELECT * FROM centres ORDER BY name ASC';
  const rows = city ? db.prepare(query).all(`%${city}%`) : db.prepare(query).all();
  res.json({ centres: rows });
});

app.get('/api/centres/nearby', async (req, res) => {
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lng);
  const keyword = (req.query.keyword || 'Women Health Care check up centre').trim();

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ message: 'Valid latitude and longitude are required.' });
  }

  try {
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["healthcare"~"clinic|doctor|hospital|centre|center|pharmacy"]["name"](around:15000,${latitude},${longitude});
        way["healthcare"~"clinic|doctor|hospital|centre|center|pharmacy"]["name"](around:15000,${latitude},${longitude});
        node["amenity"~"clinic|hospital|doctors"]["name"](around:15000,${latitude},${longitude});
        way["amenity"~"clinic|hospital|doctors"]["name"](around:15000,${latitude},${longitude});
      );
      out center tags;
    `;

    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    const response = await fetch(overpassUrl, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      throw new Error(`Nearby centre lookup failed with status ${response.status}.`);
    }
    const data = await response.json();

    const rawElements = Array.isArray(data.elements) ? data.elements : [];
    const centres = rawElements
      .map((element) => {
        const tags = element.tags || {};
        const name = tags.name || 'Nearby healthcare centre';
        const address = [tags['addr:street'], tags['addr:city'], tags['addr:country']].filter(Boolean).join(', ') || 'Address unavailable';
        const lat = Number(element.lat ?? (element.center && element.center.lat));
        const lng = Number(element.lon ?? (element.center && element.center.lon));
        const combined = `${name} ${address}`.toLowerCase();
        const matchesKeyword = !keyword || combined.includes(keyword.toLowerCase()) || combined.includes('clinic') || combined.includes('health') || combined.includes('women') || combined.includes('hospital') || combined.includes('doctor');

        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !matchesKeyword) {
          return null;
        }

        return {
          name,
          city: tags['addr:city'] || 'Nearby',
          address,
          rating: null,
          open_now: false,
          lat,
          lng,
          isFallback: false
        };
      })
      .filter(Boolean)
      .slice(0, 8);

    if (centres.length) {
      return res.json({ centres, source: 'osm' });
    }

    return res.json({ centres: buildFallbackCentres(latitude, longitude, keyword), source: 'fallback' });
  } catch (error) {
    return res.json({ centres: buildFallbackCentres(latitude, longitude, keyword), source: 'fallback' });
  }
});

app.post('/api/centres', authMiddleware, (req, res) => {
  const { name, city, specialty, address, phone } = req.body;

  if (!name || !city) {
    return res.status(400).json({ message: 'Centre name and city are required.' });
  }

  const result = db.prepare('INSERT INTO centres (name, city, specialty, address, phone) VALUES (?, ?, ?, ?, ?)')
    .run(name, city, specialty || '', address || '', phone || '');

  const centre = db.prepare('SELECT * FROM centres WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ centre });
});

app.use('/backend', (req, res) => {
  res.status(404).end();
});

app.use(express.static(path.join(__dirname, '..'), {
  dotfiles: 'deny',
  index: 'index.html'
}));

app.listen(PORT, () => {
  console.log(`AVIRA backend running on http://localhost:${PORT}`);
});
