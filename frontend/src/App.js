import React, { useState, useEffect, useCallback } from 'react';
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

// ─── Utilitaire devise ───────────────────────────────────────────────────────
function formatMontant(montantCDF, devise, tauxChange) {
  if (devise === 'USD') {
    const usd = tauxChange > 0 ? (montantCDF / tauxChange) : 0;
    return `$${usd.toFixed(2)}`;
  }
  return `${Number(montantCDF).toFixed(0)} CDF`;
}

function App() {
  // ─── Auth ──────────────────────────────────────────────────────────────────
  const [chargement, setChargement] = useState(true);
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [connecte, setConnecte] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');

  // ─── Navigation ───────────────────────────────────────────────────────────
  const [ongletActif, setOngletActif] = useState('dashboard');

  // ─── Articles & stock ─────────────────────────────────────────────────────
  const [articles, setArticles] = useState([]);
  const [nouvelArticle, setNouvelArticle] = useState({
    reference: '', nom: '', description: '', prix_achat: '',
    prix_vente: '', quantite_stock: '', type_produit: 'vetement', taille: '', couleur: ''
  });

  // ─── Vente ────────────────────────────────────────────────────────────────
  const [panier, setPanier] = useState([]);
  const [articleSelectionne, setArticleSelectionne] = useState('');
  const [quantiteVente, setQuantiteVente] = useState(1);
  const [derniereFacture, setDerniereFacture] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [venteEnCours, setVenteEnCours] = useState(false);
  const [erreurVente, setErreurVente] = useState('');

  // ─── Multi-devises ────────────────────────────────────────────────────────
  const [devise, setDevise] = useState('CDF');   // 'CDF' ou 'USD'
  const [tauxChange, setTauxChange] = useState(2800); // 1 USD = X CDF
  const [nouveauTaux, setNouveauTaux] = useState('');
  const [showConvertisseur, setShowConvertisseur] = useState(false);
  const [montantAConvertir, setMontantAConvertir] = useState('');

  // ─── Historique ───────────────────────────────────────────────────────────
  const [historiqueVentes, setHistoriqueVentes] = useState([]);
  const [venteDetail, setVenteDetail] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // ─── Clients ──────────────────────────────────────────────────────────────
  const [clients, setClients] = useState([]);
  const [clientDetail, setClientDetail] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [nouveauClient, setNouveauClient] = useState({
    nom: '', email: '', telephone: '', adresse: '', date_naissance: ''
  });

  // ─── Vendeurs ─────────────────────────────────────────────────────────────
  const [vendeurs, setVendeurs] = useState([]);
  const [nouveauVendeur, setNouveauVendeur] = useState({ nom: '', email: '', mot_de_passe: '' });

  // ─── Inscription boutique ─────────────────────────────────────────────────
  const [modeInscription, setModeInscription] = useState(false);
  const [nomBoutique, setNomBoutique] = useState('');
  const [nomAdmin, setNomAdmin] = useState('');
  const [telephone, setTelephone] = useState('');
  const [motDePasseConfirm, setMotDePasseConfirm] = useState('');
  const [boutiques, setBoutiques] = useState([]);

  // ─── Dashboard ────────────────────────────────────────────────────────────
  const [statsDashboard, setStatsDashboard] = useState(null);
  const [showAbonnement, setShowAbonnement] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // ─── Restauration de session ───────────────────────────────────────────────
  useEffect(() => {
    const tokenStocke = localStorage.getItem('token');
    const userStocke = localStorage.getItem('user');
    const tauxStocke = localStorage.getItem('tauxChange');
    const deviseStocke = localStorage.getItem('devise');

    if (tauxStocke) setTauxChange(Number(tauxStocke));
    if (deviseStocke) setDevise(deviseStocke);

    if (tokenStocke && userStocke) {
      try {
        const userObjet = JSON.parse(userStocke);
        setToken(tokenStocke);
        setUser(userObjet);
        setConnecte(true);
        if (userObjet.role === 'vendeur') setOngletActif('vente');
        else if (userObjet.role === 'super_admin') setOngletActif('boutiques');
        else setOngletActif('dashboard');
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setChargement(false);
  }, []);

  // ─── Chargement initial des données ───────────────────────────────────────
  const chargerArticles = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(API_URL + '/articles', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setArticles(response.data);
    } catch (error) {
      console.error('Erreur chargement articles:', error);
    }
  }, [token]);

  const chargerHistoriqueVentes = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(API_URL + '/ventes/historique', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setHistoriqueVentes(response.data);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  }, [token]);

  const chargerClients = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(API_URL + '/clients', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  }, [token]);

  const chargerBoutiques = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(API_URL + '/boutiques/toutes', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setBoutiques(response.data);
    } catch (error) {
      console.error('Erreur chargement boutiques:', error);
    }
  }, [token]);

  const chargerVendeurs = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(API_URL + '/boutiques/vendeurs', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setVendeurs(response.data);
    } catch (error) {
      console.error('Erreur chargement vendeurs:', error);
    }
  }, [token]);

  const chargerStatsDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(API_URL + '/ventes/stats-dashboard', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setStatsDashboard(response.data);
    } catch (error) {
      console.error('Erreur stats dashboard:', error);
    }
  }, [token]);

  const chargerVentesJour = useCallback(async () => {
    if (!token) return;
    try {
      await axios.get(API_URL + '/ventes/aujourdhui', {
        headers: { Authorization: 'Bearer ' + token }
      });
    } catch (error) {
      console.error('Erreur ventes jour:', error);
    }
  }, [token]);

  useEffect(() => {
    if (connecte && user && token) {
      if (user.role === 'admin') {
        chargerArticles();
        chargerVentesJour();
        chargerHistoriqueVentes();
        chargerClients();
        chargerVendeurs();
        chargerStatsDashboard();
      }
      if (user.role === 'vendeur') chargerArticles();
      if (user.role === 'super_admin') chargerBoutiques();
    }
  }, [connecte, user, token, chargerArticles, chargerVentesJour, chargerHistoriqueVentes,
      chargerClients, chargerVendeurs, chargerStatsDashboard, chargerBoutiques]);

  // ─── Taux de change ───────────────────────────────────────────────────────
  const sauvegarderTaux = () => {
    const t = parseFloat(nouveauTaux);
    if (!t || t <= 0) { alert('Taux invalide'); return; }
    setTauxChange(t);
    localStorage.setItem('tauxChange', String(t));
    setNouveauTaux('');
    alert(`Taux mis à jour : 1 USD = ${t} CDF`);
  };

  const toggleDevise = () => {
    const next = devise === 'CDF' ? 'USD' : 'CDF';
    setDevise(next);
    localStorage.setItem('devise', next);
  };

  // ─── Auth handlers ────────────────────────────────────────────────────────
  const handleInscriptionDirecte = async () => {
    if (!nomBoutique || !nomAdmin || !email || !motDePasse) {
      setMessage('Tous les champs obligatoires doivent être remplis'); return;
    }
    if (motDePasse !== motDePasseConfirm) {
      setMessage('Les mots de passe ne correspondent pas'); return;
    }
    if (motDePasse.length < 8) {
      setMessage('Le mot de passe doit contenir au moins 8 caractères'); return;
    }
    try {
      const response = await axios.post(API_URL + '/boutiques/inscription-directe', {
        nom_boutique: nomBoutique, nom_admin: nomAdmin,
        email_admin: email, telephone, mot_de_passe: motDePasse
      });
      alert('Félicitations ! Votre boutique a été créée avec succès !');
      const data = response.data;
      setUser(data.user);
      setToken(data.token);
      setConnecte(true);
      setMessage('');
      setOngletActif('dashboard');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      setMessage(error.response ? error.response.data.message : 'Impossible de contacter le serveur. Vérifiez votre connexion internet.');
    }
  };

  const handleLogin = async () => {
    if (!email || !motDePasse) { setMessage('Veuillez remplir tous les champs'); return; }
    try {
      const response = await axios.post(API_URL + '/auth/login', {
        email, mot_de_passe: motDePasse
      });
      const data = response.data;
      setUser(data.user);
      setToken(data.token);
      setConnecte(true);
      setMessage('');
      if (data.user.role === 'vendeur') setOngletActif('vente');
      else if (data.user.role === 'super_admin') setOngletActif('boutiques');
      else setOngletActif('dashboard');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || 'Email ou mot de passe incorrect');
      } else {
        setMessage('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
      }
    }
  };

  const handleLogout = () => {
    setConnecte(false); setUser(null); setToken(''); setEmail(''); setMotDePasse('');
    setOngletActif('vente'); setArticles([]); setPanier([]); setDerniereFacture(null);
    setShowSuccess(false); setHistoriqueVentes([]); setShowDetails(false);
    setShowClientDetails(false); setBoutiques([]); setVendeurs([]); setStatsDashboard(null);
    setErreurVente(''); setVenteEnCours(false);
    localStorage.removeItem('token'); localStorage.removeItem('user');
  };

  // ─── Articles ─────────────────────────────────────────────────────────────
  const handleAjouterArticle = async () => {
    if (!nouvelArticle.nom || !nouvelArticle.prix_vente || !nouvelArticle.quantite_stock) {
      alert('Nom, prix de vente et quantité sont obligatoires'); return;
    }
    try {
      // Si la devise active est USD, on sauvegarde en CDF (conversion automatique)
      const articleAEnvoyer = { ...nouvelArticle };
      if (devise === 'USD' && tauxChange > 0) {
        articleAEnvoyer.prix_achat = nouvelArticle.prix_achat ? (parseFloat(nouvelArticle.prix_achat) * tauxChange).toFixed(2) : '';
        articleAEnvoyer.prix_vente = (parseFloat(nouvelArticle.prix_vente) * tauxChange).toFixed(2);
      }
      await axios.post(API_URL + '/articles', articleAEnvoyer, {
        headers: { Authorization: 'Bearer ' + token }
      });
      alert('Article ajouté avec succès !');
      setNouvelArticle({ reference: '', nom: '', description: '', prix_achat: '', prix_vente: '', quantite_stock: '', type_produit: 'vetement', taille: '', couleur: '' });
      chargerArticles();
      if (user.role === 'admin') chargerStatsDashboard();
    } catch (error) {
      alert('Erreur : ' + (error.response ? error.response.data.message : 'Problème de connexion'));
    }
  };

  const handleSupprimerArticle = async (id) => {
    if (!window.confirm('Supprimer cet article définitivement ?')) return;
    try {
      await axios.delete(API_URL + '/articles/' + id, {
        headers: { Authorization: 'Bearer ' + token }
      });
      chargerArticles();
      if (user.role === 'admin') chargerStatsDashboard();
    } catch (error) {
      alert('Erreur suppression : ' + (error.response ? error.response.data.message : 'Problème de connexion'));
    }
  };

  // ─── Vendeurs ─────────────────────────────────────────────────────────────
  const handleAjouterVendeur = async () => {
    if (!nouveauVendeur.nom || !nouveauVendeur.email || !nouveauVendeur.mot_de_passe) {
      alert('Tous les champs du vendeur sont obligatoires'); return;
    }
    if (nouveauVendeur.mot_de_passe.length < 8) {
      alert('Le mot de passe doit contenir au moins 8 caractères'); return;
    }
    try {
      await axios.post(API_URL + '/boutiques/creer-vendeur', nouveauVendeur, {
        headers: { Authorization: 'Bearer ' + token }
      });
      alert('Vendeur créé avec succès !');
      setNouveauVendeur({ nom: '', email: '', mot_de_passe: '' });
      chargerVendeurs();
    } catch (error) {
      alert('Erreur : ' + (error.response ? error.response.data.message : 'Problème de connexion'));
    }
  };

  const handleDesactiverVendeur = async (id) => {
    if (!window.confirm('Désactiver ce vendeur ?')) return;
    try {
      await axios.delete(API_URL + '/boutiques/vendeur/' + id, {
        headers: { Authorization: 'Bearer ' + token }
      });
      alert('Vendeur désactivé avec succès');
      chargerVendeurs();
    } catch (error) {
      alert('Erreur : ' + (error.response ? error.response.data.message : 'Problème de connexion'));
    }
  };

  // ─── Boutiques (super admin) ──────────────────────────────────────────────
  const handleSupprimerBoutique = async (id) => {
    if (!window.confirm('Désactiver cette boutique et tous ses utilisateurs ?')) return;
    try {
      await axios.delete(API_URL + '/boutiques/' + id, {
        headers: { Authorization: 'Bearer ' + token }
      });
      alert('Boutique désactivée');
      chargerBoutiques();
    } catch (error) {
      alert('Erreur : ' + (error.response ? error.response.data.message : 'Problème de connexion'));
    }
  };

  const handleReactiverBoutique = async (id) => {
    if (!window.confirm('Réactiver cette boutique ?')) return;
    try {
      await axios.put(API_URL + '/boutiques/' + id + '/reactiver', {}, {
        headers: { Authorization: 'Bearer ' + token }
      });
      alert('Boutique réactivée');
      chargerBoutiques();
    } catch (error) {
      alert('Erreur : ' + (error.response ? error.response.data.message : 'Problème de connexion'));
    }
  };

  // ─── Clients ──────────────────────────────────────────────────────────────
  const handleAjouterClient = async () => {
    if (!nouveauClient.nom) { alert('Le nom du client est obligatoire'); return; }
    try {
      await axios.post(API_URL + '/clients', nouveauClient, {
        headers: { Authorization: 'Bearer ' + token }
      });
      alert('Client ajouté avec succès !');
      setNouveauClient({ nom: '', email: '', telephone: '', adresse: '', date_naissance: '' });
      chargerClients();
    } catch (error) {
      alert('Erreur : ' + (error.response ? error.response.data.message : 'Problème de connexion'));
    }
  };

  const handleSupprimerClient = async (id) => {
    if (!window.confirm('Supprimer ce client ?')) return;
    try {
      await axios.delete(API_URL + '/clients/' + id, {
        headers: { Authorization: 'Bearer ' + token }
      });
      chargerClients();
    } catch (error) {
      alert('Erreur : ' + (error.response ? error.response.data.message : 'Problème de connexion'));
    }
  };

  // ─── Vente ────────────────────────────────────────────────────────────────
  const handleAjouterAuPanier = () => {
    if (!articleSelectionne || quantiteVente < 1) {
      alert('Sélectionnez un article et une quantité valide'); return;
    }
    const article = articles.find(a => a.id === parseInt(articleSelectionne));
    if (!article) { alert('Article introuvable'); return; }
    if (Number(article.quantite_stock) < quantiteVente) {
      alert(`Stock insuffisant ! Stock disponible : ${article.quantite_stock}`); return;
    }
    const dansPanier = panier.find(item => item.article_id === article.id);
    if (dansPanier) {
      const nouvelleQte = dansPanier.quantite + quantiteVente;
      if (Number(article.quantite_stock) < nouvelleQte) {
        alert(`Stock insuffisant ! Vous avez déjà ${dansPanier.quantite} dans le panier, stock total: ${article.quantite_stock}`);
        return;
      }
      setPanier(panier.map(item =>
        item.article_id === article.id
          ? { ...item, quantite: nouvelleQte }
          : item
      ));
    } else {
      setPanier([...panier, {
        article_id: article.id,
        nom: article.nom,
        prix_vente: article.prix_vente,
        quantite: quantiteVente
      }]);
    }
    setArticleSelectionne('');
    setQuantiteVente(1);
    setErreurVente('');
  };

  const handleRetirerDuPanier = (articleId) => {
    setPanier(panier.filter(item => item.article_id !== articleId));
    setErreurVente('');
  };

  const handleValiderVente = async () => {
    if (panier.length === 0) { setErreurVente('Le panier est vide'); return; }
    if (venteEnCours) return;

    setVenteEnCours(true);
    setErreurVente('');

    try {
      const response = await axios.post(API_URL + '/ventes', {
        articles: panier,
        mode_paiement: 'especes',
        devise: 'CDF'
      }, { headers: { Authorization: 'Bearer ' + token } });

      setDerniereFacture(response.data.vente);
      setShowSuccess(true);
      setPanier([]);
      chargerArticles();
      if (user && user.role === 'admin') {
        chargerVentesJour();
        chargerHistoriqueVentes();
        chargerStatsDashboard();
      }
    } catch (error) {
      let msg = 'Une erreur est survenue lors de la vente.';
      if (error.response && error.response.data && error.response.data.message) {
        msg = error.response.data.message;
      } else if (!error.response) {
        msg = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
      }
      setErreurVente(msg);
    } finally {
      setVenteEnCours(false);
    }
  };

  const handleImprimerFacture = (numeroFacture) => {
    const url = API_URL + '/ventes/facture-html/' + numeroFacture + '?token=' + token;
    const win = window.open(url, '_blank', 'width=700,height=900');
    if (!win) alert('Veuillez autoriser les pop-ups pour imprimer la facture');
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
      link.setAttribute('download', 'rapport-stock.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Erreur lors de la génération du rapport : ' + (error.response ? error.response.data.message : 'Problème de connexion'));
    }
  };

  const voirDetailsVente = async (id) => {
    try {
      const response = await axios.get(API_URL + '/ventes/' + id + '/details', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setVenteDetail(response.data);
      setShowDetails(true);
    } catch (error) {
      alert('Impossible de charger les détails : ' + (error.response ? error.response.data.message : 'Problème de connexion'));
    }
  };

  const voirDetailsClient = async (id) => {
    try {
      const response = await axios.get(API_URL + '/clients/' + id, {
        headers: { Authorization: 'Bearer ' + token }
      });
      setClientDetail(response.data);
      setShowClientDetails(true);
    } catch (error) {
      alert('Impossible de charger les détails du client : ' + (error.response ? error.response.data.message : 'Problème de connexion'));
    }
  };

  // ─── Calculs panier ────────────────────────────────────────────────────────
  const totalPanierCDF = panier.reduce((total, item) => total + (Number(item.prix_vente) * item.quantite), 0);
  const predictionsCount = statsDashboard?.predictionsStock?.length || 0;

  // ─── Styles communs ───────────────────────────────────────────────────────
  const btnDevise = {
    padding: '6px 14px', border: 'none', borderRadius: '20px', cursor: 'pointer',
    fontWeight: 'bold', fontSize: '13px',
    background: 'linear-gradient(90deg, #f59e0b, #d97706)', color: 'white',
    boxShadow: '0 2px 6px rgba(245,158,11,0.4)'
  };

  // ──────────────────────────────────────────────────────────────────────────
  // CHARGEMENT
  // ──────────────────────────────────────────────────────────────────────────
  if (chargement) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a237e 0%, #4a148c 100%)', color: 'white', fontFamily: 'Arial' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
          <h2 style={{ fontSize: '24px', margin: 0 }}>Chargement de Smart Boutique...</h2>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ECRAN LOGIN / INSCRIPTION
  // ──────────────────────────────────────────────────────────────────────────
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
            {modeInscription ? 'Créer une boutique' : 'Connexion à votre espace'}
          </h2>
          {!modeInscription ? (
            <div>
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', padding: '14px', margin: '8px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Mot de passe" value={motDePasse} onChange={e => setMotDePasse(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', padding: '14px', margin: '8px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }} />
              <button onClick={handleLogin} style={{ width: '100%', padding: '14px', background: 'linear-gradient(90deg, #1e1b4b 0%, #4338ca 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', marginTop: '15px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(67,56,202,0.4)' }}>
                Se connecter
              </button>
            </div>
          ) : (
            <div>
              <input type="text" placeholder="Nom de votre boutique *" value={nomBoutique} onChange={e => setNomBoutique(e.target.value)} style={{ width: '100%', padding: '12px', margin: '6px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Votre nom complet (Admin) *" value={nomAdmin} onChange={e => setNomAdmin(e.target.value)} style={{ width: '100%', padding: '12px', margin: '6px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <input type="email" placeholder="Email *" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', margin: '6px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <input type="tel" placeholder="Téléphone" value={telephone} onChange={e => setTelephone(e.target.value)} style={{ width: '100%', padding: '12px', margin: '6px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Mot de passe (8+ car.) *" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} style={{ width: '100%', padding: '12px', margin: '6px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Confirmer mot de passe *" value={motDePasseConfirm} onChange={e => setMotDePasseConfirm(e.target.value)} style={{ width: '100%', padding: '12px', margin: '6px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
              <button onClick={handleInscriptionDirecte} style={{ width: '100%', padding: '14px', background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', marginTop: '12px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
                Créer ma boutique instantanément 🚀
              </button>
            </div>
          )}
          {message && (
            <p style={{ color: '#ef4444', marginTop: '15px', textAlign: 'center', fontSize: '14px', padding: '10px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>{message}</p>
          )}
          <p style={{ marginTop: '20px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
            {modeInscription ? 'Déjà un compte ?' : 'Nouvelle boutique ?'}
            <button onClick={() => { setModeInscription(!modeInscription); setMessage(''); }} style={{ background: 'none', border: 'none', color: '#4338ca', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginLeft: '5px' }}>
              {modeInscription ? 'Se connecter' : 'Créer un compte'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SUPER ADMIN VIEW
  // ──────────────────────────────────────────────────────────────────────────
  if (user && user.role === 'super_admin') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
        <nav style={{ background: '#1e1b4b', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>👑 Smart Boutique — Super Admin</h2>
          <div>
            <span style={{ marginRight: '15px', fontWeight: 'bold' }}>{user.nom}</span>
            <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Déconnexion</button>
          </div>
        </nav>
        <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Toutes les boutiques inscrites ({boutiques.length})</h2>
            <button onClick={chargerBoutiques} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Actualiser</button>
          </div>
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

  // ──────────────────────────────────────────────────────────────────────────
  // ECRAN VENTE (composant commun admin + vendeur)
  // ──────────────────────────────────────────────────────────────────────────
  const EcranVente = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>🛒 Nouvelle vente</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Devise active :</span>
          <button onClick={toggleDevise} style={btnDevise}>
            {devise === 'CDF' ? '🇨🇩 CDF → USD' : '🇺🇸 USD → CDF'}
          </button>
          <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e1b4b' }}>
            Taux: 1 USD = {tauxChange} CDF
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* SÉLECTEUR ARTICLE */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', color: '#1e1b4b', marginTop: 0 }}>Sélectionner l'article</h3>
          <select value={articleSelectionne} onChange={e => setArticleSelectionne(e.target.value)}
            style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px' }}>
            <option value="">-- Choisir un article --</option>
            {articles.map(article => (
              <option key={article.id} value={article.id}>
                {article.nom} — {formatMontant(article.prix_vente, devise, tauxChange)} (Stock: {article.quantite_stock})
              </option>
            ))}
          </select>

          {/* Aperçu prix si article sélectionné */}
          {articleSelectionne && (() => {
            const art = articles.find(a => a.id === parseInt(articleSelectionne));
            if (!art) return null;
            return (
              <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', marginBottom: '10px', fontSize: '13px' }}>
                <strong>{art.nom}</strong><br/>
                Prix : <strong>{Number(art.prix_vente).toFixed(0)} CDF</strong>
                {tauxChange > 0 && (<> = <strong>${(art.prix_vente / tauxChange).toFixed(2)}</strong></>)}
                <br/>Stock disponible : <strong style={{ color: art.quantite_stock <= 5 ? '#ef4444' : '#10b981' }}>{art.quantite_stock}</strong>
              </div>
            );
          })()}

          <input type="number" placeholder="Quantité" value={quantiteVente}
            onChange={e => setQuantiteVente(Math.max(1, parseInt(e.target.value) || 1))}
            min="1" style={{ width: '100%', padding: '12px', margin: '6px 0', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }} />
          <button onClick={handleAjouterAuPanier}
            style={{ width: '100%', padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>
            ➕ Ajouter au panier
          </button>
        </div>

        {/* PANIER */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', color: '#1e1b4b', marginTop: 0 }}>Panier de vente</h3>

          {panier.length === 0 && !showSuccess ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '50px', fontSize: '16px' }}>
              🛒 Votre panier est vide
            </p>
          ) : panier.length > 0 ? (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '8px', fontSize: '13px' }}>Article</th>
                    <th style={{ textAlign: 'center', padding: '8px', fontSize: '13px' }}>Qté</th>
                    <th style={{ textAlign: 'right', padding: '8px', fontSize: '13px' }}>Total CDF</th>
                    <th style={{ textAlign: 'right', padding: '8px', fontSize: '13px' }}>Total USD</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {panier.map(item => {
                    const totalItemCDF = Number(item.prix_vente) * item.quantite;
                    const totalItemUSD = tauxChange > 0 ? (totalItemCDF / tauxChange).toFixed(2) : '—';
                    return (
                      <tr key={item.article_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontSize: '13px' }}>{item.nom}</td>
                        <td style={{ textAlign: 'center', padding: '8px', fontSize: '13px' }}>{item.quantite}</td>
                        <td style={{ textAlign: 'right', padding: '8px', fontSize: '13px' }}>{totalItemCDF.toFixed(0)} CDF</td>
                        <td style={{ textAlign: 'right', padding: '8px', fontSize: '13px', color: '#64748b' }}>${totalItemUSD}</td>
                        <td style={{ textAlign: 'center', padding: '8px' }}>
                          <button onClick={() => handleRetirerDuPanier(item.article_id)}
                            style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>TOTAL CDF</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e1b4b' }}>{totalPanierCDF.toFixed(0)} CDF</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>TOTAL USD</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>
                      ${tauxChange > 0 ? (totalPanierCDF / tauxChange).toFixed(2) : '—'}
                    </div>
                  </div>
                </div>

                {erreurVente && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '15px', color: '#dc2626', fontSize: '14px' }}>
                    ⚠️ {erreurVente}
                  </div>
                )}

                <button onClick={handleValiderVente} disabled={venteEnCours}
                  style={{ width: '100%', padding: '16px', background: venteEnCours ? '#94a3b8' : 'linear-gradient(90deg, #059669, #10b981)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '20px', cursor: venteEnCours ? 'not-allowed' : 'pointer', fontWeight: 'bold', boxShadow: venteEnCours ? 'none' : '0 4px 12px rgba(16,185,129,0.4)' }}>
                  {venteEnCours ? '⏳ Validation en cours...' : '✅ VALIDER LA VENTE'}
                </button>
              </div>
            </div>
          ) : null}

          {showSuccess && derniereFacture && (
            <div style={{ background: '#dcfce7', padding: '20px', borderRadius: '10px', marginTop: '20px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
              <h3 style={{ color: '#15803d', margin: '0 0 10px 0', fontSize: '22px' }}>🎉 VENTE RÉUSSIE !</h3>
              <p style={{ margin: '5px 0' }}><strong>N° Facture :</strong> {derniereFacture.numero_facture}</p>
              <p style={{ margin: '5px 0' }}>
                <strong>Montant :</strong> {Number(derniereFacture.montant_total || 0).toFixed(0)} CDF
                {tauxChange > 0 && (<> = <strong>${(derniereFacture.montant_total / tauxChange).toFixed(2)}</strong></>)}
              </p>
              <button onClick={() => handleImprimerFacture(derniereFacture.numero_facture)}
                style={{ width: '100%', padding: '12px', background: '#1e1b4b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '12px', fontWeight: 'bold', fontSize: '16px' }}>
                🖨️ Imprimer la facture
              </button>
              <button onClick={() => setShowSuccess(false)}
                style={{ width: '100%', padding: '10px', background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', marginTop: '8px' }}>
                Fermer et faire une nouvelle vente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // VENDEUR VIEW
  // ──────────────────────────────────────────────────────────────────────────
  if (user && user.role === 'vendeur') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ background: 'linear-gradient(90deg, #1e1b4b, #312e81)', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h1 style={{ margin: 0, fontSize: '20px' }}>🏪 {user.nom_boutique || 'Smart Boutique'}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>👤 {user.nom} (Vendeur)</span>
            <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Déconnexion</button>
          </div>
        </div>
        <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
          <EcranVente />
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ADMIN VIEW
  // ──────────────────────────────────────────────────────────────────────────
  const typeActuel = nouvelArticle.type_produit || 'vetement';
  const attr1Label = TYPES_PRODUITS[typeActuel]?.attr1 || 'Attribut 1';
  const attr2Label = TYPES_PRODUITS[typeActuel]?.attr2 || 'Attribut 2';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
      {/* NAVIGATION */}
      <nav style={{ background: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)', color: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🏪</span>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Smart Boutique</h2>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            ['dashboard', '📊 Tableau de bord'],
            ['articles', '📦 Articles'],
            ['vente', '🛒 Vente'],
            ['historique', '📜 Historique'],
            ['clients', '👥 Clients'],
            ['vendeurs', '👔 Vendeurs'],
            ['devises', '💱 Devises']
          ].map(([id, label]) => (
            <button key={id}
              onClick={() => {
                setOngletActif(id);
                if (id === 'historique') chargerHistoriqueVentes();
                if (id === 'clients') chargerClients();
                if (id === 'vendeurs') chargerVendeurs();
              }}
              style={{ padding: '7px 12px', background: ongletActif === id ? '#fbbf24' : 'transparent', color: ongletActif === id ? '#1e1b4b' : 'white', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px' }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* NOTIFICATIONS */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: '#3730a3', border: 'none', color: 'white', padding: '7px 12px', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', fontSize: '13px' }}>
              🔔
              {predictionsCount > 0 && (
                <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', padding: '1px 6px', fontSize: '11px', fontWeight: 'bold' }}>{predictionsCount}</span>
              )}
            </button>
            {showNotifications && (
              <div style={{ position: 'absolute', top: '42px', right: 0, width: '320px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', padding: '15px', zIndex: 1000, border: '1px solid #e2e8f0', color: '#1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#1e1b4b', fontSize: '14px' }}>🤖 Alertes Prédictives Stock IA</h4>
                  <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}>✕</button>
                </div>
                {predictionsCount === 0 ? (
                  <p style={{ color: '#10b981', fontSize: '13px', margin: 0, textAlign: 'center' }}>✅ Vos stocks sont à un niveau optimal !</p>
                ) : (
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {statsDashboard?.predictionsStock?.map(pred => (
                      <div key={pred.id} style={{ background: pred.niveau === 'critical' ? '#fef2f2' : '#fffbe5', padding: '10px', borderRadius: '8px', marginBottom: '8px', borderLeft: `4px solid ${pred.niveau === 'critical' ? '#ef4444' : '#f59e0b'}` }}>
                        <strong style={{ fontSize: '13px' }}>{pred.nom}</strong>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
                          Stock: <strong>{pred.quantite_stock}</strong> | Rupture dans: <strong style={{ color: pred.niveau === 'critical' ? '#dc2626' : '#d97706' }}>{pred.jours_restants === 0 ? '&lt; 1 jour' : `${pred.jours_restants} jours`}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={() => setShowAbonnement(true)}
            style={{ background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
            💳 Abonnement
          </button>
          <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{user?.nom}</span>
          <button onClick={handleLogout} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Déconnexion</button>
        </div>
      </nav>

      {/* CONTENU */}
      <main style={{ padding: '25px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* ── DASHBOARD ──────────────────────────────────────────────────── */}
        {ongletActif === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1e1b4b' }}>📊 Tableau de Bord</h2>
              <button onClick={chargerStatsDashboard} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Actualiser</button>
            </div>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              {[
                { label: "CHIFFRE D'AFFAIRES", val: statsDashboard?.kpi?.chiffre_affaires || 0, color: '#3b82f6' },
                { label: "BÉNÉFICE NET ESTIMÉ", val: statsDashboard?.kpi?.benefice_total || 0, color: '#10b981' },
                { label: "PANIER MOYEN", val: statsDashboard?.kpi?.panier_moyen || 0, color: '#f59e0b' },
                { label: "VALEUR TOTALE STOCK", val: statsDashboard?.kpi?.valeur_stock || 0, color: '#8b5cf6' }
              ].map((kpi, i) => (
                <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderLeft: `5px solid ${kpi.color}` }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>{kpi.label}</span>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', color: kpi.color, margin: '8px 0 2px 0' }}>{Number(kpi.val).toFixed(0)} CDF</p>
                  {tauxChange > 0 && <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>${(kpi.val / tauxChange).toFixed(2)}</p>}
                </div>
              ))}
            </div>
            {/* Graphiques */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(430px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              {/* Graphique barres 7 jours */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1e1b4b', fontSize: '15px' }}>📈 Ventes (7 derniers jours)</h3>
                {!statsDashboard?.graph7Jours?.length ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Aucune donnée récente</p>
                ) : (
                  <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '10px', paddingTop: '20px', borderBottom: '2px solid #e2e8f0' }}>
                    {statsDashboard.graph7Jours.map((item, idx) => {
                      const max = Math.max(...statsDashboard.graph7Jours.map(g => Number(g.chiffre) || 1));
                      const h = Math.max(10, Math.round((Number(item.chiffre) / max) * 100));
                      return (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '10px', color: '#475569', marginBottom: '3px' }}>{Number(item.chiffre) > 0 ? `${(Number(item.chiffre)/1000).toFixed(0)}k` : '0'}</span>
                          <div style={{ width: '80%', height: `${h}%`, background: 'linear-gradient(180deg, #6366f1, #312e81)', borderRadius: '4px 4px 0 0' }} title={`${item.date}: ${Number(item.chiffre).toFixed(0)} CDF`} />
                          <span style={{ fontSize: '10px', color: '#64748b', marginTop: '5px' }}>{item.date}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Répartition catégories */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1e1b4b', fontSize: '15px' }}>🍩 Répartition par Catégorie</h3>
                {!statsDashboard?.repartitionCategories?.length ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Aucune vente par catégorie</p>
                ) : statsDashboard.repartitionCategories.map((cat, i) => {
                  const total = statsDashboard.repartitionCategories.reduce((acc, c) => acc + Number(c.montant_total), 0) || 1;
                  const pct = Math.round((Number(cat.montant_total) / total) * 100);
                  const couleurs = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];
                  return (
                    <div key={i} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                        <span><strong style={{ color: couleurs[i % 6] }}>■</strong> {TYPES_PRODUITS[cat.type_produit]?.label || cat.type_produit}</span>
                        <strong>{pct}%</strong>
                      </div>
                      <div style={{ width: '100%', background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, background: couleurs[i % 6], height: '100%', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Top produits + Prédictions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(430px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1e1b4b', fontSize: '15px' }}>🏆 Top 5 Produits</h3>
                {!statsDashboard?.topProduits?.length ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Pas encore de ventes</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ background: '#f8fafc', fontSize: '12px', color: '#475569' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Produit</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Qté</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Revenu</th>
                    </tr></thead>
                    <tbody>
                      {statsDashboard.topProduits.map((p, idx) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px', fontSize: '13px', fontWeight: 'bold' }}>#{idx+1} {p.nom}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontSize: '13px' }}>{p.quantite_vendue}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', color: '#10b981', fontWeight: 'bold' }}>
                            {Number(p.total_revenu).toFixed(0)} CDF
                            {tauxChange > 0 && <div style={{ fontSize: '11px', color: '#94a3b8' }}>${(p.total_revenu / tauxChange).toFixed(2)}</div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1e1b4b', fontSize: '15px' }}>🤖 Prédictions IA — Ruptures de Stock</h3>
                {predictionsCount === 0 ? (
                  <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#047857' }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>✅ Vos stocks sont stables et suffisants.</p>
                  </div>
                ) : statsDashboard?.predictionsStock?.map(pred => (
                  <div key={pred.id} style={{ background: pred.niveau === 'critical' ? '#fef2f2' : '#fffbe5', padding: '12px', borderRadius: '8px', marginBottom: '10px', border: `1px solid ${pred.niveau === 'critical' ? '#fecaca' : '#fef08a'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px' }}>{pred.nom}</strong>
                      <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', background: pred.niveau === 'critical' ? '#ef4444' : '#f59e0b', color: 'white' }}>
                        {pred.niveau === 'critical' ? 'CRITIQUE' : 'ATTENTION'}
                      </span>
                    </div>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#475569' }}>
                      Stock: <strong>{pred.quantite_stock}</strong> | Rupture dans: <strong style={{ color: pred.niveau === 'critical' ? '#dc2626' : '#d97706' }}>{pred.jours_restants === 0 ? 'Moins de 24h !' : `${pred.jours_restants} jours`}</strong>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ARTICLES ──────────────────────────────────────────────────── */}
        {ongletActif === 'articles' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>📦 Gestion des articles</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={toggleDevise} style={btnDevise}>Afficher en {devise === 'CDF' ? 'USD' : 'CDF'}</button>
                <button onClick={handleRapportStock} style={{ padding: '10px 18px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}>📄 Rapport PDF</button>
              </div>
            </div>
            {/* Formulaire ajout */}
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0 }}>Ajouter un article <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>(prix en {devise})</span></h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                <select value={typeActuel} onChange={e => setNouvelArticle({ ...nouvelArticle, type_produit: e.target.value })}
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', fontWeight: 'bold' }}>
                  {Object.entries(TYPES_PRODUITS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input placeholder="Référence" value={nouvelArticle.reference} onChange={e => setNouvelArticle({ ...nouvelArticle, reference: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Nom du produit *" value={nouvelArticle.nom} onChange={e => setNouvelArticle({ ...nouvelArticle, nom: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder={`Prix d'achat (${devise})`} type="number" value={nouvelArticle.prix_achat} onChange={e => setNouvelArticle({ ...nouvelArticle, prix_achat: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder={`Prix de vente (${devise}) *`} type="number" value={nouvelArticle.prix_vente} onChange={e => setNouvelArticle({ ...nouvelArticle, prix_vente: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Quantité en stock *" type="number" value={nouvelArticle.quantite_stock} onChange={e => setNouvelArticle({ ...nouvelArticle, quantite_stock: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder={attr1Label} value={nouvelArticle.taille} onChange={e => setNouvelArticle({ ...nouvelArticle, taille: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder={attr2Label} value={nouvelArticle.couleur} onChange={e => setNouvelArticle({ ...nouvelArticle, couleur: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <button onClick={handleAjouterArticle} style={{ width: '100%', padding: '12px', background: '#1e1b4b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '15px', fontWeight: 'bold', fontSize: '15px' }}>
                ➕ Ajouter l'article
              </button>
            </div>
            {/* Liste articles */}
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0 }}>Articles en stock ({articles.length})</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ textAlign: 'left', padding: '10px', fontSize: '13px' }}>Référence</th>
                    <th style={{ textAlign: 'left', padding: '10px', fontSize: '13px' }}>Nom</th>
                    <th style={{ textAlign: 'right', padding: '10px', fontSize: '13px' }}>Prix achat</th>
                    <th style={{ textAlign: 'right', padding: '10px', fontSize: '13px' }}>Prix vente</th>
                    <th style={{ textAlign: 'right', padding: '10px', fontSize: '13px' }}>Prix USD</th>
                    <th style={{ textAlign: 'center', padding: '10px', fontSize: '13px' }}>Stock</th>
                    <th style={{ textAlign: 'center', padding: '10px', fontSize: '13px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map(article => (
                    <tr key={article.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px', fontSize: '13px' }}>{article.reference}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold', fontSize: '13px' }}>{article.nom}</td>
                      <td style={{ textAlign: 'right', padding: '8px', fontSize: '13px', color: '#64748b' }}>{Number(article.prix_achat).toFixed(0)} CDF</td>
                      <td style={{ textAlign: 'right', padding: '8px', fontSize: '13px', fontWeight: 'bold' }}>{Number(article.prix_vente).toFixed(0)} CDF</td>
                      <td style={{ textAlign: 'right', padding: '8px', fontSize: '13px', color: '#f59e0b' }}>
                        {tauxChange > 0 ? `$${(article.prix_vente / tauxChange).toFixed(2)}` : '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px', fontSize: '13px', color: article.quantite_stock <= 5 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{article.quantite_stock}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <button onClick={() => handleSupprimerArticle(article.id)} style={{ padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Suppr</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── VENTE (admin) ─────────────────────────────────────────────── */}
        {ongletActif === 'vente' && <EcranVente />}

        {/* ── HISTORIQUE ────────────────────────────────────────────────── */}
        {ongletActif === 'historique' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>📜 Historique des Ventes</h2>
              <button onClick={chargerHistoriqueVentes} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Actualiser</button>
            </div>
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              {historiqueVentes.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Aucune vente enregistrée</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1e1b4b', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Facture</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Vendeur</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Montant CDF</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Montant USD</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historiqueVentes.map(vente => (
                      <tr key={vente.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{vente.numero_facture}</td>
                        <td style={{ padding: '10px', fontSize: '13px' }}>{new Date(vente.created_at).toLocaleString('fr-FR')}</td>
                        <td style={{ padding: '10px', fontSize: '13px' }}>{vente.vendeur_nom}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#1e1b4b' }}>{Number(vente.montant_final).toFixed(0)} CDF</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#f59e0b', fontWeight: 'bold' }}>
                          {tauxChange > 0 ? `$${(vente.montant_final / tauxChange).toFixed(2)}` : '—'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button onClick={() => voirDetailsVente(vente.id)} style={{ padding: '6px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Détails</button>
                          <button onClick={() => handleImprimerFacture(vente.numero_facture)} style={{ padding: '6px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: '5px', fontSize: '12px' }}>🖨️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── CLIENTS ───────────────────────────────────────────────────── */}
        {ongletActif === 'clients' && (
          <div>
            <h2>👥 Gestion des Clients</h2>
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0 }}>Ajouter un client</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <input placeholder="Nom du client *" value={nouveauClient.nom} onChange={e => setNouveauClient({ ...nouveauClient, nom: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Email" value={nouveauClient.email} onChange={e => setNouveauClient({ ...nouveauClient, email: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Téléphone" value={nouveauClient.telephone} onChange={e => setNouveauClient({ ...nouveauClient, telephone: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Date de naissance" type="date" value={nouveauClient.date_naissance} onChange={e => setNouveauClient({ ...nouveauClient, date_naissance: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <button onClick={handleAjouterClient} style={{ width: '100%', padding: '12px', background: '#1e1b4b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '15px', fontWeight: 'bold' }}>Ajouter le client</button>
            </div>
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0 }}>Liste des clients ({clients.length})</h3>
              {clients.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Aucun client enregistré</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1e1b4b', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Téléphone</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Achats</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Total CDF</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Total USD</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{client.nom}</td>
                        <td style={{ padding: '10px' }}>{client.telephone || '—'}</td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>{client.nombre_achats || 0}</td>
                        <td style={{ textAlign: 'right', padding: '10px', color: '#1e1b4b', fontWeight: 'bold' }}>{Number(client.total_achats || 0).toFixed(0)} CDF</td>
                        <td style={{ textAlign: 'right', padding: '10px', color: '#f59e0b' }}>
                          {tauxChange > 0 ? `$${(client.total_achats / tauxChange).toFixed(2)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <button onClick={() => voirDetailsClient(client.id)} style={{ padding: '6px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Détails</button>
                          <button onClick={() => handleSupprimerClient(client.id)} style={{ padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: '5px', fontSize: '12px' }}>Suppr</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── VENDEURS ──────────────────────────────────────────────────── */}
        {ongletActif === 'vendeurs' && (
          <div>
            <h2>👔 Gestion des vendeurs</h2>
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0 }}>Ajouter un vendeur</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <input placeholder="Nom du vendeur *" value={nouveauVendeur.nom} onChange={e => setNouveauVendeur({ ...nouveauVendeur, nom: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Email *" type="email" value={nouveauVendeur.email} onChange={e => setNouveauVendeur({ ...nouveauVendeur, email: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                <input placeholder="Mot de passe (8+ car.) *" type="password" value={nouveauVendeur.mot_de_passe} onChange={e => setNouveauVendeur({ ...nouveauVendeur, mot_de_passe: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
              <button onClick={handleAjouterVendeur} style={{ width: '100%', padding: '12px', background: '#1e1b4b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '15px', fontWeight: 'bold' }}>Créer le vendeur</button>
            </div>
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0 }}>Liste des vendeurs ({vendeurs.length})</h3>
              {vendeurs.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Aucun vendeur</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#1e1b4b', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Statut</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                  </tr></thead>
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
                          {v.actif && <button onClick={() => handleDesactiverVendeur(v.id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Désactiver</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── DEVISES & CONVERTISSEUR ───────────────────────────────────── */}
        {ongletActif === 'devises' && (
          <div>
            <h2>💱 Gestion des Devises & Convertisseur</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
              {/* Config taux */}
              <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#1e1b4b' }}>⚙️ Configurer le taux de change</h3>
                <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>Taux actuel :</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '26px', fontWeight: 'bold', color: '#15803d' }}>1 USD = {tauxChange} CDF</p>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Saisissez le nouveau taux de change selon le taux du marché ou du vendeur :</p>
                <input type="number" placeholder="Ex: 2800" value={nouveauTaux} onChange={e => setNouveauTaux(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', marginBottom: '10px' }} />
                <button onClick={sauvegarderTaux} style={{ width: '100%', padding: '12px', background: '#1e1b4b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                  💾 Mettre à jour le taux
                </button>

                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ color: '#1e1b4b' }}>Devise d'affichage active</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['CDF', 'USD'].map(d => (
                      <button key={d} onClick={() => { setDevise(d); localStorage.setItem('devise', d); }}
                        style={{ flex: 1, padding: '12px', background: devise === d ? '#1e1b4b' : '#f1f5f9', color: devise === d ? 'white' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                        {d === 'CDF' ? '🇨🇩 CDF (Franc Congolais)' : '🇺🇸 USD (Dollar)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Convertisseur */}
              <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#1e1b4b' }}>🔄 Convertisseur instantané</h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: 0 }}>Taux utilisé : <strong>1 USD = {tauxChange} CDF</strong></p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                  <button onClick={() => setShowConvertisseur(!showConvertisseur)}
                    style={{ padding: '8px 14px', background: showConvertisseur ? '#6366f1' : '#e2e8f0', color: showConvertisseur ? 'white' : '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {showConvertisseur ? 'USD → CDF' : 'CDF → USD'}
                  </button>
                  <button onClick={() => setShowConvertisseur(!showConvertisseur)}
                    style={{ padding: '8px 14px', background: !showConvertisseur ? '#6366f1' : '#e2e8f0', color: !showConvertisseur ? 'white' : '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {showConvertisseur ? 'CDF → USD' : 'USD → CDF'}
                  </button>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>
                    Montant en {showConvertisseur ? 'USD' : 'CDF'} :
                  </label>
                  <input type="number" placeholder={showConvertisseur ? "Montant en USD..." : "Montant en CDF..."} value={montantAConvertir}
                    onChange={e => setMontantAConvertir(e.target.value)}
                    style={{ width: '100%', padding: '14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '18px', boxSizing: 'border-box', marginTop: '5px' }} />
                </div>
                {montantAConvertir && !isNaN(parseFloat(montantAConvertir)) && tauxChange > 0 && (
                  <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #4338ca)', padding: '20px', borderRadius: '10px', textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '13px', opacity: 0.8 }}>{Number(montantAConvertir).toFixed(showConvertisseur ? 2 : 0)} {showConvertisseur ? 'USD' : 'CDF'} =</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '5px' }}>
                      {showConvertisseur
                        ? `${(parseFloat(montantAConvertir) * tauxChange).toFixed(0)} CDF`
                        : `$${(parseFloat(montantAConvertir) / tauxChange).toFixed(2)}`}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>Taux: 1 USD = {tauxChange} CDF</div>
                  </div>
                )}
                {/* Tableau de référence rapide */}
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ color: '#1e1b4b', fontSize: '14px' }}>Tableau de référence rapide :</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead><tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>USD</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>CDF</th>
                    </tr></thead>
                    <tbody>
                      {[1, 5, 10, 20, 50, 100].map(usd => (
                        <tr key={usd} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 8px' }}>${usd}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{(usd * tauxChange).toFixed(0)} CDF</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DÉTAILS VENTE */}
      {showDetails && venteDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '550px', width: '100%', padding: '30px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1e1b4b' }}>📋 Détails de la vente</h2>
              <button onClick={() => setShowDetails(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>N° Facture :</strong> {venteDetail.vente?.numero_facture}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Date :</strong> {venteDetail.vente?.created_at ? new Date(venteDetail.vente.created_at).toLocaleString('fr-FR') : '—'}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Vendeur :</strong> {venteDetail.vente?.vendeur_nom}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Total CDF :</strong> {Number(venteDetail.vente?.montant_final || 0).toFixed(0)} CDF</p>
              {tauxChange > 0 && <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Total USD :</strong> ${(venteDetail.vente?.montant_final / tauxChange).toFixed(2)}</p>}
            </div>
            <h4 style={{ color: '#1e1b4b' }}>Articles vendus :</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead><tr style={{ background: '#1e1b4b', color: 'white' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Article</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Qté</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Prix unit.</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
              </tr></thead>
              <tbody>
                {(venteDetail.details || []).map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px' }}>{d.article_nom || d.nom}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{d.quantite}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{Number(d.prix_unitaire).toFixed(0)} CDF</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{(Number(d.prix_unitaire) * d.quantite).toFixed(0)} CDF</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => { setShowDetails(false); handleImprimerFacture(venteDetail.vente?.numero_facture); }}
              style={{ width: '100%', padding: '12px', background: '#1e1b4b', color: 'white', border: 'none', borderRadius: '8px', marginTop: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
              🖨️ Imprimer la facture
            </button>
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS CLIENT */}
      {showClientDetails && clientDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '30px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1e1b4b' }}>👤 Fiche Client</h2>
              <button onClick={() => setShowClientDetails(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
              <p style={{ margin: '6px 0' }}><strong>Nom :</strong> {clientDetail.client?.nom}</p>
              <p style={{ margin: '6px 0' }}><strong>Email :</strong> {clientDetail.client?.email || '—'}</p>
              <p style={{ margin: '6px 0' }}><strong>Téléphone :</strong> {clientDetail.client?.telephone || '—'}</p>
              <p style={{ margin: '6px 0' }}><strong>Total dépensé :</strong> {Number(clientDetail.client?.total_achats || 0).toFixed(0)} CDF
                {tauxChange > 0 && ` ($${(clientDetail.client?.total_achats / tauxChange).toFixed(2)})`}
              </p>
              <p style={{ margin: '6px 0' }}><strong>Nb achats :</strong> {clientDetail.client?.nombre_achats || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ABONNEMENT */}
      {showAbonnement && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '550px', width: '100%', padding: '30px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button onClick={() => setShowAbonnement(false)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            <h2 style={{ color: '#1e1b4b', marginTop: 0 }}>💳 Souscription & Paiement Mobile Money</h2>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1e1b4b' }}>📱 Numéro de Paiement Mobile Money :</h4>
              <p style={{ margin: '5px 0', fontSize: '20px', fontWeight: 'bold', color: '#1e1b4b', letterSpacing: '1px' }}>+243 999 068 332</p>
              <p style={{ margin: '5px 0', fontSize: '13px', color: '#64748b' }}>M-Pesa / Orange Money / Airtel Money</p>
            </div>
            <div style={{ background: '#e0e7ff', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#3730a3' }}>💎 Formules d'Abonnement :</h4>
              <ul style={{ margin: '5px 0', paddingLeft: '20px', color: '#1e1b4b', fontSize: '14px' }}>
                <li><strong>Plan Standard :</strong> 15 USD / mois</li>
                <li><strong>Plan Annuel (Réduction 20%) :</strong> 120 USD / an</li>
              </ul>
            </div>
            <a href="https://wa.me/243999068332?text=Bonjour,%20je%20souhaite%20activer%20mon%20abonnement%20Smart%20Boutique"
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', textAlign: 'center', background: '#25D366', color: 'white', padding: '14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 12px rgba(37,211,102,0.4)' }}>
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