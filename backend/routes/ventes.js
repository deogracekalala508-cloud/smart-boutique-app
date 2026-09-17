const express = require('express');
const { pool } = require('../config/database');
const { authenticate, authenticateFlexible } = require('../middleware/auth');
const { escapeHtml } = require('../utils/html');

const router = express.Router();

async function genererNumeroFacture(connection, boutiqueId) {
  const annee = new Date().getFullYear();

  // Chercher la derniere vente enregistree dans toute la base
  const [maxRow] = await connection.query(
    'SELECT id, numero_facture FROM ventes ORDER BY id DESC LIMIT 1'
  );

  let baseNum = 1;
  if (maxRow.length > 0) {
    baseNum = Number(maxRow[0].id) + 1;
  }

  let numero;
  let existe = true;
  let securite = 0;

  // Boucle de verification d'unicite absolue dans MySQL
  while (existe && securite < 500) {
    securite++;
    const numPadded = String(baseNum).padStart(4, '0');

    if (boutiqueId && Number(boutiqueId) > 1) {
      numero = `FAC-B${boutiqueId}-${annee}-${numPadded}`;
    } else {
      numero = `FAC-${annee}-${numPadded}`;
    }

    const [check] = await connection.query(
      'SELECT id FROM ventes WHERE numero_facture = ? LIMIT 1',
      [numero]
    );

    if (check.length === 0) {
      existe = false;
    } else {
      baseNum++;
    }
  }

  if (!numero || existe) {
    numero = `FAC-${annee}-${Date.now()}`;
  }

  return numero;
}

router.post('/', authenticate, async (req, res) => {
  const MAX_TENTATIVES = 5;
  let derniereErreur;

  for (let tentative = 0; tentative < MAX_TENTATIVES; tentative++) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { articles, mode_paiement = 'especes', devise = 'CDF' } = req.body;
      const boutiqueId = req.user.boutique_id;

      if (!articles || articles.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ message: 'Aucun article dans la vente' });
      }

      const numeroFacture = await genererNumeroFacture(connection, boutiqueId);

      let montantTotal = 0;
      let beneficeTotal = 0;
      const articlesValides = [];

      for (const ligne of articles) {
        // FOR UPDATE : verrouille la ligne le temps de la transaction pour empecher
        // deux ventes simultanees de survendre le meme stock (race condition).
        const [articleData] = await connection.query(
          'SELECT * FROM articles WHERE id = ? AND actif = true AND boutique_id = ? FOR UPDATE',
          [ligne.article_id, boutiqueId]
        );

        if (articleData.length === 0) {
          throw new Error('Article introuvable dans votre boutique');
        }

        const art = articleData[0];

        if (Number(art.quantite_stock) < Number(ligne.quantite)) {
          throw new Error(`Stock insuffisant pour ${art.nom}. Stock: ${art.quantite_stock}`);
        }

        montantTotal += Number(art.prix_vente) * Number(ligne.quantite);
        beneficeTotal += (Number(art.prix_vente) - Number(art.prix_achat)) * Number(ligne.quantite);

        articlesValides.push({ ...ligne, prix_vente: art.prix_vente });
      }

      const [venteResult] = await connection.query(
        'INSERT INTO ventes (numero_facture, vendeur_id, montant_total, montant_final, mode_paiement, boutique_id) VALUES (?, ?, ?, ?, ?, ?)',
        [numeroFacture, req.user.id, montantTotal, montantTotal, mode_paiement, boutiqueId]
      );

      const venteId = venteResult.insertId;

      for (const ligne of articlesValides) {
        await connection.query(
          'INSERT INTO ventes_details (vente_id, article_id, quantite, prix_unitaire) VALUES (?, ?, ?, ?)',
          [venteId, ligne.article_id, ligne.quantite, ligne.prix_vente]
        );

        await connection.query(
          'UPDATE articles SET quantite_stock = quantite_stock - ? WHERE id = ?',
          [ligne.quantite, ligne.article_id]
        );
      }

      await connection.commit();
      connection.release();

      return res.status(201).json({
        success: true,
        message: 'Vente enregistree',
        vente: {
          id: venteId,
          numero_facture: numeroFacture,
          montant_total: montantTotal,
          benefice: beneficeTotal,
          devise
        }
      });

    } catch (error) {
      await connection.rollback();
      connection.release();

      // Deux ventes simultanees ont genere le meme numero_facture (protege par
      // la contrainte UNIQUE (boutique_id, numero_facture) de la migration 02) :
      // on relance avec un nouveau numero plutot que d'echouer pour le client.
      if (error.code === 'ER_DUP_ENTRY' && tentative < MAX_TENTATIVES - 1) {
        derniereErreur = error;
        continue;
      }

      console.error('Erreur vente:', error);
      return res.status(400).json({ message: error.message || 'Erreur lors de la vente' });
    }
  }

  console.error('Erreur vente apres plusieurs tentatives:', derniereErreur);
  return res.status(500).json({ message: 'Erreur lors de la vente, reessayez.' });
});

router.get('/aujourdhui', authenticate, async (req, res) => {
  try {
    const boutiqueId = req.user.boutique_id;

    const [ventes] = await pool.query(`
      SELECT v.*, u.nom as vendeur_nom
      FROM ventes v
      JOIN utilisateurs u ON v.vendeur_id = u.id
      WHERE DATE(v.created_at) = CURDATE() AND v.boutique_id = ?
      ORDER BY v.created_at DESC
    `, [boutiqueId]);

    const [stats] = await pool.query(`
      SELECT COUNT(*) as nombre_ventes, SUM(montant_final) as chiffre_affaires
      FROM ventes WHERE DATE(created_at) = CURDATE() AND boutique_id = ?
    `, [boutiqueId]);

    const [benefice] = await pool.query(`
      SELECT SUM((vd.prix_unitaire - a.prix_achat) * vd.quantite) as benefice
      FROM ventes_details vd
      JOIN articles a ON vd.article_id = a.id
      JOIN ventes v ON vd.vente_id = v.id
      WHERE DATE(v.created_at) = CURDATE() AND v.boutique_id = ?
    `, [boutiqueId]);

    res.json({
      ventes,
      stats: { ...stats[0], benefice: benefice[0].benefice || 0 }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/historique', authenticate, async (req, res) => {
  try {
    const boutiqueId = req.user.boutique_id;

    const [ventes] = await pool.query(`
      SELECT v.*, u.nom as vendeur_nom
      FROM ventes v
      JOIN utilisateurs u ON v.vendeur_id = u.id
      WHERE v.boutique_id = ?
      ORDER BY v.created_at DESC
      LIMIT 100
    `, [boutiqueId]);

    res.json(ventes);
  } catch (error) {
    console.error('Erreur historique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/details/:id', authenticate, async (req, res) => {
  try {
    const boutiqueId = req.user.boutique_id;

    const [vente] = await pool.query(`
      SELECT v.*, u.nom as vendeur_nom
      FROM ventes v
      JOIN utilisateurs u ON v.vendeur_id = u.id
      WHERE v.id = ? AND v.boutique_id = ?
    `, [req.params.id, boutiqueId]);

    if (vente.length === 0) {
      return res.status(404).json({ message: 'Vente introuvable' });
    }

    const [details] = await pool.query(`
      SELECT vd.*, a.nom as article_nom, a.prix_achat
      FROM ventes_details vd
      JOIN articles a ON vd.article_id = a.id
      WHERE vd.vente_id = ?
    `, [req.params.id]);

    const beneficeTotal = details.reduce((total, d) => {
      const prixUnitaire = Number(d.prix_unitaire) || 0;
      const prixAchat = Number(d.prix_achat) || 0;
      const quantite = Number(d.quantite) || 0;
      return total + ((prixUnitaire - prixAchat) * quantite);
    }, 0);

    res.json({
      vente: vente[0],
      details,
      benefice_total: beneficeTotal
    });
  } catch (error) {
    console.error('Erreur details:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Facture imprimable — desormais protegee par authenticateFlexible (header OU
// ?token=, car ce lien est ouvert dans un nouvel onglet par le frontend) et
// filtree par boutique_id : un vendeur/admin ne peut voir que les factures de
// SA boutique, meme en devinant un numero d'une autre boutique.
// Tous les champs venant de la base sont echappes (escapeHtml) pour empecher
// le XSS stocke via un nom d'article/vendeur/boutique malveillant.
router.get('/facture-html/:numero', authenticateFlexible, async (req, res) => {
  try {
    const boutiqueId = req.user.boutique_id;

    const [ventes] = await pool.query(`
      SELECT v.*, u.nom as vendeur_nom, b.nom as nom_boutique
      FROM ventes v
      JOIN utilisateurs u ON v.vendeur_id = u.id
      LEFT JOIN boutiques b ON v.boutique_id = b.id
      WHERE v.numero_facture = ? AND v.boutique_id = ?
    `, [req.params.numero, boutiqueId]);

    if (ventes.length === 0) {
      return res.status(404).send('<h1>Facture introuvable</h1>');
    }

    const vente = ventes[0];
    const [details] = await pool.query(`
      SELECT vd.*, a.nom as article_nom, a.prix_achat
      FROM ventes_details vd JOIN articles a ON vd.article_id = a.id
      WHERE vd.vente_id = ?
    `, [vente.id]);

    const montantFinal = Number(vente.montant_final) || 0;
    const totalUSD = (montantFinal / 2800).toFixed(2);

    let lignes = '';
    details.forEach(d => {
      const prixUnitaire = Number(d.prix_unitaire) || 0;
      const quantite = Number(d.quantite) || 0;
      const montantLigne = prixUnitaire * quantite;

      lignes += '<tr>' +
        '<td style="padding:8px;border-bottom:1px solid #ddd;">' + escapeHtml(d.article_nom) + '</td>' +
        '<td style="padding:8px;text-align:center;">' + quantite + '</td>' +
        '<td style="padding:8px;text-align:right;">' + prixUnitaire.toFixed(0) + ' CDF</td>' +
        '<td style="padding:8px;text-align:right;">' + montantLigne.toFixed(0) + ' CDF</td>' +
        '</tr>';
    });

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Facture ${escapeHtml(vente.numero_facture)}</title>
<style>body{font-family:Arial;padding:20px;background:#f5f5f5;}.facture{max-width:500px;margin:0 auto;background:white;padding:30px;border-radius:10px;}h1{color:#1a237e;text-align:center;}table{width:100%;border-collapse:collapse;margin-top:20px;}th{background:#1a237e;color:white;padding:10px;}.total{text-align:right;font-size:20px;font-weight:bold;color:#1a237e;margin-top:20px;}.bouton{display:block;margin:20px auto;padding:12px 30px;background:#1a237e;color:white;border:none;border-radius:5px;cursor:pointer;}@media print{.bouton{display:none;}}</style>
</head><body><div class="facture">
<h1>${escapeHtml(vente.nom_boutique || 'Smart Boutique')}</h1>
<h2 style="text-align:center;">FACTURE DE VENTE</h2>
<p><strong>N Facture :</strong> ${escapeHtml(vente.numero_facture)}</p>
<p><strong>Date :</strong> ${new Date(vente.created_at).toLocaleString('fr-FR')}</p>
<p><strong>Vendeur :</strong> ${escapeHtml(vente.vendeur_nom)}</p>
<table><thead><tr><th>Article</th><th>Qte</th><th>Prix</th><th>Total</th></tr></thead>
<tbody>${lignes}</tbody></table>
<p class="total">TOTAL : ${montantFinal.toFixed(0)} CDF</p>
<p style="text-align:right;color:#666;">${totalUSD} USD</p>
<button class="bouton" onclick="window.print()">Imprimer</button>
</div></body></html>`;

    res.send(html);
  } catch (error) {
    console.error('Erreur facture:', error);
    res.status(500).send('Erreur');
  }
});

// STATISTIQUES AVANCÉES & ANALYSE PRÉDICTIVE DE STOCK POUR LE DASHBOARD
router.get('/stats-dashboard', authenticate, async (req, res) => {
  try {
    const boutiqueId = req.user.boutique_id;
    if (!boutiqueId) {
      return res.status(400).json({ message: 'Aucune boutique associée' });
    }

    const [salesKpi] = await pool.query(`
      SELECT 
        COUNT(*) as total_ventes,
        COALESCE(SUM(montant_final), 0) as chiffre_affaires
      FROM ventes WHERE boutique_id = ?
    `, [boutiqueId]);

    const [beneficeKpi] = await pool.query(`
      SELECT COALESCE(SUM((vd.prix_unitaire - a.prix_achat) * vd.quantite), 0) as benefice_total
      FROM ventes_details vd
      JOIN articles a ON vd.article_id = a.id
      JOIN ventes v ON vd.vente_id = v.id
      WHERE v.boutique_id = ?
    `, [boutiqueId]);

    const [stockKpi] = await pool.query(`
      SELECT 
        COUNT(*) as total_articles,
        COALESCE(SUM(prix_vente * quantite_stock), 0) as valeur_stock,
        COALESCE(SUM((prix_vente - prix_achat) * quantite_stock), 0) as benefice_potentiel
      FROM articles WHERE boutique_id = ? AND actif = true
    `, [boutiqueId]);

    const [graph7Jours] = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%d/%m') as date,
        COUNT(*) as nb_ventes,
        COALESCE(SUM(montant_final), 0) as chiffre
      FROM ventes
      WHERE boutique_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%d/%m')
      ORDER BY DATE(created_at) ASC
    `, [boutiqueId]);

    const [repartitionCategories] = await pool.query(`
      SELECT 
        COALESCE(a.type_produit, 'vetement') as type_produit,
        COALESCE(SUM(vd.quantite), 0) as quantite_vendue,
        COALESCE(SUM(vd.prix_unitaire * vd.quantite), 0) as montant_total
      FROM ventes_details vd
      JOIN articles a ON vd.article_id = a.id
      JOIN ventes v ON vd.vente_id = v.id
      WHERE v.boutique_id = ?
      GROUP BY COALESCE(a.type_produit, 'vetement')
    `, [boutiqueId]);

    const [topProduits] = await pool.query(`
      SELECT 
        a.id, a.nom, a.reference,
        COALESCE(SUM(vd.quantite), 0) as quantite_vendue,
        COALESCE(SUM(vd.prix_unitaire * vd.quantite), 0) as total_revenu
      FROM ventes_details vd
      JOIN articles a ON vd.article_id = a.id
      JOIN ventes v ON vd.vente_id = v.id
      WHERE v.boutique_id = ?
      GROUP BY a.id, a.nom, a.reference
      ORDER BY quantite_vendue DESC
      LIMIT 5
    `, [boutiqueId]);

    const [articlesVitesse] = await pool.query(`
      SELECT 
        a.id, a.nom, a.reference, a.quantite_stock,
        COALESCE(SUM(vd.quantite), 0) / 30.0 as vente_moyenne_jour
      FROM articles a
      LEFT JOIN ventes_details vd ON vd.article_id = a.id
      LEFT JOIN ventes v ON vd.vente_id = v.id AND v.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      WHERE a.boutique_id = ? AND a.actif = true
      GROUP BY a.id, a.nom, a.reference, a.quantite_stock
    `, [boutiqueId]);

    const predictionsStock = articlesVitesse
      .map(art => {
        const stock = Number(art.quantite_stock) || 0;
        const vitesseJour = Number(art.vente_moyenne_jour) || 0;
        const joursRestants = vitesseJour > 0 ? Math.round(stock / vitesseJour) : (stock <= 5 ? 0 : 999);

        let niveau = 'normal';
        if (stock <= 5 || joursRestants <= 3) {
          niveau = 'critical';
        } else if (stock <= 10 || joursRestants <= 7) {
          niveau = 'warning';
        }

        return {
          id: art.id,
          nom: art.nom,
          reference: art.reference,
          quantite_stock: stock,
          vitesse_jour: Number(vitesseJour.toFixed(2)),
          jours_restants: joursRestants,
          niveau
        };
      })
      .filter(p => p.niveau === 'critical' || p.niveau === 'warning')
      .sort((a, b) => a.jours_restants - b.jours_restants);

    res.json({
      kpi: {
        total_ventes: Number(salesKpi[0]?.total_ventes || 0),
        chiffre_affaires: Number(salesKpi[0]?.chiffre_affaires || 0),
        benefice_total: Number(beneficeKpi[0]?.benefice_total || 0),
        panier_moyen: Number(salesKpi[0]?.total_ventes > 0 ? (salesKpi[0].chiffre_affaires / salesKpi[0].total_ventes) : 0),
        total_articles: Number(stockKpi[0]?.total_articles || 0),
        valeur_stock: Number(stockKpi[0]?.valeur_stock || 0),
        benefice_potentiel: Number(stockKpi[0]?.benefice_potentiel || 0)
      },
      graph7Jours,
      repartitionCategories,
      topProduits,
      predictionsStock
    });

  } catch (error) {
    console.error('Erreur stats dashboard:', error);
    res.status(500).json({ message: 'Erreur lors du calcul des statistiques: ' + error.message });
  }
});

module.exports = router;