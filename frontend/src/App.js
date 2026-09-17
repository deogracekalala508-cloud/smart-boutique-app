import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://smart-boutique-app-production-bbdb.up.railway.app/api';

const TYPES_PRODUITS = {
  vetement: { label: 'Vêtement / Textile', attr1: 'Taille', attr2: 'Couleur' },
  telephone: { label: 'Téléphone / Mobile', attr1: 'Modèle', attr2: 'Couleur' },
  accessoire: { label: 'Accessoire', attr1: 'Type', attr2: 'Couleur' },
  machine: { label: 'Machine / Équipement', attr1: 'Modèle', attr2: 'Référence' },
  chaussure: { label: 'Chaussure', attr1: 'Pointure', attr2: 'Couleur' },
  autre: { label: 'Autre produit', attr1: 'Attribut 1', attr2: 'Attribut 2' }
};

function App() {
  const [chargement, setChargement] = useState(true);
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [connecte, setConnecte] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  
  const [ongletActif, setOngletActif] = useState('dashboard');
  const [articles, setArticles] = useState([]);
  const [ventesJour, setVentesJour] = useState(null);
  const [panier, setPanier] = useState([]);
  const [articleSelectionne, setArticleSelectionne] = useState('');
  const [quantiteVente, setQuantiteVente] = useState(1);
  const [derniereFacture, setDerniereFacture] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [historiqueVentes, setHistoriqueVentes] = useState([]);
  const [venteDetail, setVenteDetail] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientDetail, setClientDetail] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [nouveauClient, setNouveauClient] = useState({
    nom: '', email: '', telephone: '', adresse: '', date_naissance: ''
  });
  const [nouvelArticle, setNouvelArticle] = useState({
    reference: '', nom: '', description: '', prix_achat: '',
    prix_vente: '', quantite_stock: '', type_produit: 'vetement', taille: '', couleur: ''
  });
  const [vendeurs, setVendeurs] = useState([]);
  const [nouveauVendeur, setNouveauVendeur] = useState({ nom: '', email: '', mot_de_passe: '' });
  
  const [modeInscription, setModeInscription] = useState(false);
  const [nomBoutique, setNomBoutique] = useState('');
  const [nomAdmin, setNomAdmin] = useState('');
  const [telephone, setTelephone] = useState('');
  const [motDePasseConfirm, setMotDePasseConfirm] = useState('');
  const [boutiques, setBoutiques] = useState([]);

  // États pour les fonctionnalités avancées
  const [statsDashboard, setStatsDashboard] = useState(null);
  const [showAbonnement, setShowAbonnement] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Restauration de session au montage
  useEffect(() => {
    const tokenStocke = localStorage.getItem('token');
    const userStocke = localStorage.getItem('user');

    if (tokenStocke && userStocke) {
      try {
        const userObjet = JSON.parse(userStocke);
        setToken(tokenStocke);
        setUser(userObjet);
        setConnecte(true);
        if (userObjet.role === 'vendeur') {
          setOngletActif('vente');
        } else if (userObjet.role === 'super_admin') {
          setOngletActif('boutiques');
        } else {
          setOngletActif('dashboard');
        }
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setChargement(false);
  }, []);

  useEffect(() => {
    if (connecte && user) {
      if (user.role === 'admin') {
        chargerArticles();
        chargerVentesJour();
        chargerHistoriqueVentes();
        chargerClients();
        chargerVendeurs();
        chargerStatsDashboard();
      }
      if (user.role === 'vendeur') {
        chargerArticles();
      }
      if (user.role === 'super_admin') {
        chargerBoutiques();
      }
    }
  }, [connecte]);

  const chargerArticles = async () => {
    try {
      const response = await axios.get(API_URL + '/articles', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setArticles(response.data);
    } catch (error) {
      console.error('Erreur chargement articles:', error);
    }
  };

  const chargerVentesJour = async () => {
    try {
      const response = await axios.get(API_URL + '/ventes/aujourdhui', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setVentesJour(response.data);
    } catch (error) {
      console.error('Erreur chargement ventes:', error);
    }
  };

  const chargerHistoriqueVentes = async () => {
    try {
      const response = await axios.get(API_URL + '/ventes/historique', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setHistoriqueVentes(response.data);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  const chargerClients = async () => {
    try {
      const response = await axios.get(API_URL + '/clients', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const chargerBoutiques = async () => {
    try {
      const response = await axios.get(API_URL + '/boutiques/toutes', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setBoutiques(response.data);
    } catch (error) {
      console.error('Erreur chargement boutiques:', error);
    }
  };

  const chargerVendeurs = async () => {
    try {
      const response = await axios.get(API_URL + '/boutiques/vendeurs', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setVendeurs(response.data);
    } catch (error) {
      console.error('Erreur chargement vendeurs:', error);
    }
  };

  const chargerStatsDashboard = async () => {
    try {
      const response = await axios.get(API_URL + '/ventes/stats-dashboard', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setStatsDashboard(response.data);
    } catch (error) {
      console.error('Erreur stats dashboard:', error);
    }
  };

  const handleInscriptionDirecte = async () => {
    if (!nomBoutique || !nomAdmin || !email || !motDePasse) {
      setMessage('Tous les champs obligatoires doivent être remplis');
      return;
    }
    
    if (motDePasse !== motDePasseConfirm) {
      setMessage('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (motDePasse.length < 8) {
      setMessage('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    try {
      const response = await axios.post(API_URL + '/boutiques/inscription-directe', {
        nom_boutique: nomBoutique,
        nom_admin: nomAdmin,
        email_admin: email,
        telephone: telephone,
        mot_de_passe: motDePasse
      });
      
      alert('Félicitations ! Votre boutique a été créée avec succès !');
      setUser(response.data.user);
      setToken(response.data.token);
      setConnecte(true);
      setMessage('');
      setOngletActif('dashboard');
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
    } catch (error) {
      setMessage(error.response ? error.response.data.message : 'Erreur lors de la création de la boutique');
    }
  };

  const handleLogin = async () => {
    if (!email || !motDePasse) {
      setMessage('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      const response = await axios.post(API_URL + '/auth/login', {
        email: email, mot_de_passe: motDePasse
      });
      
      setUser(response.data.user);
      setToken(response.data.token);
      setConnecte(true);
      setMessage('');
      
      if (response.data.user.role === 'vendeur') {
        setOngletActif('vente');
      } else if (response.data.user.role === 'super_admin') {
        setOngletActif('boutiques');
      } else {
        setOngletActif('dashboard');
      }
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || 'Email ou mot de passe incorrect');
      } else {
        setMessage('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
      }
    }
  };

  const handleLogout = () => {
    setConnecte(false);
    setUser(null);
    setToken('');
    setEmail('');
    setMotDePasse('');
    setOngletActif('vente');
    setArticles([]);
    setPanier([]);
    setDerniereFacture(null);
    setShowSuccess(false);
    setHistoriqueVentes([]);
    setShowDetails(false);
    setShowClientDetails(false);
    setBoutiques([]);
    setVendeurs([]);
    setStatsDashboard(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleAjouterArticle = async () => {
    try {
      await axios.post(API_URL + '/articles', nouvelArticle, {
        headers: { Authorization: 'Bearer ' + token }
      });
      alert('Article ajouté !');
      setNouvelArticle({
        reference: '', nom: '', description: '', prix_achat: '',
        prix_vente: '', quantite_stock: '', type_produit: 'vetement', taille: '', couleur: ''
      });
      chargerArticles();
      if (user.role === 'admin') chargerStatsDashboard();
    } catch (error) {
      alert('Erreur : ' + (error.response ? error.response.data.message : 'Erreur ajout'));
    }
  };

  const handleSupprimerArticle = async (id) => {
    if (window.confirm('Supprimer cet article ?')) {
      try {
        await axios.delete(API_URL + '/articles/' + id, {
          headers: { Authorization: 'Bearer ' + token }
        });
        chargerArticles();
        if (user.role === 'admin') chargerStatsDashboard();
      } catch (error) {
        alert('Erreur');
      }
    }
  };

  const handleAjouterVendeur = async () => {
    if (!nouveauVendeur.nom || !nouveauVendeur.email || !nouveauVendeur.mot_de_passe) {
      alert('Tous les champs du vendeur sont obligatoires');
      return;
    }
    if (nouveauVendeur.mot_de_passe.length < 8) {
      alert('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    try {
      await axios.post(API_URL + '/boutiques/creer-vendeur', nouveauVendeur, {
        headers: { Authorization: 'Bearer ' + token }
      });
      alert('Vendeur créé avec succès !');
      setNouveauVendeur({ nom: '', email: '', mot_de_passe: '' });
      chargerVendeurs();
    } catch (error) {
      alert('Erreur : ' + (error.response ? error.response.data.message : 'Erreur ajout vendeur'));
    }
  };

  const handleDesactiverVendeur = async (id) => {
    if (window.confirm('Désactiver ce vendeur ?')) {
      try {
        await axios.delete(API_URL + '/boutiques/vendeur/' + id, {
          headers: { Authorization: 'Bearer ' + token }
        });
        alert('Vendeur désactivé');
        chargerVendeurs();
      } catch (error) {
        alert('Erreur');
      }
    }
  };

  const handleSupprimerBoutique = async (id) => {
    if (window.confirm('Désactiver cette boutique ?')) {
      try {
        await axios.delete(API_URL + '/boutiques/' + id, {
          headers: { Authorization: 'Bearer ' + token }
        });
        alert('Boutique désactivée');
        chargerBoutiques();
      } catch (error) {
        alert('Erreur');
      }
    }
  };

  const handleReactiverBoutique = async (id) => {
    if (window.confirm('Réactiver cette boutique ?')) {
      try {
        await axios.put(API_URL + '/boutiques/' + id + '/reactiver', {}, {
          headers: { Authorization: 'Bearer ' + token }
        });
        alert('Boutique réactivée');
        chargerBoutiques();
      } catch (error) {
        alert('Erreur');
      }
    }
  };

  const handleAjouterClient = async () => {
    if (!nouveauClient.nom) {
      alert('Le nom du client est obligatoire');
      return;
    }
    try {
      await axios.post(API_URL + '/clients', nouveauClient, {
        headers: { Authorization: 'Bearer ' + token }
      });
      alert('Client ajouté !');
      setNouveauClient({ nom: '', email: '', telephone: '', adresse: '', date_naissance: '' });
      chargerClients();
    } catch (error) {
      alert('Erreur');
    }
  };

  const handleSupprimerClient = async (id) => {
    if (window.confirm('Supprimer ce client ?')) {
      try {
        await axios.delete(API_URL + '/clients/' + id, {
          headers: { Authorization: 'Bearer ' + token }
        });
        chargerClients();
      } catch (error) {
        alert('Erreur');
      }
    }
  };

  const handleAjouterAuPanier = () => {
    if (!articleSelectionne || quantiteVente < 1) {
      alert('Sélectionnez un article et une quantité valide');
      return;
    }
    const article = articles.find(a => a.id === parseInt(articleSelectionne));
    if (!article) { alert('Article introuvable'); return; }
    
    const dansPanier = panier.find(item => item.article_id === article.id);
    if (dansPanier) {
      setPanier(panier.map(item => item.article_id === article.id ? Object.assign({}, item, {quantite: item.quantite + quantiteVente}) : item));
    } else {
      setPanier(panier.concat([{ article_id: article.id, nom: article.nom, prix_vente: article.prix_vente, quantite: quantiteVente }]));
    }
    setArticleSelectionne('');
    setQuantiteVente(1);
  };

  const handleRetirerDuPanier = (articleId) => {
    setPanier(panier.filter(item => item.article_id !== articleId));
  };

  const handleValiderVente = async () => {
    if (panier.length === 0) { alert('Le panier est vide'); return; }
    try {
      const response = await axios.post(API_URL + '/ventes', {
        articles: panier, mode_paiement: 'especes', devise: 'CDF'
      }, { headers: { Authorization: 'Bearer ' + token } });
      
      setDerniereFacture(response.data.vente);
      setShowSuccess(true);
      setPanier([]);
      chargerArticles();
      if (user.role === 'admin') {
        chargerVentesJour();
        chargerHistoriqueVentes();
        chargerStatsDashboard();
      }
    } catch (error) {
      alert(error.response ? error.response.data.message : 'Erreur');
    }
  };

  const handleImprimerFacture = (numeroFacture) => {
    const url = API_URL + '/ventes/facture-html/' + numeroFacture + '?token=' + token;
    const win = window.open(url, '_blank', 'width=600,height=800');
    if (!win) alert('Veuillez autoriser les pop-ups');
  };

  const handleRapportStock = async () => {
    try {
      const response = await axios.get(API_URL + '/articles/rapport-pdf', {
        headers: { Authorization: 'Bearer ' + token },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'stock.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      alert('Rapport téléchargé !');
    } catch (error) {
      alert('Erreur');
    }
  };

  const totalPanier = panier.reduce((total, item) => total + (item.prix_vente * item.quantite), 0);
  const predictionsCount = statsDashboard?.predictionsStock?.length || 0;

  if (chargement) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a237e 0%, #4a148c 100%)', color: 'white', fontFamily: 'Arial' }}>
        <h2 style={{ fontSize: '24px' }}>Chargement de Smart Boutique...</h2>
      </div>
    );
  }

  // ECRAN NON CONNECTE (LOGIN OU INSCRIPTION INSTANTANEE 1-CLICK)
  if (!connecte) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', fontFamily: 'Arial, sans-serif', padding: '20px' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', width: '450px', maxWidth: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <span style={{ fontSize: '48px' }}>🏪</span>
            <h1 style={{ color: '#1e1b4b', margin: '10px 0 5px 0', fontSize: '28px' }}>Smart Boutique</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Gestion Commerciale, Stocks & Prédictions IA</p>
          </div>

          <h2 style={{ color: '#334155', textAlign: 'center', fontSize: '18px', marginBottom: '20px' }}>
            {modeInscription ? 'Créer une boutique (1-Click)' : 'Connexion à votre espace'}
          </h2>
          
          {!modeInscription ? (
            <div>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '14px', margin: '8px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Mot de passe" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} style={{ width: '100%', padding: '14px', margin: '8px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }} />
              <button onClick={handleLogin} style={{ width: '100%', padding: '14px', background: 'linear-gradient(90deg, #1e1b4b 0%, #4338ca 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', marginTop: '15px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(67, 56, 202, 0.4)' }}>Se connecter</button>
            </div>
          ) : (
            <div>
              <input type="text" placeholder="Nom de votre boutique" value={nomBoutique} onChange={(e) => setNomBoutique(e.target.value)} style={{ width: '100%', padding: '12px', margin: '6px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Votre nom complet (Admin)" value={nomAdmin} onChange={(e) => setNomAdmin(e.target.value)} style={{ width: '100%', padding: '12px', margin: '6px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', margin: '6px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <input type="tel" placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} style={{ width: '100%', padding: '12px', margin: '6px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Mot de passe (8+ car.)" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} style={{ width: '100%', padding: '12px', margin: '6px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Confirmer mot de passe" value={motDePasseConfirm} onChange={(e) => setMotDePasseConfirm(e.target.value)} style={{ width: '100%', padding: '12px', margin: '6px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <button onClick={handleInscriptionDirecte} style={{ width: '100%', padding: '14px', background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', marginTop: '12px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}>Créer ma boutique instantanément 🚀</button>
            </div>
          )}
          
          {message && (
            <p style={{ color: '#ef4444', marginTop: '15px', textAlign: 'center', fontSize: '14px', padding: '10px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>{message}</p>
          )}
          
          <p style={{ marginTop: '20px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
            {modeInscription ? 'Déjà un compte ?' : 'Nouvelle boutique ?'}
            <button onClick={() => { setModeInscription(!modeInscription); setMessage(''); }} style={{ background: 'none', border: 'none', color: '#4338ca', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginLeft: '5px' }}>
              {modeInscription ? 'Se connecter' : 'Créer un compte instantané'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // SUPER ADMIN VIEW
  if (user && user.role === 'super_admin') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
        <nav style={{ background: '#1e1b4b', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>👑 Smart Boutique - Super Admin</h2>
          <div>
            <span style={{ marginRight: '15px', fontWeight: 'bold' }}>{user.nom}</span>
            <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Déconnexion</button>
          </div>
        </nav>
        <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
          <h2>Toutes les boutiques inscrites ({boutiques.length})</h2>
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', marginTop: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
            {boutiques.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Aucune boutique pour le moment</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1e1b4b', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Propriétaire</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Statut</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {boutiques.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px' }}>{b.id}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{b.nom}</td>
                      <td style={{ padding: '10px' }}>{b.proprietaire || '-'}</td>
                      <td style={{ padding: '10px' }}>{b.email || '-'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: b.actif ? '#dcfce7' : '#fee2e2', color: b.actif ? '#15803d' : '#b91c1c' }}>
                          {b.actif ? 'Actif' : 'Désactivé'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {b.actif ? (
                          <button onClick={() => handleSupprimerBoutique(b.id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Désactiver</button>
                        ) : (
                          <button onClick={() => handleReactiverBoutique(b.id)} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Réactiver</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    );
  }

  // VENDEUR VIEW
  if (user && user.role === 'vendeur') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ background: '#1e1b4b', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '20px' }}>🏪 Smart Boutique ({user.nom_boutique})</h1>
          <div>
            <span style={{ marginRight: '15px', fontWeight: 'bold' }}>👤 {user.nom} (Vendeur)</span>
            <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Déconnexion</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', color: '#1e1b4b' }}>Sélectionner l'article</h2>
            <select value={articleSelectionne} onChange={(e) => setArticleSelectionne(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px' }}>
              <option value="">-- Choisir un article --</option>
              {articles.map(article => (
                <option key={article.id} value={article.id}>{article.nom} - {article.prix_vente} CDF (Stock: {article.quantite_stock})</option>
              ))}
            </select>
            <input type="number" placeholder="Quantité" value={quantiteVente} onChange={(e) => setQuantiteVente(parseInt(e.target.value))} min="1" style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }} />
            <button onClick={handleAjouterAuPanier} style={{ width: '100%', padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>Ajouter au panier</button>
          </div>
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', color: '#1e1b4b' }}>Panier de vente</h2>
            {panier.length === 0 && !showSuccess ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '50px' }}>Votre panier est vide</p>
            ) : panier.length > 0 ? (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Article</th>
                      <th style={{ textAlign: 'center', padding: '8px' }}>Qté</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {panier.map(item => (
                      <tr key={item.article_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px' }}>{item.nom}</td>
                        <td style={{ textAlign: 'center', padding: '8px' }}>{item.quantite}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{item.prix_vente * item.quantite} CDF</td>
                        <td style={{ textAlign: 'center', padding: '8px' }}>
                          <button onClick={() => handleRetirerDuPanier(item.article_id)} style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>X</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
                  <h2 style={{ fontSize: '28px', color: '#1e1b4b', margin: '0 0 15px 0' }}>{totalPanier} CDF</h2>
                  <button onClick={handleValiderVente} style={{ width: '100%', padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>VALIDER LA VENTE</button>
                </div>
              </div>
            ) : null}
            {showSuccess && derniereFacture && (
              <div style={{ background: '#dcfce7', padding: '20px', borderRadius: '10px', marginTop: '20px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                <h3 style={{ color: '#15803d', margin: '0 0 10px 0' }}>✅ VENTE RÉUSSIE</h3>
                <p><strong>N° Facture :</strong> {derniereFacture.numero_facture}</p>
                <button onClick={() => handleImprimerFacture(derniereFacture.numero_facture)} style={{ width: '100%', padding: '12px', background: '#1e1b4b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }}>Imprimer la facture</button>
                <button onClick={() => setShowSuccess(false)} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', marginTop: '10px' }}>Fermer</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ADMIN VIEW (FULL FEATURED DASHBOARD WITH SVG CHARTS & PREDICTIVE NOTIFICATIONS)
  const typeActuel = nouvelArticle.type_produit || 'vetement';
  const attr1Label = TYPES_PRODUITS[typeActuel]?.attr1 || 'Attribut 1';
  const attr2Label = TYPES_PRODUITS[typeActuel]?.attr2 || 'Attribut 2';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
      {/* BARRE DE NAVIGATION PRINCIPALE */}
      <nav style={{ background: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)', color: 'white', padding: '12px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🏪</span>
          <h2 style={{ margin: 0, fontSize: '20px', letterSpacing: '0.5px' }}>Smart Boutique</h2>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setOngletActif('dashboard')} style={{ padding: '8px 16px', background: ongletActif === 'dashboard' ? '#fbbf24' : 'transparent', color: ongletActif === 'dashboard' ? '#1e1b4b' : 'white', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}>📊 Tableau de bord</button>
          <button onClick={() => setOngletActif('articles')} style={{ padding: '8px 16px', background: ongletActif === 'articles' ? '#fbbf24' : 'transparent', color: ongletActif === 'articles' ? '#1e1b4b' : 'white', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}>📦 Articles</button>
          <button onClick={() => setOngletActif('vente')} style={{ padding: '8px 16px', background: ongletActif === 'vente' ? '#fbbf24' : 'transparent', color: ongletActif === 'vente' ? '#1e1b4b' : 'white', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}>🛒 Vente</button>
          <button onClick={() => { setOngletActif('historique'); chargerHistoriqueVentes(); }} style={{ padding: '8px 16px', background: ongletActif === 'historique' ? '#fbbf24' : 'transparent', color: ongletActif === 'historique' ? '#1e1b4b' : 'white', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}>📜 Historique</button>
          <button onClick={() => { setOngletActif('clients'); chargerClients(); }} style={{ padding: '8px 16px', background: ongletActif === 'clients' ? '#fbbf24' : 'transparent', color: ongletActif === 'clients' ? '#1e1b4b' : 'white', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}>👥 Clients</button>
          <button onClick={() => { setOngletActif('vendeurs'); chargerVendeurs(); }} style={{ padding: '8px 16px', background: ongletActif === 'vendeurs' ? '#fbbf24' : 'transparent', color: ongletActif === 'vendeurs' ? '#1e1b4b' : 'white', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}>👔 Vendeurs</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* BOUTON PRÉDICTIONS / NOTIFICATIONS 🔔 */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: '#3730a3', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}
            >
              🔔 Notifications
              {predictionsCount > 0 && (
                <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 7px', fontSize: '11px', fontWeight: 'bold' }}>
                  {predictionsCount}
                </span>
              )}
            </button>

            {/* POPOVER DES NOTIFICATIONS PRÉDICTIVES IA */}
            {showNotifications && (
              <div style={{ position: 'absolute', top: '45px', right: 0, width: '340px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', padding: '15px', zIndex: 1000, border: '1px solid #e2e8f0', color: '#1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#1e1b4b' }}>🤖 Alertes Prédictives Stock IA</h4>
                  <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>X</button>
                </div>
                {predictionsCount === 0 ? (
                  <p style={{ color: '#10b981', fontSize: '13px', margin: '10px 0', textAlign: 'center' }}>✅ Vos stocks sont à un niveau optimal !</p>
                ) : (
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {statsDashboard?.predictionsStock?.map(pred => (
                      <div key={pred.id} style={{ background: pred.niveau === 'critical' ? '#fef2f2' : '#fffbe5', padding: '10px', borderRadius: '8px', marginBottom: '8px', borderLeft: `4px solid ${pred.niveau === 'critical' ? '#ef4444' : '#f59e0b'}` }}>
                        <strong style={{ fontSize: '13px', color: '#1e293b' }}>{pred.nom}</strong> ({pred.reference})
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
                          Stock actuel: <strong>{pred.quantite_stock}</strong> | Rupture estimée dans: <strong style={{ color: pred.niveau === 'critical' ? '#dc2626' : '#d97706' }}>{pred.jours_restants === 0 ? 'Imminente (< 1 jour)' : `${pred.jours_restants} jours`}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BOUTON SOUSCRIPTION / ABONNEMENT MOBILE MONEY */}
          <button 
            onClick={() => setShowAbonnement(true)}
            style={{ background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            💳 Abonnement / Support
          </button>

          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{user ? user.nom : ''}</span>
          <button onClick={handleLogout} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Déconnexion</button>
        </div>
      </nav>

      {/* CONTENU PRINCIPAL DE L'APPLICATION */}
      <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* ONGLET DASHBOARD STATISTIQUES & GRAPHIQUES */}
        {ongletActif === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1e1b4b' }}>📊 Tableau de Bord & Graphiques Analytiques</h2>
              <button onClick={chargerStatsDashboard} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Actualiser</button>
            </div>

            {/* CARTES KPIS FINANCIERS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderLeft: '5px solid #3b82f6' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>CHIFFRE D'AFFAIRES TOTAL</span>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e1b4b', margin: '8px 0 0 0' }}>
                  {statsDashboard ? statsDashboard.kpi.chiffre_affaires.toFixed(0) : 0} CDF
                </p>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderLeft: '5px solid #10b981' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>BÉNÉFICE NET ESTIMÉ</span>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', margin: '8px 0 0 0' }}>
                  {statsDashboard ? statsDashboard.kpi.benefice_total.toFixed(0) : 0} CDF
                </p>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderLeft: '5px solid #f59e0b' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>PANIER MOYEN</span>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', margin: '8px 0 0 0' }}>
                  {statsDashboard ? statsDashboard.kpi.panier_moyen.toFixed(0) : 0} CDF
                </p>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderLeft: '5px solid #8b5cf6' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>VALEUR TOTALE STOCK</span>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6', margin: '8px 0 0 0' }}>
                  {statsDashboard ? statsDashboard.kpi.valeur_stock.toFixed(0) : 0} CDF
                </p>
              </div>
            </div>

            {/* SECTION GRAPHIQUES DYNAMIQUES EN SVG */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              
              {/* GRAPHIQUE 1 : ÉVOLUTION DES VENTES SUR 7 JOURS */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1e1b4b', fontSize: '16px' }}>📈 Évolution des ventes (7 derniers jours)</h3>
                {statsDashboard?.graph7Jours?.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Aucune donnée de vente récente</p>
                ) : (
                  <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '15px', paddingTop: '20px', borderBottom: '2px solid #cbd5e1' }}>
                    {statsDashboard?.graph7Jours?.map((item, idx) => {
                      const maxChiffre = Math.max(...statsDashboard.graph7Jours.map(g => Number(g.chiffre) || 1));
                      const hauteurPourcent = Math.max(15, Math.round((Number(item.chiffre) / maxChiffre) * 100));
                      return (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '10px', color: '#475569', marginBottom: '4px', fontWeight: 'bold' }}>
                            {Number(item.chiffre) > 0 ? `${(Number(item.chiffre)/1000).toFixed(0)}k` : '0'}
                          </span>
                          <div 
                            style={{ 
                              width: '80%', 
                              height: `${hauteurPourcent}%`, 
                              background: 'linear-gradient(180deg, #6366f1 0%, #312e81 100%)', 
                              borderRadius: '6px 6px 0 0',
                              transition: 'height 0.5s ease'
                            }} 
                            title={`${item.date}: ${item.chiffre} CDF (${item.nb_ventes} ventes)`}
                          />
                          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: 'bold' }}>{item.date}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* GRAPHIQUE 2 : RÉPARTITION DES VENTES PAR TYPE DE PRODUIT */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1e1b4b', fontSize: '16px' }}>🍩 Répartition par Type de Produit</h3>
                {statsDashboard?.repartitionCategories?.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Aucune vente enregistrée par catégorie</p>
                ) : (
                  <div>
                    {statsDashboard?.repartitionCategories?.map((cat, i) => {
                      const totalMontant = statsDashboard.repartitionCategories.reduce((acc, curr) => acc + Number(curr.montant_total), 0) || 1;
                      const pourcent = Math.round((Number(cat.montant_total) / totalMontant) * 100);
                      const couleurs = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];
                      const couleur = couleurs[i % couleurs.length];
                      const label = TYPES_PRODUITS[cat.type_produit]?.label || cat.type_produit;

                      return (
                        <div key={i} style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                            <span><strong style={{ color: couleur }}>■</strong> {label} ({cat.quantite_vendue} vendus)</span>
                            <strong>{pourcent}% ({Number(cat.montant_total).toFixed(0)} CDF)</strong>
                          </div>
                          <div style={{ width: '100%', background: '#f1f5f9', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ width: `${pourcent}%`, background: couleur, height: '100%', borderRadius: '5px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* TOP 5 ARTICLES & BANNIÈRE PRÉDICTIVE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
              
              {/* TOP 5 PRODUITS LES PLUS VENDUS */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1e1b4b', fontSize: '16px' }}>🏆 Top 5 Produits les Plus Vendus</h3>
                {statsDashboard?.topProduits?.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Pas encore de ventes</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#475569', fontSize: '12px' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Produit</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Quantité Vendue</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Revenu Généré</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsDashboard?.topProduits?.map((prod, idx) => (
                        <tr key={prod.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px', fontSize: '13px', fontWeight: 'bold' }}>#{idx+1} {prod.nom}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontSize: '13px' }}>{prod.quantite_vendue}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', color: '#10b981', fontWeight: 'bold' }}>{Number(prod.total_revenu).toFixed(0)} CDF</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* SECTION PRÉDICTIONS DE RUPTURE DE STOCK */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1e1b4b', fontSize: '16px' }}>🤖 Prédictions IA de Rupture de Stock</h3>
                {predictionsCount === 0 ? (
                  <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#047857' }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>✅ Excellent ! Vos stocks sont suffisants et stables.</p>
                  </div>
                ) : (
                  <div>
                    {statsDashboard?.predictionsStock?.map(pred => (
                      <div key={pred.id} style={{ background: pred.niveau === 'critical' ? '#fef2f2' : '#fffbe5', padding: '12px', borderRadius: '8px', marginBottom: '10px', border: `1px solid ${pred.niveau === 'critical' ? '#fecaca' : '#fef08a'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '14px', color: '#1e293b' }}>{pred.nom}</strong>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', background: pred.niveau === 'critical' ? '#ef4444' : '#f59e0b', color: 'white' }}>
                            {pred.niveau === 'critical' ? 'CRITIQUE' : 'ATTENTION'}
                          </span>
                        </div>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#475569' }}>
                          Stock restant: <strong>{pred.quantite_stock}</strong> | Vitesse: <strong>{pred.vitesse_jour} ventes/jour</strong>
                        </p>
                        <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: pred.niveau === 'critical' ? '#dc2626' : '#d97706', fontWeight: 'bold' }}>
                          ⏱️ Rupture estimée dans: {pred.jours_restants === 0 ? 'Moins de 24 heures !' : `${pred.jours_restants} jours`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ONGLET ARTICLES */}
        {ongletActif === 'articles' && (
          <div>
            <h2>Gestion des articles</h2>
            <button onClick={handleRapportStock} style={{ padding: '12px 25px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>Télécharger Rapport PDF</button>
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3>Ajouter un article</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <select
                  value={typeActuel}
                  onChange={(e) => setNouvelArticle(Object.assign({}, nouvelArticle, { type_produit: e.target.value }))}
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', fontWeight: 'bold' }}
                >
                  {Object.entries(TYPES_PRODUITS).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
                <input placeholder="Référence" value={nouvelArticle.reference} onChange={(e) => setNouvelArticle(Object.assign({}, nouvelArticle, {reference: e.target.value}))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Nom du produit" value={nouvelArticle.nom} onChange={(e) => setNouvelArticle(Object.assign({}, nouvelArticle, {nom: e.target.value}))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Prix d'achat (CDF)" type="number" value={nouvelArticle.prix_achat} onChange={(e) => setNouvelArticle(Object.assign({}, nouvelArticle, {prix_achat: e.target.value}))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Prix de vente (CDF)" type="number" value={nouvelArticle.prix_vente} onChange={(e) => setNouvelArticle(Object.assign({}, nouvelArticle, {prix_vente: e.target.value}))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Quantité en stock" type="number" value={nouvelArticle.quantite_stock} onChange={(e) => setNouvelArticle(Object.assign({}, nouvelArticle, {quantite_stock: e.target.value}))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder={attr1Label} value={nouvelArticle.taille} onChange={(e) => setNouvelArticle(Object.assign({}, nouvelArticle, {taille: e.target.value}))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder={attr2Label} value={nouvelArticle.couleur} onChange={(e) => setNouvelArticle(Object.assign({}, nouvelArticle, {couleur: e.target.value}))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <button onClick={handleAjouterArticle} style={{ width: '100%', padding: '12px', background: '#1e1b4b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '15px', fontWeight: 'bold' }}>Ajouter l'article</button>
            </div>
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3>Articles en stock ({articles.length})</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Référence</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Nom</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>Prix achat</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>Prix vente</th>
                    <th style={{ textAlign: 'center', padding: '10px' }}>Stock</th>
                    <th style={{ textAlign: 'center', padding: '10px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map(article => (
                    <tr key={article.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>{article.reference}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{article.nom}</td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>{article.prix_achat} CDF</td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>{article.prix_vente} CDF</td>
                      <td style={{ textAlign: 'center', padding: '8px', color: article.quantite_stock <= 5 ? 'red' : 'green', fontWeight: 'bold' }}>{article.quantite_stock}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <button onClick={() => handleSupprimerArticle(article.id)} style={{ padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Suppr</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ONGLET VENDEURS */}
        {ongletActif === 'vendeurs' && (
          <div>
            <h2>Gestion des vendeurs</h2>
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3>Ajouter un vendeur</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <input placeholder="Nom du vendeur" value={nouveauVendeur.nom} onChange={(e) => setNouveauVendeur(Object.assign({}, nouveauVendeur, {nom: e.target.value}))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Email" type="email" value={nouveauVendeur.email} onChange={(e) => setNouveauVendeur(Object.assign({}, nouveauVendeur, {email: e.target.value}))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Mot de passe (8+ car.)" type="password" value={nouveauVendeur.mot_de_passe} onChange={(e) => setNouveauVendeur(Object.assign({}, nouveauVendeur, {mot_de_passe: e.target.value}))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <button onClick={handleAjouterVendeur} style={{ width: '100%', padding: '12px', background: '#1e1b4b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '15px', fontWeight: 'bold' }}>Créer le vendeur</button>
            </div>
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3>Liste des vendeurs ({vendeurs.length})</h3>
              {vendeurs.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Aucun vendeur</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1e1b4b', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Statut</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendeurs.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{v.nom}</td>
                        <td style={{ padding: '10px' }}>{v.email}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: v.actif ? '#dcfce7' : '#fee2e2', color: v.actif ? '#15803d' : '#b91c1c' }}>
                            {v.actif ? 'Actif' : 'Désactivé'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {v.actif && (
                            <button onClick={() => handleDesactiverVendeur(v.id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Désactiver</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ONGLET HISTORIQUE */}
        {ongletActif === 'historique' && (
          <div>
            <h2>Historique des Ventes</h2>
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', overflowX: 'auto', marginTop: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              {historiqueVentes.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Aucune vente enregistrée</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1e1b4b', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Facture</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Vendeur</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Montant</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historiqueVentes.map(vente => (
                      <tr key={vente.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{vente.numero_facture}</td>
                        <td style={{ padding: '10px' }}>{new Date(vente.created_at).toLocaleString('fr-FR')}</td>
                        <td style={{ padding: '10px' }}>{vente.vendeur_nom}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#1e1b4b' }}>{Number(vente.montant_final).toFixed(0)} CDF</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button onClick={() => voirDetailsVente(vente.id)} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Détails</button>
                          <button onClick={() => handleImprimerFacture(vente.numero_facture)} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: '5px' }}>Imprimer</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ONGLET CLIENTS */}
        {ongletActif === 'clients' && (
          <div>
            <h2>Gestion des Clients</h2>
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3>Ajouter un client</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <input placeholder="Nom du client" value={nouveauClient.nom} onChange={(e) => setNouveauClient(Object.assign({}, nouveauClient, {nom: e.target.value}))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Email" value={nouveauClient.email} onChange={(e) => setNouveauClient(Object.assign({}, nouveauClient, {email: e.target.value}))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Téléphone" value={nouveauClient.telephone} onChange={(e) => setNouveauClient(Object.assign({}, nouveauClient, {telephone: e.target.value}))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Date naissance" type="date" value={nouveauClient.date_naissance} onChange={(e) => setNouveauClient(Object.assign({}, nouveauClient, {date_naissance: e.target.value}))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <button onClick={handleAjouterClient} style={{ width: '100%', padding: '12px', background: '#1e1b4b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '15px' }}>Ajouter le client</button>
            </div>
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3>Liste des clients ({clients.length})</h3>
              {clients.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Aucun client</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1e1b4b', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Téléphone</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Nombre d'achats</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Total dépensé</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{client.nom}</td>
                        <td style={{ padding: '10px' }}>{client.telephone || '-'}</td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>{client.nombre_achats || 0}</td>
                        <td style={{ textAlign: 'right', padding: '10px', color: '#1e1b4b', fontWeight: 'bold' }}>{Number(client.total_achats || 0).toFixed(0)} CDF</td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <button onClick={() => voirDetailsClient(client.id)} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Détails</button>
                          <button onClick={() => handleSupprimerClient(client.id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: '5px' }}>Suppr</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ONGLET VENTE */}
        {ongletActif === 'vente' && (
          <div>
            <h2>Nouvelle vente</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px' }}>
              <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3>Ajouter un article au panier</h3>
                <select value={articleSelectionne} onChange={(e) => setArticleSelectionne(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px' }}>
                  <option value="">-- Choisir un article --</option>
                  {articles.map(article => (
                    <option key={article.id} value={article.id}>{article.nom} - {article.prix_vente} CDF (Stock: {article.quantite_stock})</option>
                  ))}
                </select>
                <input type="number" placeholder="Quantité" value={quantiteVente} onChange={(e) => setQuantiteVente(parseInt(e.target.value))} min="1" style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }} />
                <button onClick={handleAjouterAuPanier} style={{ width: '100%', padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>Ajouter au panier</button>
              </div>
              <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3>Panier de commande</h3>
                {panier.length === 0 && !showSuccess ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '50px' }}>Le panier est vide</p>
                ) : panier.length > 0 ? (
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ textAlign: 'left', padding: '8px' }}>Article</th>
                          <th style={{ textAlign: 'center', padding: '8px' }}>Qté</th>
                          <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {panier.map(item => (
                          <tr key={item.article_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px' }}>{item.nom}</td>
                            <td style={{ textAlign: 'center', padding: '8px' }}>{item.quantite}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{item.prix_vente * item.quantite} CDF</td>
                            <td style={{ textAlign: 'center', padding: '8px' }}>
                              <button onClick={() => handleRetirerDuPanier(item.article_id)} style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>X</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
                      <h2 style={{ fontSize: '28px', color: '#1e1b4b', margin: '0 0 15px 0' }}>{totalPanier} CDF</h2>
                      <button onClick={handleValiderVente} style={{ width: '100%', padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>VALIDER LA VENTE</button>
                    </div>
                  </div>
                ) : null}
                {showSuccess && derniereFacture && (
                  <div style={{ background: '#dcfce7', padding: '20px', borderRadius: '10px', marginTop: '20px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                    <h3 style={{ color: '#15803d', margin: '0 0 10px 0' }}>✅ VENTE RÉUSSIE</h3>
                    <p><strong>N° Facture :</strong> {derniereFacture.numero_facture}</p>
                    <button onClick={() => handleImprimerFacture(derniereFacture.numero_facture)} style={{ width: '100%', padding: '12px', background: '#1e1b4b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }}>Imprimer la facture</button>
                    <button onClick={() => setShowSuccess(false)} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', marginTop: '10px' }}>Fermer</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE SOUSCRIPTION & PAIEMENT MOBILE MONEY */}
      {showAbonnement && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '550px', width: '100%', padding: '30px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button onClick={() => setShowAbonnement(false)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            <h2 style={{ color: '#1e1b4b', marginTop: 0, fontSize: '22px' }}>💳 Souscription & Paiement Mobile Money</h2>
            <p style={{ color: '#475569', fontSize: '14px' }}>Pour souscrire à un plan ou valider votre réabonnement Smart Boutique, utilisez l'un des moyens suivants :</p>
            
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1e1b4b' }}>📱 Numéro de Paiement Mobile Money :</h4>
              <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>M-Pesa / Orange Money / Airtel Money :</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px', color: '#1e1b4b' }}>+243 999 068 332</p>
            </div>

            <div style={{ background: '#e0e7ff', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#3730a3' }}>💎 Formules d'Abonnement :</h4>
              <ul style={{ margin: '5px 0', paddingLeft: '20px', color: '#1e1b4b', fontSize: '14px' }}>
                <li><strong>Plan Standard :</strong> 15 USD / mois</li>
                <li><strong>Plan Annuel (Réduction 20%) :</strong> 120 USD / an</li>
              </ul>
            </div>

            <a 
              href="https://wa.me/243999068332?text=Bonjour,%20je%20souhaite%20activer%20mon%20abonnement%20Smart%20Boutique" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'block', textAlign: 'center', background: '#25D366', color: 'white', padding: '14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)' }}
            >
              💬 Souscrire / Activer par WhatsApp
            </a>

            <button onClick={() => setShowAbonnement(false)} style={{ width: '100%', padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', marginTop: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;