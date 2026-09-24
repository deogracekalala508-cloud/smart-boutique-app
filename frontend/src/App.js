import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

axios.interceptors.response.use(response => response, error => {
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    window.dispatchEvent(new Event('token-expired'));
  }
  return Promise.reject(error);
});

const API_URL = 'https://smart-boutique-app-production-bbdb.up.railway.app/api';

const TYPES_PRODUITS = {
  vetement: { label: 'Vêtement / Textile', attr1: 'Taille', attr2: 'Couleur' },
  telephone: { label: 'Téléphone / Mobile', attr1: 'Modèle', attr2: 'Couleur' },
  accessoire: { label: 'Accessoire', attr1: 'Type', attr2: 'Couleur' },
  machine: { label: 'Machine / Équipement', attr1: 'Modèle', attr2: 'Référence' },
  chaussure: { label: 'Chaussure', attr1: 'Pointure', attr2: 'Couleur' },
  autre: { label: 'Autre produit', attr1: 'Attribut 1', attr2: 'Attribut 2' }
};

// ─── Composant Icônes SVG Professionnelles ─────────────────────────────────
const SVGIcon = ({ name, size = 18, color = 'currentColor', style = {} }) => {
  const icons = {
    dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z"/>,
    cart: <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>,
    box: <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15zM5 9.38v6.27l6 3.37v-6.28L5 9.38zm14 6.27V9.38l-6 3.36v6.28l6-3.37z"/>,
    history: <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>,
    users: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>,
    currency: <path d="M12.89 11.1c-1.78-.59-2.64-.96-2.64-1.9 0-1.02 1.11-1.39 1.81-1.39 1.31 0 2.22.65 2.54 1.63l2.09-.87c-.49-1.42-1.72-2.52-3.34-2.85V3.5h-2.9v2.22c-1.89.37-3.4 1.57-3.4 3.39 0 2.45 2.05 3.51 4.54 4.31 1.77.58 2.65.98 2.65 2.08 0 1.09-.94 1.62-2.04 1.62-1.67 0-2.68-.88-3.04-2.15l-2.14.88c.57 1.85 2.02 2.87 3.73 3.19v2.26h2.9v-2.29c2.05-.36 3.65-1.57 3.65-3.6 0-2.67-2.15-3.66-4.41-4.42z"/>,
    store: <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>,
    bell: <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>,
    print: <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>,
    refresh: <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>,
    check: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>,
    close: <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>,
    plus: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>,
    trash: <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>,
    alert: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>,
    pdf: <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zm5.5 2h1v-3h-1v3z"/>,
    badge: <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L9 14.17l7.59-7.59L18 8l-9 9z"/>
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      {icons[name] || null}
    </svg>
  );
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
  const [quantiteVente, setQuantiteVente] = useState('');
  const [prixNegocie, setPrixNegocie] = useState('');
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
  const [boutiqueBloquee, setBoutiqueBloquee] = useState(false);
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

  useEffect(() => {
    const handleTokenExpired = () => {
      handleLogout();
      alert("Votre session a expiré ou votre compte a été désactivé. Veuillez vous reconnecter.");
    };
    window.addEventListener('token-expired', handleTokenExpired);
    return () => window.removeEventListener('token-expired', handleTokenExpired);
  }, []);

  // ─── Chargement initial des données ───────────────────────────────────────
  const chargerArticles = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(API_URL + '/articles', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setArticles(response.data);
      localStorage.setItem('cachedArticles', JSON.stringify(response.data));
    } catch (error) {
      console.error('Erreur chargement articles:', error);
      const cached = localStorage.getItem('cachedArticles');
      if (cached) setArticles(JSON.parse(cached));
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
    setBoutiqueBloquee(false);
    try {
      const response = await axios.post(API_URL + '/boutiques/inscription-directe', {
        nom_boutique: nomBoutique, nom_admin: nomAdmin,
        email_admin: email, telephone, mot_de_passe: motDePasse
      });
      alert('Votre boutique a été créée avec succès.');
      const data = response.data;
      setUser(data.user);
      setToken(data.token);
      setConnecte(true);
      setMessage('');
      setOngletActif('dashboard');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      if (error.response && error.response.data && error.response.data.boutique_desactivee) {
        setBoutiqueBloquee(true);
        setModeInscription(false);
        setMessage(error.response.data.message);
      } else {
        setMessage(error.response ? error.response.data.message : 'Impossible de contacter le serveur. Vérifiez votre connexion internet.');
      }
    }
  };

  const handleLogin = async () => {
    if (!email || !motDePasse) { setMessage('Veuillez remplir tous les champs'); return; }
    setBoutiqueBloquee(false);
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
        if (error.response.data && error.response.data.boutique_desactivee) {
          setBoutiqueBloquee(true);
          setModeInscription(false);
          setMessage(error.response.data.message || 'Cette boutique a été désactivée par l\'administrateur.');
        } else {
          setMessage(error.response.data.message || 'Email ou mot de passe incorrect');
        }
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
      const articleAEnvoyer = { ...nouvelArticle };
      if (devise === 'USD' && tauxChange > 0) {
        articleAEnvoyer.prix_achat = nouvelArticle.prix_achat ? (parseFloat(nouvelArticle.prix_achat) * tauxChange).toFixed(2) : '';
        articleAEnvoyer.prix_vente = (parseFloat(nouvelArticle.prix_vente) * tauxChange).toFixed(2);
      }
      await axios.post(API_URL + '/articles', articleAEnvoyer, {
        headers: { Authorization: 'Bearer ' + token }
      });
      alert('Article ajouté avec succès.');
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
      alert('Vendeur créé avec succès.');
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
      alert('Vendeur désactivé avec succès.');
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
      alert('Boutique désactivée.');
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
      alert('Boutique réactivée.');
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
      alert('Client ajouté avec succès.');
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
    const qte = parseInt(quantiteVente);
    if (!articleSelectionne || isNaN(qte) || qte < 1) {
      alert('Sélectionnez un article et une quantité valide'); return;
    }
    const prix = parseFloat(prixNegocie);
    if (isNaN(prix) || prix < 0) {
      alert('Veuillez entrer un prix valide'); return;
    }
    const article = articles.find(a => a.id === parseInt(articleSelectionne));
    if (!article) { alert('Article introuvable'); return; }
    if (Number(article.quantite_stock) < qte) {
      alert(`Stock insuffisant. Disponible : ${article.quantite_stock}`); return;
    }
    const dansPanier = panier.find(item => item.article_id === article.id && item.prix_vente === prix);
    const totalQtePanier = panier.filter(i => i.article_id === article.id).reduce((sum, i) => sum + i.quantite, 0);

    if (dansPanier) {
      const nouvelleQte = dansPanier.quantite + qte;
      if (Number(article.quantite_stock) < (totalQtePanier + qte)) {
        alert(`Stock insuffisant. Déjà au panier: ${totalQtePanier}, Stock disponible: ${article.quantite_stock}`);
        return;
      }
      setPanier(panier.map(item =>
        (item.article_id === article.id && item.prix_vente === prix)
          ? { ...item, quantite: nouvelleQte }
          : item
      ));
    } else {
      if (Number(article.quantite_stock) < (totalQtePanier + qte)) {
        alert(`Stock insuffisant. Déjà au panier: ${totalQtePanier}, Stock disponible: ${article.quantite_stock}`);
        return;
      }
      setPanier([...panier, {
        article_id: article.id,
        nom: article.nom,
        prix_vente: prix,
        quantite: qte
      }]);
    }
    setArticleSelectionne('');
    setQuantiteVente('');
    setPrixNegocie('');
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

  const typeActuel = nouvelArticle.type_produit || 'vetement';
  const attr1Label = TYPES_PRODUITS[typeActuel]?.attr1 || 'Attribut 1';
  const attr2Label = TYPES_PRODUITS[typeActuel]?.attr2 || 'Attribut 2';

  // ──────────────────────────────────────────────────────────────────────────
  // CHARGEMENT INITIAL
  // ──────────────────────────────────────────────────────────────────────────
  if (chargement) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <SVGIcon name="store" size={48} color="#6366f1" />
          <h2 style={{ fontSize: '20px', margin: '16px 0 0 0', fontWeight: '600' }}>Chargement de Smart Boutique...</h2>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ECRAN LOGIN / INSCRIPTION
  // ──────────────────────────────────────────────────────────────────────────
  if (!connecte) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '20px', boxSizing: 'border-box' }}>
        <div style={{ background: 'white', padding: '36px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: '440px', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ background: '#4f46e5', width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', boxShadow: '0 10px 20px rgba(79,70,229,0.3)' }}>
              <SVGIcon name="store" size={28} color="white" />
            </div>
            <h1 style={{ color: '#0f172a', margin: 0, fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px' }}>Smart Boutique</h1>
            <p style={{ color: '#64748b', margin: '6px 0 0 0', fontSize: '14px' }}>Gestion commerciale & suivi des stocks</p>
          </div>

          <h2 style={{ color: '#334155', textAlign: 'center', fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
            {modeInscription ? 'Création de votre boutique' : 'Connexion à votre espace'}
          </h2>

          {!modeInscription ? (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Adresse Email</label>
                <input type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Mot de passe</label>
                <input type="password" placeholder="••••••••" value={motDePasse} onChange={e => setMotDePasse(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <button onClick={handleLogin} style={{ width: '100%', padding: '14px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 12px rgba(79,70,229,0.3)', transition: 'all 0.2s ease' }}>
                Se connecter
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Nom de votre boutique *" value={nomBoutique} onChange={e => setNomBoutique(e.target.value)} style={{ padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Nom du responsable *" value={nomAdmin} onChange={e => setNomAdmin(e.target.value)} style={{ padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              <input type="email" placeholder="Email professionnel *" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              <input type="tel" placeholder="Numéro de téléphone" value={telephone} onChange={e => setTelephone(e.target.value)} style={{ padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Mot de passe (8+ caractères) *" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} style={{ padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Confirmer le mot de passe *" value={motDePasseConfirm} onChange={e => setMotDePasseConfirm(e.target.value)} style={{ padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              <button onClick={handleInscriptionDirecte} style={{ padding: '14px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 12px rgba(5,150,105,0.3)', marginTop: '6px' }}>
                Créer la boutique
              </button>
            </div>
          )}

          {message && (
            <div style={{ color: '#dc2626', marginTop: '16px', textAlign: 'center', fontSize: '13px', padding: '10px 14px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <SVGIcon name="alert" size={16} color="#dc2626" />
              <span>{message}</span>
            </div>
          )}

          {!boutiqueBloquee && (
            <div style={{ marginTop: '24px', fontSize: '14px', color: '#64748b', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              {modeInscription ? 'Vous possédez déjà un compte ?' : 'Vous n\'avez pas encore de compte ?'}
              <button onClick={() => { setModeInscription(!modeInscription); setMessage(''); }} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginLeft: '6px' }}>
                {modeInscription ? 'Se connecter' : 'Créer un compte'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SUPER ADMIN VIEW
  // ──────────────────────────────────────────────────────────────────────────
  if (user && user.role === 'super_admin') {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#f8fafc' }}>
        <nav style={{ background: '#0f172a', color: 'white', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SVGIcon name="badge" size={22} color="#6366f1" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Administration Centrale — Super Admin</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#cbd5e1' }}>{user.nom}</span>
            <button onClick={handleLogout} style={{ padding: '8px 14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Déconnexion</button>
          </div>
        </nav>
        <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px', fontWeight: '700' }}>Boutiques enregistrées ({boutiques.length})</h2>
            <button onClick={chargerBoutiques} style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <SVGIcon name="refresh" size={14} color="white" /> Actualiser
            </button>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            {boutiques.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Aucune boutique inscrite</p>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Nom de la boutique</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Responsable</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Statut</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boutiques.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px' }}>{b.id}</td>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a' }}>{b.nom}</td>
                        <td style={{ padding: '12px', color: '#475569' }}>{b.proprietaire || '—'}</td>
                        <td style={{ padding: '12px', color: '#475569' }}>{b.email || '—'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: b.actif ? '#ecfdf5' : '#fef2f2', color: b.actif ? '#047857' : '#b91c1c' }}>
                            {b.actif ? 'Actif' : 'Désactivé'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {b.actif ? (
                            <button onClick={() => handleSupprimerBoutique(b.id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Désactiver</button>
                          ) : (
                            <button onClick={() => handleReactiverBoutique(b.id)} style={{ padding: '6px 12px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Réactiver</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ECRAN VENTE (Composant réutilisable Admin + Vendeur)
  // ──────────────────────────────────────────────────────────────────────────
  const EcranVente = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SVGIcon name="cart" size={22} color="#0f172a" />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Nouvelle Vente</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Devise :</span>
          <button onClick={toggleDevise} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', background: '#4f46e5', color: 'white' }}>
            {devise === 'CDF' ? 'CDF (Franc)' : 'USD (Dollar)'}
          </button>
          <span style={{ fontWeight: '600', fontSize: '12px', color: '#334155' }}>
            1 USD = {tauxChange} CDF
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* SÉLECTEUR ARTICLE */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '15px', color: '#0f172a', marginTop: 0, marginBottom: '14px', fontWeight: '600' }}>Sélection de l'article</h3>
          <select value={articleSelectionne} onChange={e => {
              const val = e.target.value;
              setArticleSelectionne(val);
              const art = articles.find(a => a.id === parseInt(val));
              if (art) {
                setPrixNegocie(art.prix_vente);
                setQuantiteVente('');
              } else {
                setPrixNegocie('');
                setQuantiteVente('');
              }
            }}
            style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>
            <option value="">-- Choisir un article en stock --</option>
            {articles.map(article => (
              <option key={article.id} value={article.id}>
                {article.nom} — {formatMontant(article.prix_vente, devise, tauxChange)} (Stock: {article.quantite_stock})
              </option>
            ))}
          </select>

          {/* Aperçu article sélectionné */}
          {articleSelectionne && (() => {
            const art = articles.find(a => a.id === parseInt(articleSelectionne));
            if (!art) return null;
            return (
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: '600', color: '#0f172a' }}>{art.nom}</div>
                <div style={{ marginTop: '4px', color: '#475569' }}>
                  Prix unitaire: <strong>{Number(art.prix_vente).toFixed(0)} CDF</strong>
                  {tauxChange > 0 && <span style={{ color: '#64748b' }}> (${(art.prix_vente / tauxChange).toFixed(2)})</span>}
                </div>
                {art.prix_achat && (
                  <div style={{ marginTop: '4px', color: '#d97706' }}>
                    Prix d'achat: <strong>{Number(art.prix_achat).toFixed(0)} CDF</strong>
                    {tauxChange > 0 && <span style={{ color: '#64748b' }}> (${(art.prix_achat / tauxChange).toFixed(2)})</span>}
                  </div>
                )}
                <div style={{ marginTop: '4px', fontSize: '12px' }}>
                  Stock disponible: <strong style={{ color: art.quantite_stock <= 5 ? '#dc2626' : '#059669' }}>{art.quantite_stock} unités</strong>
                </div>
              </div>
            );
          })()}

          {articleSelectionne && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Prix négocié (CDF)</label>
              <input type="number" placeholder="Prix de vente" value={prixNegocie}
                onChange={e => setPrixNegocie(e.target.value)}
                min="0" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Quantité à vendre</label>
            <input type="number" placeholder="0" value={quantiteVente}
              onChange={e => setQuantiteVente(e.target.value)}
              min="1" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }} />
          </div>

          <button onClick={handleAjouterAuPanier}
            style={{ width: '100%', padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <SVGIcon name="plus" size={18} color="white" /> Ajouter au panier
          </button>
        </div>

        {/* PANIER */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '15px', color: '#0f172a', marginTop: 0, marginBottom: '14px', fontWeight: '600' }}>Panier de vente</h3>

          {panier.length === 0 && !showSuccess ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0', fontSize: '14px' }}>
              <SVGIcon name="cart" size={32} color="#cbd5e1" />
              <p style={{ margin: '8px 0 0 0' }}>Votre panier est vide</p>
            </div>
          ) : panier.length > 0 ? (
            <div>
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '8px 10px' }}>Article</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px' }}>Qté</th>
                      <th style={{ textAlign: 'right', padding: '8px 10px' }}>Total CDF</th>
                      <th style={{ textAlign: 'right', padding: '8px 10px' }}>USD</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {panier.map(item => {
                      const totalItemCDF = Number(item.prix_vente) * item.quantite;
                      const totalItemUSD = tauxChange > 0 ? (totalItemCDF / tauxChange).toFixed(2) : '—';
                      return (
                        <tr key={item.article_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: '500' }}>{item.nom}</td>
                          <td style={{ textAlign: 'center', padding: '8px 10px' }}>{item.quantite}</td>
                          <td style={{ textAlign: 'right', padding: '8px 10px', fontWeight: '600' }}>{totalItemCDF.toFixed(0)} CDF</td>
                          <td style={{ textAlign: 'right', padding: '8px 10px', color: '#64748b' }}>${totalItemUSD}</td>
                          <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                            <button onClick={() => handleRetirerDuPanier(item.article_id)}
                              style={{ padding: '4px 6px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                              <SVGIcon name="close" size={14} color="#dc2626" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>TOTAL À PAYER</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{totalPanierCDF.toFixed(0)} CDF</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>ÉQUIVALENT USD</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#d97706' }}>
                      ${tauxChange > 0 ? (totalPanierCDF / tauxChange).toFixed(2) : '—'}
                    </div>
                  </div>
                </div>

                {erreurVente && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SVGIcon name="alert" size={16} color="#dc2626" />
                    <span>{erreurVente}</span>
                  </div>
                )}

                <button onClick={handleValiderVente} disabled={venteEnCours}
                  style={{ width: '100%', padding: '14px', background: venteEnCours ? '#94a3b8' : '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: venteEnCours ? 'not-allowed' : 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
                  {venteEnCours ? (
                    <>⏳ Validation en cours...</>
                  ) : (
                    <><SVGIcon name="check" size={20} color="white" /> Valider la vente</>
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {showSuccess && derniereFacture && (
            <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '10px', marginTop: '16px', border: '1px solid #a7f3d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <SVGIcon name="check" size={24} color="#047857" />
                <h3 style={{ color: '#047857', margin: 0, fontSize: '18px', fontWeight: '700' }}>Vente enregistrée avec succès</h3>
              </div>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>N° Facture :</strong> {derniereFacture.numero_facture}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                <strong>Montant :</strong> {Number(derniereFacture.montant_total || 0).toFixed(0)} CDF
                {tauxChange > 0 && <span> (${(derniereFacture.montant_total / tauxChange).toFixed(2)})</span>}
              </p>
              <button onClick={() => handleImprimerFacture(derniereFacture.numero_facture)}
                style={{ width: '100%', padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '14px', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <SVGIcon name="print" size={16} color="white" /> Imprimer la facture
              </button>
              <button onClick={() => setShowSuccess(false)}
                style={{ width: '100%', padding: '10px', background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', marginTop: '8px', fontSize: '13px' }}>
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
      <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ background: '#0f172a', color: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SVGIcon name="store" size={20} color="#6366f1" />
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{user.nom_boutique || 'Smart Boutique'}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{user.nom} (Vendeur)</span>
            <button onClick={handleLogout} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Déconnexion</button>
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
  const onglets = [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
    { id: 'vente', label: 'Caisse / Vente', icon: 'cart' },
    { id: 'articles', label: 'Articles & Stocks', icon: 'box' },
    { id: 'historique', label: 'Historique', icon: 'history' },
    { id: 'clients', label: 'Clients', icon: 'users' },
    { id: 'vendeurs', label: 'Vendeurs', icon: 'users' },
    { id: 'devises', label: 'Devises', icon: 'currency' }
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      {/* BARRE DE NAVIGATION RESPONSIVE */}
      <nav style={{ background: '#0f172a', color: 'white', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#4f46e5', width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SVGIcon name="store" size={18} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'white' }}>
            {user?.nom_boutique || 'Smart Boutique'}
          </h1>
        </div>

        {/* ONGLETS AVEC DEFILEMENT HORIZONTAL MOBILE */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', maxWidth: '100%', paddingBottom: '2px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {onglets.map(({ id, label, icon }) => (
            <button key={id}
              onClick={() => {
                setOngletActif(id);
                if (id === 'historique') chargerHistoriqueVentes();
                if (id === 'clients') chargerClients();
                if (id === 'vendeurs') chargerVendeurs();
              }}
              style={{
                padding: '7px 12px',
                background: ongletActif === id ? '#4f46e5' : 'transparent',
                color: ongletActif === id ? 'white' : '#94a3b8',
                border: 'none', cursor: 'pointer', borderRadius: '6px',
                fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center',
                gap: '6px', whiteSpace: 'nowrap'
              }}>
              <SVGIcon name={icon} size={15} color={ongletActif === id ? 'white' : '#94a3b8'} />
              {label}
            </button>
          ))}
        </div>

        {/* NOTIFICATION & PROFILE BAR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* BOUTON NOTIFICATION */}
          <button onClick={() => setShowNotifications(true)}
            style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '12px' }}>
            <SVGIcon name="bell" size={15} color="#cbd5e1" />
            <span>Alertes</span>
            {predictionsCount > 0 && (
              <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '1px 6px', fontSize: '11px', fontWeight: '700' }}>{predictionsCount}</span>
            )}
          </button>

          <button onClick={() => setShowAbonnement(true)}
            style={{ background: '#059669', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>
            Abonnement
          </button>

          <span style={{ fontWeight: '600', fontSize: '13px', color: '#cbd5e1' }}>{user?.nom}</span>
          <button onClick={handleLogout} style={{ padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Sortir</button>
        </div>
      </nav>

      {/* CONTENU PRINCIPAL */}
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* ── DASHBOARD ──────────────────────────────────────────────────── */}
        {ongletActif === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SVGIcon name="dashboard" size={22} color="#0f172a" />
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px', fontWeight: '700' }}>Tableau de Bord</h2>
              </div>
              <button onClick={chargerStatsDashboard} style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <SVGIcon name="refresh" size={14} color="white" /> Actualiser
              </button>
            </div>

            {/* KPIS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: "CHIFFRE D'AFFAIRES", val: statsDashboard?.kpi?.chiffre_affaires || 0, color: '#4f46e5' },
                { label: "BÉNÉFICE NET ESTIMÉ", val: statsDashboard?.kpi?.benefice_total || 0, color: '#059669' },
                { label: "PANIER MOYEN", val: statsDashboard?.kpi?.panier_moyen || 0, color: '#d97706' },
                { label: "VALEUR TOTALE STOCK", val: statsDashboard?.kpi?.valeur_stock || 0, color: '#7c3aed' }
              ].map((kpi, i) => (
                <div key={i} style={{ background: 'white', padding: '18px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderLeft: `4px solid ${kpi.color}` }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>{kpi.label}</span>
                  <p style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '8px 0 2px 0' }}>{Number(kpi.val).toFixed(0)} CDF</p>
                  {tauxChange > 0 && <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>${(kpi.val / tauxChange).toFixed(2)}</p>}
                </div>
              ))}
            </div>

            {/* GRAPHIQUES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              {/* Ventes 7 derniers jours */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '15px', fontWeight: '600' }}>Évolution des ventes (7 derniers jours)</h3>
                {!statsDashboard?.graph7Jours?.length ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Aucune donnée récente</p>
                ) : (
                  <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '10px', paddingTop: '20px', borderBottom: '1px solid #e2e8f0' }}>
                    {statsDashboard.graph7Jours.map((item, idx) => {
                      const max = Math.max(...statsDashboard.graph7Jours.map(g => Number(g.chiffre) || 1));
                      const h = Math.max(10, Math.round((Number(item.chiffre) / max) * 100));
                      return (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>{Number(item.chiffre) > 0 ? `${(Number(item.chiffre)/1000).toFixed(0)}k` : '0'}</span>
                          <div style={{ width: '80%', height: `${h}%`, background: '#4f46e5', borderRadius: '4px 4px 0 0' }} title={`${item.date}: ${Number(item.chiffre).toFixed(0)} CDF`} />
                          <span style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>{item.date}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Répartition par catégorie */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '15px', fontWeight: '600' }}>Répartition des ventes par catégorie</h3>
                {!statsDashboard?.repartitionCategories?.length ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Aucune vente enregistrée</p>
                ) : statsDashboard.repartitionCategories.map((cat, i) => {
                  const total = statsDashboard.repartitionCategories.reduce((acc, c) => acc + Number(c.montant_total), 0) || 1;
                  const pct = Math.round((Number(cat.montant_total) / total) * 100);
                  const couleurs = ['#4f46e5', '#059669', '#d97706', '#7c3aed', '#db2777', '#475569'];
                  return (
                    <div key={i} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ color: '#334155', fontWeight: '500' }}>{TYPES_PRODUITS[cat.type_produit]?.label || cat.type_produit}</span>
                        <strong style={{ color: '#0f172a' }}>{pct}%</strong>
                      </div>
                      <div style={{ width: '100%', background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, background: couleurs[i % 6], height: '100%', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TOP PRODUITS + PREDICTIONS STOCK */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '15px', fontWeight: '600' }}>Top 5 des produits les plus vendus</h3>
                {!statsDashboard?.topProduits?.length ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Pas encore de ventes</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead><tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Produit</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Ventes</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Revenu</th>
                      </tr></thead>
                      <tbody>
                        {statsDashboard.topProduits.map((p, idx) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px', fontWeight: '600', color: '#0f172a' }}>#{idx+1} {p.nom}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{p.quantite_vendue}</td>
                            <td style={{ padding: '8px', textAlign: 'right', color: '#059669', fontWeight: '600' }}>
                              {Number(p.total_revenu).toFixed(0)} CDF
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '15px', fontWeight: '600' }}>Alertes de stock & Réapprovisionnement</h3>
                {predictionsCount === 0 ? (
                  <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '8px', textAlign: 'center', color: '#047857', border: '1px solid #a7f3d0' }}>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '13px' }}>Les niveaux de stock sont suffisants sur l'ensemble des articles.</p>
                  </div>
                ) : statsDashboard?.predictionsStock?.map(pred => (
                  <div key={pred.id} style={{ background: pred.niveau === 'critical' ? '#fef2f2' : '#fffbe5', padding: '12px', borderRadius: '8px', marginBottom: '10px', border: `1px solid ${pred.niveau === 'critical' ? '#fecaca' : '#fef08a'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{pred.nom}</strong>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: pred.niveau === 'critical' ? '#ef4444' : '#d97706', color: 'white' }}>
                        {pred.niveau === 'critical' ? 'CRITIQUE' : 'À SURVEILLER'}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#475569' }}>
                      Stock actuel: <strong>{pred.quantite_stock}</strong> | Rupture estimée: <strong style={{ color: pred.niveau === 'critical' ? '#dc2626' : '#d97706' }}>{pred.jours_restants === 0 ? 'Imminente' : `Sous ${pred.jours_restants} jours`}</strong>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SVGIcon name="box" size={22} color="#0f172a" />
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Gestion des Articles & Stocks</h2>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={toggleDevise} style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', background: 'white', color: '#334155' }}>
                  Devise: {devise}
                </button>
                <button onClick={handleRapportStock} style={{ padding: '8px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <SVGIcon name="pdf" size={16} color="white" /> Rapport PDF
                </button>
              </div>
            </div>

            {/* Formulaire ajout article */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>Nouveau produit <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>(Saisie en {devise})</span></h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <select value={typeActuel} onChange={e => setNouvelArticle({ ...nouvelArticle, type_produit: e.target.value })}
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc', fontWeight: '600', fontSize: '13px' }}>
                  {Object.entries(TYPES_PRODUITS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input placeholder="Référence produit" value={nouvelArticle.reference} onChange={e => setNouvelArticle({ ...nouvelArticle, reference: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }} />
                <input placeholder="Désignation du produit *" value={nouvelArticle.nom} onChange={e => setNouvelArticle({ ...nouvelArticle, nom: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }} />
                <input placeholder={`Prix d'achat (${devise})`} type="number" value={nouvelArticle.prix_achat} onChange={e => setNouvelArticle({ ...nouvelArticle, prix_achat: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }} />
                <input placeholder={`Prix de vente (${devise}) *`} type="number" value={nouvelArticle.prix_vente} onChange={e => setNouvelArticle({ ...nouvelArticle, prix_vente: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }} />
                <input placeholder="Quantité initiale *" type="number" value={nouvelArticle.quantite_stock} onChange={e => setNouvelArticle({ ...nouvelArticle, quantite_stock: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }} />
                <input placeholder={attr1Label} value={nouvelArticle.taille} onChange={e => setNouvelArticle({ ...nouvelArticle, taille: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }} />
                <input placeholder={attr2Label} value={nouvelArticle.couleur} onChange={e => setNouvelArticle({ ...nouvelArticle, couleur: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }} />
              </div>
              <button onClick={handleAjouterArticle} style={{ width: '100%', padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '14px', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <SVGIcon name="plus" size={16} color="white" /> Enregistrer l'article
              </button>
            </div>

            {/* Liste articles */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>Articles enregistrés ({articles.length})</h3>
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Réf.</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Nom</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>Prix achat</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>Prix vente CDF</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>Prix USD</th>
                      <th style={{ textAlign: 'center', padding: '10px' }}>Stock</th>
                      <th style={{ textAlign: 'center', padding: '10px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map(article => (
                      <tr key={article.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', color: '#64748b' }}>{article.reference}</td>
                        <td style={{ padding: '10px', fontWeight: '600', color: '#0f172a' }}>{article.nom}</td>
                        <td style={{ textAlign: 'right', padding: '10px', color: '#64748b' }}>{Number(article.prix_achat).toFixed(0)} CDF</td>
                        <td style={{ textAlign: 'right', padding: '10px', fontWeight: '600' }}>{Number(article.prix_vente).toFixed(0)} CDF</td>
                        <td style={{ textAlign: 'right', padding: '10px', color: '#d97706', fontWeight: '600' }}>
                          {tauxChange > 0 ? `$${(article.prix_vente / tauxChange).toFixed(2)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px', color: article.quantite_stock <= 5 ? '#dc2626' : '#059669', fontWeight: '700' }}>{article.quantite_stock}</td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <button onClick={() => handleSupprimerArticle(article.id)} style={{ padding: '4px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                            <SVGIcon name="trash" size={14} color="#dc2626" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── VENTE ─────────────────────────────────────────────────────── */}
        {ongletActif === 'vente' && <EcranVente />}

        {/* ── HISTORIQUE ────────────────────────────────────────────────── */}
        {ongletActif === 'historique' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SVGIcon name="history" size={22} color="#0f172a" />
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Historique des Ventes</h2>
              </div>
              <button onClick={chargerHistoriqueVentes} style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <SVGIcon name="refresh" size={14} color="white" /> Actualiser
              </button>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              {historiqueVentes.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Aucune vente enregistrée</p>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#0f172a', color: 'white' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Facture</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Vendeur</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Montant CDF</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Montant USD</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historiqueVentes.map(vente => (
                        <tr key={vente.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontWeight: '600', color: '#0f172a' }}>{vente.numero_facture}</td>
                          <td style={{ padding: '10px', color: '#475569' }}>{new Date(vente.created_at).toLocaleString('fr-FR')}</td>
                          <td style={{ padding: '10px', color: '#475569' }}>{vente.vendeur_nom}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>{Number(vente.montant_final).toFixed(0)} CDF</td>
                          <td style={{ padding: '10px', textAlign: 'right', color: '#d97706', fontWeight: '600' }}>
                            {tauxChange > 0 ? `$${(vente.montant_final / tauxChange).toFixed(2)}` : '—'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button onClick={() => voirDetailsVente(vente.id)} style={{ padding: '5px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>Détails</button>
                            <button onClick={() => handleImprimerFacture(vente.numero_facture)} style={{ padding: '5px 10px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: '6px', fontSize: '12px' }}>
                              <SVGIcon name="print" size={14} color="white" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CLIENTS ───────────────────────────────────────────────────── */}
        {ongletActif === 'clients' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <SVGIcon name="users" size={22} color="#0f172a" />
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Fichier Clientèle</h2>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>Nouveau client</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <input placeholder="Nom complet *" value={nouveauClient.nom} onChange={e => setNouveauClient({ ...nouveauClient, nom: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }} />
                <input placeholder="Adresse email" value={nouveauClient.email} onChange={e => setNouveauClient({ ...nouveauClient, email: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }} />
                <input placeholder="Téléphone" value={nouveauClient.telephone} onChange={e => setNouveauClient({ ...nouveauClient, telephone: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }} />
                <input placeholder="Date de naissance" type="date" value={nouveauClient.date_naissance} onChange={e => setNouveauClient({ ...nouveauClient, date_naissance: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }} />
              </div>
              <button onClick={handleAjouterClient} style={{ width: '100%', padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '14px', fontWeight: '600', fontSize: '14px' }}>Ajouter le client</button>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>Clients enregistrés ({clients.length})</h3>
              {clients.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Aucun client enregistré</p>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#0f172a', color: 'white' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Nom</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Téléphone</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Nombre d'achats</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Total dépensé CDF</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>USD</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map(client => (
                        <tr key={client.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontWeight: '600', color: '#0f172a' }}>{client.nom}</td>
                          <td style={{ padding: '10px', color: '#475569' }}>{client.telephone || '—'}</td>
                          <td style={{ textAlign: 'center', padding: '10px' }}>{client.nombre_achats || 0}</td>
                          <td style={{ textAlign: 'right', padding: '10px', fontWeight: '600', color: '#0f172a' }}>{Number(client.total_achats || 0).toFixed(0)} CDF</td>
                          <td style={{ textAlign: 'right', padding: '10px', color: '#d97706', fontWeight: '600' }}>
                            {tauxChange > 0 ? `$${(client.total_achats / tauxChange).toFixed(2)}` : '—'}
                          </td>
                          <td style={{ textAlign: 'center', padding: '10px' }}>
                            <button onClick={() => voirDetailsClient(client.id)} style={{ padding: '5px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Détails</button>
                            <button onClick={() => handleSupprimerClient(client.id)} style={{ padding: '5px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', marginLeft: '6px', fontSize: '12px' }}>
                              <SVGIcon name="trash" size={14} color="#dc2626" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── VENDEURS ──────────────────────────────────────────────────── */}
        {ongletActif === 'vendeurs' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <SVGIcon name="users" size={22} color="#0f172a" />
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Gestion des Vendeurs</h2>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>Créer un compte vendeur</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <input placeholder="Nom du vendeur *" value={nouveauVendeur.nom} onChange={e => setNouveauVendeur({ ...nouveauVendeur, nom: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }} />
                <input placeholder="Email *" type="email" value={nouveauVendeur.email} onChange={e => setNouveauVendeur({ ...nouveauVendeur, email: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }} />
                <input placeholder="Mot de passe (8+ car.) *" type="password" value={nouveauVendeur.mot_de_passe} onChange={e => setNouveauVendeur({ ...nouveauVendeur, mot_de_passe: e.target.value })} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }} />
              </div>
              <button onClick={handleAjouterVendeur} style={{ width: '100%', padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '14px', fontWeight: '600', fontSize: '14px' }}>Créer le vendeur</button>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>Vendeurs enregistrés ({vendeurs.length})</h3>
              {vendeurs.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>Aucun vendeur créé</p>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead><tr style={{ background: '#0f172a', color: 'white' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Nom</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Statut</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                    </tr></thead>
                    <tbody>
                      {vendeurs.map(v => (
                        <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontWeight: '600', color: '#0f172a' }}>{v.nom}</td>
                          <td style={{ padding: '10px', color: '#475569' }}>{v.email}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: v.actif ? '#ecfdf5' : '#fef2f2', color: v.actif ? '#047857' : '#b91c1c' }}>
                              {v.actif ? 'Actif' : 'Désactivé'}
                            </span>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            {v.actif && <button onClick={() => handleDesactiverVendeur(v.id)} style={{ padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>Désactiver</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DEVISES & CONVERTISSEUR ───────────────────────────────────── */}
        {ongletActif === 'devises' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <SVGIcon name="currency" size={22} color="#0f172a" />
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Gestion des Devises</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Configuration Taux */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '15px', fontWeight: '600' }}>Taux de change principal</h3>
                <div style={{ background: '#ecfdf5', padding: '14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #a7f3d0' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#047857', fontWeight: '600' }}>TAUX ACTUEL</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#047857' }}>1 USD = {tauxChange} CDF</p>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: 0 }}>Saisissez le nouveau taux de change du marché :</p>
                <input type="number" placeholder="Ex: 2800" value={nouveauTaux} onChange={e => setNouveauTaux(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', marginBottom: '12px' }} />
                <button onClick={sauvegarderTaux} style={{ width: '100%', padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                  Mettre à jour le taux
                </button>

                <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <h4 style={{ color: '#0f172a', fontSize: '13px', margin: '0 0 10px 0', fontWeight: '600' }}>Devise d'affichage de l'application</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['CDF', 'USD'].map(d => (
                      <button key={d} onClick={() => { setDevise(d); localStorage.setItem('devise', d); }}
                        style={{ flex: 1, padding: '10px', background: devise === d ? '#4f46e5' : '#f1f5f9', color: devise === d ? 'white' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                        {d === 'CDF' ? 'CDF (Franc Congolais)' : 'USD (Dollar US)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Convertisseur */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '15px', fontWeight: '600' }}>Convertisseur instantané</h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: 0 }}>Taux: <strong>1 USD = {tauxChange} CDF</strong></p>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                  <button onClick={() => setShowConvertisseur(false)}
                    style={{ flex: 1, padding: '8px', background: !showConvertisseur ? '#4f46e5' : '#f1f5f9', color: !showConvertisseur ? 'white' : '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                    CDF → USD
                  </button>
                  <button onClick={() => setShowConvertisseur(true)}
                    style={{ flex: 1, padding: '8px', background: showConvertisseur ? '#4f46e5' : '#f1f5f9', color: showConvertisseur ? 'white' : '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                    USD → CDF
                  </button>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                    Montant en {showConvertisseur ? 'USD' : 'CDF'} :
                  </label>
                  <input type="number" placeholder={showConvertisseur ? "Montant en USD..." : "Montant en CDF..."} value={montantAConvertir}
                    onChange={e => setMontantAConvertir(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', marginTop: '4px' }} />
                </div>
                {montantAConvertir && !isNaN(parseFloat(montantAConvertir)) && tauxChange > 0 && (
                  <div style={{ background: '#0f172a', padding: '16px', borderRadius: '10px', textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{Number(montantAConvertir).toFixed(showConvertisseur ? 2 : 0)} {showConvertisseur ? 'USD' : 'CDF'} =</div>
                    <div style={{ fontSize: '26px', fontWeight: '700', marginTop: '4px' }}>
                      {showConvertisseur
                        ? `${(parseFloat(montantAConvertir) * tauxChange).toFixed(0)} CDF`
                        : `$${(parseFloat(montantAConvertir) / tauxChange).toFixed(2)}`}
                    </div>
                  </div>
                )}
                {/* Tableau de référence */}
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ color: '#0f172a', fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>Équivalence de référence :</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead><tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>USD</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>CDF</th>
                    </tr></thead>
                    <tbody>
                      {[1, 5, 10, 20, 50, 100].map(usd => (
                        <tr key={usd} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 8px' }}>${usd}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '600' }}>{(usd * tauxChange).toFixed(0)} CDF</td>
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

      {/* ── MODAL NOTIFICATIONS STOCK (AVEC OVERLAY ET ADAPTATION MOBILE) ──── */}
      {showNotifications && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '16px', boxSizing: 'border-box' }}
          onClick={() => setShowNotifications(false)}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SVGIcon name="bell" size={20} color="#4f46e5" />
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: '700' }}>Alertes de réapprovisionnement</h3>
              </div>
              <button onClick={() => setShowNotifications(false)} style={{ background: '#f1f5f9', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {predictionsCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#059669' }}>
                <SVGIcon name="check" size={36} color="#059669" />
                <p style={{ margin: '10px 0 0 0', fontWeight: '600', fontSize: '14px' }}>Niveau de stock optimal sur tous les articles.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {statsDashboard?.predictionsStock?.map(pred => (
                  <div key={pred.id} style={{
                    background: pred.niveau === 'critical' ? '#fef2f2' : '#fffbe5',
                    padding: '12px 14px', borderRadius: '10px',
                    borderLeft: `4px solid ${pred.niveau === 'critical' ? '#dc2626' : '#d97706'}`,
                    borderTop: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>{pred.nom}</div>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Stock restant: <strong>{pred.quantite_stock}</strong></span>
                      <span style={{ fontWeight: '700', color: pred.niveau === 'critical' ? '#dc2626' : '#d97706' }}>
                        {pred.jours_restants === 0 ? 'Rupture imminente' : `Rupture sous ${pred.jours_restants}j`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS VENTE */}
      {showDetails && venteDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '16px', boxSizing: 'border-box' }}
          onClick={() => setShowDetails(false)}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>Détails de la Vente</h3>
              <button onClick={() => setShowDetails(false)} style={{ background: '#f1f5f9', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>N° Facture :</strong> {venteDetail.vente?.numero_facture}</p>
              <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Date :</strong> {venteDetail.vente?.created_at ? new Date(venteDetail.vente.created_at).toLocaleString('fr-FR') : '—'}</p>
              <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Vendeur :</strong> {venteDetail.vente?.vendeur_nom}</p>
              <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Total CDF :</strong> {Number(venteDetail.vente?.montant_final || 0).toFixed(0)} CDF</p>
              {tauxChange > 0 && <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Total USD :</strong> ${(venteDetail.vente?.montant_final / tauxChange).toFixed(2)}</p>}
            </div>
            <h4 style={{ color: '#0f172a', fontSize: '14px', marginBottom: '8px' }}>Articles vendus :</h4>
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ background: '#0f172a', color: 'white' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Article</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Qté</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Prix unitaire</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                </tr></thead>
                <tbody>
                  {(venteDetail.details || []).map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>{d.article_nom || d.nom}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{d.quantite}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{Number(d.prix_unitaire).toFixed(0)} CDF</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>{(Number(d.prix_unitaire) * d.quantite).toFixed(0)} CDF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => { setShowDetails(false); handleImprimerFacture(venteDetail.vente?.numero_facture); }}
              style={{ width: '100%', padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', marginTop: '16px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}>
              <SVGIcon name="print" size={16} color="white" /> Imprimer la facture
            </button>
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS CLIENT */}
      {showClientDetails && clientDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '16px', boxSizing: 'border-box' }}
          onClick={() => setShowClientDetails(false)}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>Fiche Client</h3>
              <button onClick={() => setShowClientDetails(false)} style={{ background: '#f1f5f9', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '6px 0', fontSize: '14px' }}><strong>Nom :</strong> {clientDetail.client?.nom}</p>
              <p style={{ margin: '6px 0', fontSize: '14px' }}><strong>Email :</strong> {clientDetail.client?.email || '—'}</p>
              <p style={{ margin: '6px 0', fontSize: '14px' }}><strong>Téléphone :</strong> {clientDetail.client?.telephone || '—'}</p>
              <p style={{ margin: '6px 0', fontSize: '14px' }}><strong>Total dépensé :</strong> {Number(clientDetail.client?.total_achats || 0).toFixed(0)} CDF
                {tauxChange > 0 && ` ($${(clientDetail.client?.total_achats / tauxChange).toFixed(2)})`}
              </p>
              <p style={{ margin: '6px 0', fontSize: '14px' }}><strong>Nombre d'achats :</strong> {clientDetail.client?.nombre_achats || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ABONNEMENT */}
      {showAbonnement && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '16px', boxSizing: 'border-box' }}
          onClick={() => setShowAbonnement(false)}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>Souscription & Réabonnement</h3>
              <button onClick={() => setShowAbonnement(false)} style={{ background: '#f1f5f9', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '14px', fontWeight: '600' }}>Paiement Mobile Money</h4>
              <p style={{ margin: '4px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a', letterSpacing: '0.5px' }}>+243 999 068 332</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Accepté : M-Pesa, Orange Money, Airtel Money</p>
            </div>
            <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #a7f3d0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#047857', fontSize: '14px', fontWeight: '600' }}>Formules disponibles :</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#0f172a', fontSize: '14px' }}>
                <li style={{ marginBottom: '4px' }}><strong>Plan Standard :</strong> 15 USD / mois</li>
                <li><strong>Plan Annuel :</strong> 120 USD / an (-20%)</li>
              </ul>
            </div>
            <a href="https://wa.me/243999068332?text=Bonjour,%20je%20souhaite%20activer%20mon%20abonnement%20Smart%20Boutique"
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', textAlign: 'center', background: '#25D366', color: 'white', padding: '14px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '15px', boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}>
              Activer par WhatsApp
            </a>
            <button onClick={() => setShowAbonnement(false)} style={{ width: '100%', padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', marginTop: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;