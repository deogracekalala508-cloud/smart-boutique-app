const express = require('express');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth');
const { envoyerCodeVerification } = require('../services/emailService');

const router = express.Router();

const tentativesInscription = new Map(); // par IP
const codesVerification = new Map();     // par email
const MAX_TENTATIVES_INSCRIPTION = 5;
const FENETRE_INSCRIPTION = 60 * 60 * 1000; // 1h

function verifierMotDePasseFort(motDePasse) {
  if (motDePasse.length < 8) return { valide: false, message: '8 caracteres minimum' };
  if (!/[A-Z]/.test(motDePasse)) return { valide: false, message: 'Au moins une majuscule' };
  if (!/[a-z]/.test(motDePasse)) return { valide: false, message: 'Au moins une minuscule' };
  if (!/[0-9]/.test(motDePasse)) return { valide: false, message: 'Au moins un chiffre' };
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(motDePasse)) return { valide: false, message: 'Au moins un caractere special' };
  return { valide: true };
}

function verifierEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function limiterInscription(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const entry = tentativesInscription.get(ip);

  if (entry && entry.reset > now && entry.count >= MAX_TENTATIVES_INSCRIPTION) {
    return res.status(429).json({ message: 'Trop de tentatives d\'inscription. Reessayez plus tard.' });
  }

  if (!entry || entry.reset <= now) {
    tentativesInscription.set(ip, { count: 1, reset: now + FENETRE_INSCRIPTION });
  } else {
    entry.count += 1;
  }

  next();
}

// INSCRIPTION ETAPE 1
router.post('/inscription-etape1', limiterInscription, async (req, res) => {
  try {
    const { nom_boutique, nom_admin, email_admin, telephone, mot_de_passe, mot_de_passe_confirm } = req.body;

    if (!nom_boutique || !nom_admin || !email_admin || !mot_de_passe) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent etre remplis' });
    }

    if (!verifierEmail(email_admin)) {
      return res.status(400).json({ message: 'Format email invalide' });
    }

    if (mot_de_passe !== mot_de_passe_confirm) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    const forceMdp = verifierMotDePasseFort(mot_de_passe);
    if (!forceMdp.valide) {
      return res.status(400).json({ message: 'Mot de passe trop faible : ' + forceMdp.message });
    }

    const emailNormalise = email_admin.toLowerCase().trim();
    const [existingEmail] = await pool.query(
      'SELECT id FROM utilisateurs WHERE LOWER(email) = ?',
      [emailNormalise]
    );
    if (existingEmail.length > 0) {
      return res.status(400).json({ message: 'Cet email est deja utilise' });
    }

    const [existingBoutique] = await pool.query(
      'SELECT id FROM boutiques WHERE LOWER(nom) = ? AND actif = true',
      [nom_boutique.toLowerCase().trim()]
    );
    if (existingBoutique.length > 0) {
      return res.status(400).json({ message: 'Ce nom de boutique est deja utilise' });
    }

    const codeVerification = Math.floor(100000 + Math.random() * 900000).toString();

    codesVerification.set(emailNormalise, {
      code: codeVerification,
      data: { nom_boutique, nom_admin, email_admin: emailNormalise, telephone, mot_de_passe },
      expire: Date.now() + 10 * 60 * 1000,
      tentatives: 0
    });

    const resultatEmail = await envoyerCodeVerification(emailNormalise, codeVerification, nom_boutique);

    if (resultatEmail.success) {
      res.json({ success: true, message: `Code envoye a ${emailNormalise}` });
    } else {
      res.json({ success: true, message: 'Code genere (verifiez la console)', code_console: true });
    }

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// INSCRIPTION ETAPE 2 : Verification du code + creation boutique (transaction atomique)
router.post('/inscription-etape2', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      connection.release();
      return res.status(400).json({ message: 'Email et code requis' });
    }

    const emailNormalise = email.toLowerCase().trim();
    const verification = codesVerification.get(emailNormalise);

    if (!verification) {
      connection.release();
      return res.status(400).json({ message: 'Aucune verification en cours' });
    }

    if (Date.now() > verification.expire) {
      codesVerification.delete(emailNormalise);
      connection.release();
      return res.status(400).json({ message: 'Code expire' });
    }

    if (verification.tentatives >= 3) {
      codesVerification.delete(emailNormalise);
      connection.release();
      return res.status(429).json({ message: 'Trop de tentatives' });
    }

    if (verification.code !== code.trim()) {
      verification.tentatives += 1;
      connection.release();
      return res.status(400).json({ message: `Code incorrect. ${3 - verification.tentatives} tentative(s).` });
    }

    await connection.beginTransaction();

    const { nom_boutique, nom_admin, email_admin, telephone, mot_de_passe } = verification.data;

    const motDePasseHash = await bcrypt.hash(mot_de_passe, 14);

    const [boutiqueResult] = await connection.query(
      'INSERT INTO boutiques (nom, proprietaire, telephone, email, actif) VALUES (?, ?, ?, ?, true)',
      [nom_boutique.trim(), nom_admin.trim(), telephone, email_admin]
    );

    const boutiqueId = boutiqueResult.insertId;

    const [userResult] = await connection.query(
      'INSERT INTO utilisateurs (nom, email, mot_de_passe, role, actif, boutique_id) VALUES (?, ?, ?, ?, true, ?)',
      [nom_admin.trim(), email_admin, motDePasseHash, 'admin', boutiqueId]
    );

    // Verification post-insertion : si boutique_id n'a pas ete correctement
    // enregistre, on annule tout plutot que de laisser un compte casse.
    const [verif] = await connection.query(
      'SELECT boutique_id FROM utilisateurs WHERE id = ?',
      [userResult.insertId]
    );
    if (!verif[0] || verif[0].boutique_id !== boutiqueId) {
      throw new Error('Echec de l\'association boutique_id lors de la creation du compte admin');
    }

    await connection.commit();
    codesVerification.delete(emailNormalise);

    res.status(201).json({
      success: true,
      message: 'Boutique creee avec succes !',
      boutique: { id: boutiqueId, nom: nom_boutique }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur lors de la creation du compte. Reessayez.' });
  } finally {
    connection.release();
  }
});

// SUPER ADMIN : Liste de toutes les boutiques
router.get('/toutes', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const [boutiques] = await pool.query(`
      SELECT b.*,
             (SELECT COUNT(*) FROM utilisateurs u WHERE u.boutique_id = b.id) as nb_utilisateurs
      FROM boutiques b ORDER BY b.created_at DESC
    `);
    res.json(boutiques);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// SUPER ADMIN : Supprimer (desactiver) une boutique
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query('UPDATE utilisateurs SET actif = false WHERE boutique_id = ?', [req.params.id]);
    await connection.query('UPDATE boutiques SET actif = false WHERE id = ?', [req.params.id]);

    await connection.commit();
    res.json({ message: 'Boutique desactivee' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    connection.release();
  }
});

// SUPER ADMIN : Reactiver une boutique
router.put('/:id/reactiver', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    await pool.query('UPDATE boutiques SET actif = true WHERE id = ?', [req.params.id]);
    res.json({ message: 'Boutique reactivee' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ADMIN BOUTIQUE : Créer un vendeur
router.post('/creer-vendeur', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { nom, email, mot_de_passe } = req.body;
    const boutiqueId = req.user.boutique_id;

    if (!boutiqueId) {
      return res.status(400).json({ message: 'Aucune boutique associée à ce compte' });
    }

    if (!nom || !email || !mot_de_passe) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
    }

    if (mot_de_passe.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    const emailNormalise = email.toLowerCase().trim();
    const [existingUser] = await pool.query(
      'SELECT id FROM utilisateurs WHERE LOWER(email) = ?',
      [emailNormalise]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const motDePasseHash = await bcrypt.hash(mot_de_passe, 14);

    const [result] = await pool.query(
      'INSERT INTO utilisateurs (nom, email, mot_de_passe, role, actif, boutique_id) VALUES (?, ?, ?, ?, true, ?)',
      [nom.trim(), emailNormalise, motDePasseHash, 'vendeur', boutiqueId]
    );

    res.status(201).json({
      success: true,
      message: 'Vendeur créé avec succès !',
      vendeurId: result.insertId
    });

  } catch (error) {
    console.error('Erreur création vendeur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ADMIN BOUTIQUE : Liste des vendeurs de SA boutique
router.get('/vendeurs', authenticate, authorize('admin'), async (req, res) => {
  try {
    const boutiqueId = req.user.boutique_id;

    const [vendeurs] = await pool.query(
      `SELECT id, nom, email, role, actif, created_at
       FROM utilisateurs
       WHERE boutique_id = ? AND role = 'vendeur'
       ORDER BY created_at DESC`,
      [boutiqueId]
    );

    res.json(vendeurs);
  } catch (error) {
    console.error('Erreur liste vendeurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ADMIN BOUTIQUE : Désactiver/Supprimer un vendeur
router.delete('/vendeur/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const boutiqueId = req.user.boutique_id;

    const [result] = await pool.query(
      'UPDATE utilisateurs SET actif = false WHERE id = ? AND boutique_id = ? AND role = \'vendeur\'',
      [req.params.id, boutiqueId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vendeur introuvable dans votre boutique' });
    }

    res.json({ success: true, message: 'Vendeur désactivé' });
  } catch (error) {
    console.error('Erreur désactivation vendeur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;