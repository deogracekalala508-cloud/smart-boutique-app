const { pool } = require('../config/database');

async function initialiserTablesAutomatique() {
  try {
    console.log('🔄 Verification et initialisation automatique des tables MySQL...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS boutiques (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(200) NOT NULL,
        proprietaire VARCHAR(200),
        telephone VARCHAR(20),
        email VARCHAR(100),
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS utilisateurs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        mot_de_passe VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'admin', 'gestionnaire', 'vendeur') DEFAULT 'vendeur',
        actif BOOLEAN DEFAULT true,
        boutique_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        reference VARCHAR(50) NOT NULL,
        nom VARCHAR(200) NOT NULL,
        description TEXT,
        prix_achat DECIMAL(10,2) NOT NULL,
        prix_vente DECIMAL(10,2) NOT NULL,
        quantite_stock INT DEFAULT 0,
        type_produit VARCHAR(50) DEFAULT 'vetement',
        taille VARCHAR(20),
        couleur VARCHAR(50),
        boutique_id INT DEFAULT NULL,
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_ref_boutique (reference, boutique_id)
      );
    `);

    try {
      await pool.query("ALTER TABLE articles ADD COLUMN type_produit VARCHAR(50) DEFAULT 'vetement'");
    } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        telephone VARCHAR(20),
        adresse TEXT,
        points_fidelite INT DEFAULT 0,
        date_naissance DATE,
        boutique_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ventes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        numero_facture VARCHAR(50) UNIQUE NOT NULL,
        vendeur_id INT NOT NULL,
        client_id INT,
        montant_total DECIMAL(10,2) NOT NULL,
        montant_final DECIMAL(10,2) NOT NULL,
        mode_paiement VARCHAR(20) DEFAULT 'especes',
        boutique_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ventes_details (
        id INT PRIMARY KEY AUTO_INCREMENT,
        vente_id INT NOT NULL,
        article_id INT NOT NULL,
        quantite INT NOT NULL,
        prix_unitaire DECIMAL(10,2) NOT NULL
      );
    `);

    console.log('✅ Tables MySQL verifiees et pretes !');
    return true;
  } catch (error) {
    console.error('⚠️ Initialisation automatique des tables :', error.message);
    return false;
  }
}

module.exports = { initialiserTablesAutomatique };
