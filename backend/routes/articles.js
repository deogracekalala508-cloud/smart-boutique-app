const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const CATEGORIES_VALIDES = ['vetement', 'accessoire_telephone', 'machine', 'autre'];

// Recuperer les articles de SA boutique
router.get('/', authenticate, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const boutiqueId = req.user.boutique_id;

    if (!boutiqueId) {
      return res.status(400).json({ message: 'Aucune boutique associee a ce compte' });
    }

    // Le vendeur a maintenant le droit de voir le prix d'achat et la quantité en stock
    const colonnes = '*';

    const [articles] = await pool.query(
      `SELECT ${colonnes} FROM articles WHERE actif = true AND boutique_id = ? ORDER BY nom`,
      [boutiqueId]
    );

    res.json(articles);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Creer un article pour SA boutique — supporte maintenant vetements, accessoires
// telephone (numero_serie ~ IMEI) et machines (numero_serie + garantie_mois)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      reference, nom, description, prix_achat, prix_vente, quantite_stock,
      type_produit, taille, couleur, numero_serie, garantie_mois
    } = req.body;
    const boutiqueId = req.user.boutique_id;

    if (!boutiqueId) {
      return res.status(400).json({ message: 'Aucune boutique associee a ce compte' });
    }

    if (!reference || !nom || !prix_achat || !prix_vente) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    if (Number(prix_achat) < 0 || Number(prix_vente) < 0) {
      return res.status(400).json({ message: 'Les prix doivent etre positifs' });
    }

    const [existing] = await pool.query(
      'SELECT id, nom FROM articles WHERE reference = ? AND boutique_id = ? AND actif = true',
      [reference, boutiqueId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: `La reference "${reference}" est deja utilisee par "${existing[0].nom}". Utilisez une autre reference.`
      });
    }

    const [result] = await pool.query(
      `INSERT INTO articles
        (reference, nom, description, prix_achat, prix_vente, quantite_stock, type_produit, taille, couleur, boutique_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reference, nom, description, prix_achat, prix_vente, quantite_stock || 0,
        type_produit || 'vetement', taille || null, couleur || null, boutiqueId
      ]
    );

    res.status(201).json({ message: 'Article cree', id: result.insertId });
  } catch (error) {
    console.error('Erreur:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Cette reference existe deja dans votre boutique.' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un article
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const boutiqueId = req.user.boutique_id;
    const [result] = await pool.query(
      'UPDATE articles SET actif = false WHERE id = ? AND boutique_id = ?',
      [req.params.id, boutiqueId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Article introuvable' });
    }

    res.json({ message: 'Article supprime' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Rapport PDF du stock
router.get('/rapport-pdf', authenticate, authorize('admin'), async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const boutiqueId = req.user.boutique_id;
    
    if (!boutiqueId) {
      return res.status(400).json({ message: 'Aucune boutique associee' });
    }
    
    // Recuperer le nom de la boutique
    const [boutique] = await pool.query('SELECT nom FROM boutiques WHERE id = ?', [boutiqueId]);
    const nomBoutique = boutique[0]?.nom || 'Ma Boutique';
    
    const [articles] = await pool.query(
      'SELECT * FROM articles WHERE actif = true AND boutique_id = ? ORDER BY nom',
      [boutiqueId]
    );
    
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="stock_${new Date().toISOString().split('T')[0]}.pdf"`);
    
    doc.pipe(res);
    
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#1a237e').text(nomBoutique.toUpperCase(), { align: 'center' });
    doc.fontSize(14).font('Helvetica').fillColor('#333').text('RAPPORT DE STOCK', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').text(`Date : ${new Date().toLocaleString('fr-FR')}`, { align: 'center' });
    doc.text(`Nombre d'articles : ${articles.length}`, { align: 'center' });
    doc.moveDown();
    
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#1a237e').stroke();
    doc.moveDown();
    
    const valeurTotale = articles.reduce((total, art) => total + (Number(art.prix_vente) * Number(art.quantite_stock)), 0);
    const beneficePotentiel = articles.reduce((total, art) => total + ((Number(art.prix_vente) - Number(art.prix_achat)) * Number(art.quantite_stock)), 0);
    
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
    doc.text(`Valeur totale du stock : ${valeurTotale.toFixed(0)} CDF`);
    doc.text(`Benefice potentiel : ${beneficePotentiel.toFixed(0)} CDF`);
    doc.moveDown();
    
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#999').stroke();
    doc.moveDown();
    
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Reference', 40, doc.y);
    doc.text('Nom', 120, doc.y);
    doc.text('Prix achat', 280, doc.y);
    doc.text('Prix vente', 360, doc.y);
    doc.text('Stock', 440, doc.y);
    doc.text('Benefice', 500, doc.y);
    doc.moveDown(0.5);
    
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#999').stroke();
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    
    articles.forEach(article => {
      if (doc.y > 750) {
        doc.addPage();
      }
      const y = doc.y;
      const prixAchat = Number(article.prix_achat) || 0;
      const prixVente = Number(article.prix_vente) || 0;
      const quantite = Number(article.quantite_stock) || 0;
      
      doc.text(article.reference || '', 40, y);
      doc.text((article.nom || '').substring(0, 28), 120, y);
      doc.text(`${prixAchat.toFixed(0)}`, 280, y);
      doc.text(`${prixVente.toFixed(0)}`, 360, y);
      if (quantite <= 5) {
        doc.fillColor('red').text(String(quantite), 440, y);
        doc.fillColor('black');
      } else {
        doc.text(String(quantite), 440, y);
      }
      doc.text(`${(prixVente - prixAchat).toFixed(0)}`, 500, y);
      doc.moveDown(0.8);
    });
    
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#1a237e').stroke();
    doc.moveDown(0.5);
    
    doc.fontSize(9).font('Helvetica').fillColor('#666');
    doc.text('Les articles en rouge ont un stock faible (<= 5)', 40, doc.y, { width: 515, align: 'center' });
    doc.moveDown(0.5);
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a237e');
    doc.text(nomBoutique.toUpperCase(), 40, doc.y, { width: 515, align: 'center' });
    doc.moveDown(0.3);
    
    doc.fontSize(9).font('Helvetica').fillColor('#999');
    doc.text('Rapport genere automatiquement', 40, doc.y, { width: 515, align: 'center' });
    
    doc.end();
    
  } catch (error) {
    console.error('Erreur rapport stock:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Erreur : ' + error.message });
    }
  }
});

module.exports = router;