const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

const tentativesConnexion = new Map();
const MAX_TENTATIVES = 3;
const DUREE_BLOCAGE = 30 * 60 * 1000;

// Hash factice utilisé quand l'utilisateur n'existe pas, pour que bcrypt.compare
// prenne le même temps que pour un vrai utilisateur (évite une fuite d'info par timing).
const HASH_FACTICE = '$2a$14$abcdefghijklmnopqrstuuOaJdG9x2eYQrM7cLXlmS4uKq0ZrXeXG';

function enregistrerEchec(email) {
  const tentative = tentativesConnexion.get(email) || { nbTentatives: 0, bloqueJusquA: 0 };
  tentative.nbTentatives += 1;
  if (tentative.nbTentatives >= MAX_TENTATIVES) {
    tentative.bloqueJusquA = Date.now() + DUREE_BLOCAGE;
  }
  tentativesConnexion.set(email, tentative);
}

router.post('/login', async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const emailNormalise = email.toLowerCase().trim();
    const MESSAGE_GENERIQUE = 'Email ou mot de passe incorrect';

    const tentative = tentativesConnexion.get(emailNormalise);
    if (tentative && tentative.bloqueJusquA > Date.now()) {
      const tempsRestant = Math.ceil((tentative.bloqueJusquA - Date.now()) / 60000);
      return res.status(429).json({ message: `Compte temporairement bloque. Reessayez dans ${tempsRestant} minutes.` });
    }

    const [users] = await pool.query(
      'SELECT u.*, b.nom as nom_boutique, b.actif as boutique_active FROM utilisateurs u LEFT JOIN boutiques b ON u.boutique_id = b.id WHERE LOWER(u.email) = ?',
      [emailNormalise]
    );

    const user = users[0];

    // IMPORTANT : on compare toujours un hash (réel ou factice) pour ne jamais
    // révéler par le message d'erreur OU par le temps de réponse si l'email existe.
    const motDePasseValide = await bcrypt.compare(mot_de_passe, user ? user.mot_de_passe : HASH_FACTICE);

    if (!user || !motDePasseValide) {
      enregistrerEchec(emailNormalise);
      return res.status(401).json({ message: MESSAGE_GENERIQUE });
    }

    // Bloquer l'accès et signaler la désactivation de la boutique
    if (!user.actif || (user.boutique_id && (user.boutique_active === 0 || user.boutique_active === false))) {
      return res.status(403).json({
        boutique_desactivee: true,
        message: 'Cette boutique a été désactivée par l\'administrateur. L\'accès et la création de comptes sont suspendus.'
      });
    }

    // Garde-fou contre le bug #3 : un utilisateur non-super_admin sans boutique_id
    // ne doit jamais pouvoir se connecter — on préfère un échec visible et loggé
    // plutôt qu'un token silencieusement cassé qui provoquera des bugs en cascade.
    if (user.role !== 'super_admin' && !user.boutique_id) {
      console.error(`ALERTE: utilisateur id=${user.id} email=${user.email} actif sans boutique_id — connexion bloquee`);
      return res.status(500).json({ message: 'Compte mal configure. Contactez le support.' });
    }

    tentativesConnexion.delete(emailNormalise);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, boutique_id: user.boutique_id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        boutique_id: user.boutique_id,
        nom_boutique: user.nom_boutique
      }
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;