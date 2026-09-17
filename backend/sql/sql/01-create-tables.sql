-- ============================================================
-- Migration 01 : Creation des tables de l'application
-- Smart Boutique App - Support multi-boutique
-- ============================================================

-- Table des boutiques (entite principale pour le support multi-boutique)
CREATE TABLE IF NOT EXISTS boutiques (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  proprietaire VARCHAR(150) NOT NULL,
  telephone VARCHAR(30) DEFAULT NULL,
  email VARCHAR(150) DEFAULT NULL,
  actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table des utilisateurs (rattaches a une boutique)
CREATE TABLE IF NOT EXISTS utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  boutique_id INT DEFAULT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'employe',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_utilisateurs_boutique FOREIGN KEY (boutique_id) REFERENCES boutiques(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table des articles (produits en vente, rattaches a une boutique)
CREATE TABLE IF NOT EXISTS articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  description TEXT DEFAULT NULL,
  prix DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  boutique_id INT DEFAULT NULL,
  categorie VARCHAR(100) DEFAULT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_articles_boutique FOREIGN KEY (boutique_id) REFERENCES boutiques(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table des ventes (rattachees a un utilisateur et a une boutique)
CREATE TABLE IF NOT EXISTS ventes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  montant DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  utilisateur_id INT DEFAULT NULL,
  boutique_id INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ventes_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ventes_boutique FOREIGN KEY (boutique_id) REFERENCES boutiques(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table des clients (rattaches a une boutique)
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  email VARCHAR(150) DEFAULT NULL,
  telephone VARCHAR(30) DEFAULT NULL,
  boutique_id INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clients_boutique FOREIGN KEY (boutique_id) REFERENCES boutiques(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
