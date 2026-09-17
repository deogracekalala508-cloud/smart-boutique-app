const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

// Empêche un démarrage silencieux avec un JWT_SECRET manquant
// (avant, ça retombait sur `undefined`, ce qui est signable/vérifiable
// par n'importe qui connaissant la faille).
if (!process.env.JWT_SECRET) {
  console.error('ERREUR FATALE: JWT_SECRET non defini dans .env. Arret du serveur.');
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const articlesRoutes = require('./routes/articles');
const ventesRoutes = require('./routes/ventes');
const clientsRoutes = require('./routes/clients');
const boutiquesRoutes = require('./routes/boutiques');

const app = express();

// Necessaire si le serveur tourne derriere un reverse proxy (Nginx, Render, Railway...)
// pour que express-rate-limit et req.ip identifient la vraie IP du client.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: [
    'https://smart-boutique-app.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Limite globale : evite qu'un endpoint sans limite dediee (creation d'articles,
// ventes...) puisse etre spamme. A ajuster selon ton usage reel.
const limiteurGlobal = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de requetes, reessayez plus tard.' }
});
app.use('/api/', limiteurGlobal);

const { initialiserTablesAutomatique } = require('./services/initTablesService');

app.get('/api/init-db', async (req, res) => {
  const ok = await initialiserTablesAutomatique();
  if (ok) {
    res.json({ success: true, message: 'Tables MySQL initialisees avec succes !' });
  } else {
    res.status(500).json({ success: false, message: 'Erreur lors de l\'initialisation des tables' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/ventes', ventesRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/boutiques', boutiquesRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Serveur Smart Boutique demarre sur http://localhost:${PORT}`);

  try {
    await initialiserTablesAutomatique();
  } catch (err) {
    console.error('Erreur init tables:', err.message);
  }

  try {
    const { verifierConfiguration } = require('./services/emailService');
    await verifierConfiguration();
  } catch (error) {
    console.log('Service email non configure');
  }
});