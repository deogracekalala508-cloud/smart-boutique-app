const mysql = require('mysql2/promise');

// ===== CONFIGURATION =====
// Remplacez par vos vraies infos Aiven
const AIVEN_CONFIG = {
  host: 'mysql-170b8c89-deogracekalala508-256e.d.aivencloud.com',
  port: 24467,
  user: 'avnadmin',
  password: 'AVNS_CWdJkQDjGX4i23BLTm2',
  database: 'defaultdb',
  ssl: { rejectUnauthorized: false }
};

// Base locale
const LOCAL_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'admin123',
  database: 'gestion_boutique'
};

async function migrer() {
  let localConn, aivenConn;
  try {
    console.log('Connexion aux bases de donnees...\n');
    
    localConn = await mysql.createConnection(LOCAL_CONFIG);
    console.log('Connecte a la base locale');
    
    aivenConn = await mysql.createConnection(AIVEN_CONFIG);
    console.log('Connecte a Aiven\n');
    
    // 1. Recuperer la structure des tables locales
    const [tables] = await localConn.query('SHOW TABLES');
    console.log(tables.length + ' tables trouvees\n');
    
    for (const t of tables) {
      const tableName = Object.values(t)[0];
      console.log('=== Migration de : ' + tableName + ' ===');
      
      // Recuperer la structure
      const [structure] = await localConn.query('SHOW CREATE TABLE `' + tableName + '`');
      const createSQL = structure[0]['Create Table'];
      
      // Supprimer la table sur Aiven si elle existe
      await aivenConn.query('DROP TABLE IF EXISTS `' + tableName + '`');
      
      // Creer la table sur Aiven
      await aivenConn.query(createSQL);
      console.log('  Table creee');
      
      // Recuperer les donnees
      const [rows] = await localConn.query('SELECT * FROM `' + tableName + '`');
      
      if (rows.length > 0) {
        // Inserer les donnees par lots
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const insertSQL = 'INSERT INTO `' + tableName + '` (' + columns.map(c => '`' + c + '`').join(', ') + ') VALUES (' + placeholders + ')';
        
        for (const row of rows) {
          const values = columns.map(c => row[c]);
          await aivenConn.query(insertSQL, values);
        }
        console.log('  ' + rows.length + ' lignes inserees');
      }
      
      console.log('');
    }
    
    console.log('Migration terminee avec succes !');
    
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    if (localConn) await localConn.end();
    if (aivenConn) await aivenConn.end();
  }
}

migrer();