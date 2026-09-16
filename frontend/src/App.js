import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ============================================================
// URL DU BACKEND EN LIGNE
// ============================================================
const API_URL = 'https://smart-boutique-3bfg.onrender.com/api';

function App() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [connecte, setConnecte] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  
  const [ongletActif, setOngletActif] = useState('vente');
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
    prix_vente: '', quantite_stock: '', taille: '', couleur: ''
  });
  
  const [modeInscription, setModeInscription] = useState(false);
  const [nomBoutique, setNomBoutique] = useState('');
  const [nomAdmin, setNomAdmin] = useState('');
  const [telephone, setTelephone] = useState('');
  const [motDePasseConfirm, setMotDePasseConfirm] = useState('');
  const [etapeInscription, setEtapeInscription] = useState(1);
  const [codeVerification, setCodeVerification] = useState('');
  const [boutiques, setBoutiques] = useState([]);

  useEffect(() => {
    if (connecte) {
      if (user.role === 'admin') {
        chargerArticles();
        chargerVentesJour();
        chargerHistoriqueVentes();
        chargerClients();
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
      const response = await axios.get(`${API_URL}/articles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArticles(response.data);
    } catch (error) {
      console.error('Erreur chargement articles:', error);
    }
  };

  const chargerVentesJour = async () => {
    try {
      const response = await axios.get(`${API_URL}/ventes/aujourdhui`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVentesJour(response.data);
    } catch (error) {
      console.error('Erreur chargement ventes:', error);
    }
  };

  const chargerHistoriqueVentes = async () => {
    try {
      const response = await axios.get(`${API_URL}/ventes/historique`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoriqueVentes(response.data);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  const chargerClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const chargerBoutiques = async () => {
    try {
      const response = await axios.get(`${API_URL}/boutiques/toutes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBoutiques(response.data);
    } catch (error) {
      console.error('Erreur chargement boutiques:', error);
    }
  };

  const handleSupprimerBoutique = async (id) => {
    if (window.confirm('Desactiver cette boutique ? Tous ses utilisateurs ne pourront plus se connecter.')) {
      try {
        await axios.delete(`${API_URL}/boutiques/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Boutique desactivee');
        chargerBoutiques();
      } catch (error) {
        alert('Erreur : ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleReactiverBoutique = async (id) => {
    if (window.confirm('Reactiver cette boutique ?')) {
      try {
        await axios.put(`${API_URL}/boutiques/${id}/reactiver`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Boutique reactivee');
        chargerBoutiques();
      } catch (error) {
        alert('Erreur : ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const voirDetailsVente = async (venteId) => {
    try {
      const response = await axios.get(`${API_URL}/ventes/details/${venteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVenteDetail(response.data);
      setShowDetails(true);
    } catch (error) {
      alert('Erreur lors du chargement des details');
    }
  };

  const voirDetailsClient = async (clientId) => {
    try {
      const response = await axios.get(`${API_URL}/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientDetail(response.data);
      setShowClientDetails(true);
    } catch (error) {
      alert('Erreur lors du chargement');
    }
  };

  const handleLogin = async () => {
    if (!email || !motDePasse) {
      setMessage('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: email, mot_de_passe: motDePasse
      });
      
      setUser(response.data.user);
      setToken(response.data.token);
      setConnecte(true);
      setMessage('');
      
      if (response.data.user.role === 'vendeur') {
        setOngletActif('vente');
      } else {
        setOngletActif('dashboard');
      }
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || 'Email ou mot de passe incorrect');
      } else {
        setMessage('Impossible de contacter le serveur. Verifiez votre connexion internet.');
      }
    }
  };

  const handleInscriptionEtape1 = async () => {
    if (!nomBoutique || !nomAdmin || !email || !motDePasse) {
      setMessage('Tous les champs obligatoires doivent etre remplis');
      return;
    }
    
    if (motDePasse !== motDePasseConfirm) {
      setMessage('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (motDePasse.length < 8) {
      setMessage('Le mot de passe doit avoir au moins 8 caracteres');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/boutiques/inscription-etape1`, {
        nom_boutique: nomBoutique,
        nom_admin: nomAdmin,
        email_admin: email,
        telephone: telephone,
        mot_de_passe: motDePasse,
        mot_de_passe_confirm: motDePasseConfirm
      });
      
      alert('Code de verification envoye ! Verifiez votre email et vos spams.');
      setEtapeInscription(2);
      setMessage('');
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  };

  const handleInscriptionEtape2 = async () => {
    if (!codeVerification) {
      setMessage('Veuillez entrer le code de verification');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/boutiques/inscription-etape2`, {
        email: email,
        code: codeVerification
      });
      
      alert('Boutique creee avec succes ! Connectez-vous maintenant.');
      setModeInscription(false);
      setEtapeInscription(1);
      setMessage('');
      setEmail('');
      setMotDePasse('');
      setMotDePasseConfirm('');
      setNomBoutique('');
      setNomAdmin('');
      setTelephone('');
      setCodeVerification('');
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de la verification');
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleAjouterArticle = async () => {
    try {
      await axios.post(`${API_URL}/articles`, nouvelArticle, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Article ajoute !');
      setNouvelArticle({ reference: '', nom: '', description: '', prix_achat: '', prix_vente: '', quantite_stock: '', taille: '', couleur: '' });
      chargerArticles();
    } catch (error) {
      alert('Erreur : ' + (error.response?.data?.message || 'Erreur lors de l\'ajout'));
    }
  };

  const handleSupprimerArticle = async (id) => {
    if (window.confirm('Supprimer cet article ?')) {
      try {
        await axios.delete(`${API_URL}/articles/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        chargerArticles();
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
      await axios.post(`${API_URL}/clients`, nouveauClient, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Client ajoute !');
      setNouveauClient({ nom: '', email: '', telephone: '', adresse: '', date_naissance: '' });
      chargerClients();
    } catch (error) {
      alert('Erreur lors de l\'ajout');
    }
  };

  const handleSupprimerClient = async (id) => {
    if (window.confirm('Supprimer ce client ?')) {
      try {
        await axios.delete(`${API_URL}/clients/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        chargerClients();
      } catch (error) {
        alert('Erreur');
      }
    }
  };

  const handleAjouterAuPanier = () => {
    if (!articleSelectionne || quantiteVente < 1) {
      alert('Selectionnez un article et une quantite valide');
      return;
    }
    const article = articles.find(a => a.id === parseInt(articleSelectionne));
    if (!article) { alert('Article introuvable'); return; }
    
    const dansPanier = panier.find(item => item.article_id === article.id);
    if (dansPanier) {
      setPanier(panier.map(item => item.article_id === article.id ? {...item, quantite: item.quantite + quantiteVente} : item));
    } else {
      setPanier([...panier, { article_id: article.id, nom: article.nom, prix_vente: article.prix_vente, quantite: quantiteVente }]);
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
      const response = await axios.post(`${API_URL}/ventes`, {
        articles: panier, mode_paiement: 'especes', devise: 'CDF'
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setDerniereFacture(response.data.vente);
      setShowSuccess(true);
      setPanier([]);
      chargerArticles();
      if (user.role === 'admin') {
        chargerVentesJour();
        chargerHistoriqueVentes();
      }
    } catch (error) {
      alert((error.response?.data?.message || 'Erreur lors de la vente'));
    }
  };

  const handleImprimerFacture = (numeroFacture) => {
    const url = `https://smart-boutique-3bfg.onrender.com/api/ventes/facture-html/${numeroFacture}`;
    const win = window.open(url, '_blank', 'width=600,height=800');
    if (!win) alert('Veuillez autoriser les pop-ups');
  };

  const handleRapportStock = async () => {
    try {
      const response = await axios.get(`${API_URL}/articles/rapport-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `stock_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      alert('Rapport du stock telecharge !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du telechargement du rapport');
    }
  };

  const totalPanier = panier.reduce((total, item) => total + (item.prix_vente * item.quantite), 0);

  // PAGE CONNEXION / INSCRIPTION
  if (!connecte) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a237e 0%, #4a148c 100%)', fontFamily: 'Arial', padding: '20px' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', width: '450px' }}>
          <h1 style={{ color: '#1a237e', textAlign: 'center', marginBottom: '10px' }}>Smart Boutique</h1>
          <h2 style={{ color: '#666', textAlign: 'center', fontSize: '18px' }}>
            {modeInscription ? `Inscription (Etape ${etapeInscription}/2)` : 'Connexion'}
          </h2>
          
          {!modeInscription && (
            <>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Mot de passe" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', boxSizing: 'border-box' }} />
              <button onClick={handleLogin} style={{ width: '100%', padding: '12px', background: '#1a237e', color: 'white', border: 'none', borderRadius: '5px', fontSize: '18px', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold' }}>Se connecter</button>
            </>
          )}
          
          {modeInscription && etapeInscription === 1 && (
            <>
              <input type="text" placeholder="Nom de votre boutique *" value={nomBoutique} onChange={(e) => setNomBoutique(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Votre nom complet *" value={nomAdmin} onChange={(e) => setNomAdmin(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', boxSizing: 'border-box' }} />
              <input type="email" placeholder="Email (Gmail, Yahoo, etc.) *" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', boxSizing: 'border-box' }} />
              <input type="tel" placeholder="Telephone (0999068332)" value={telephone} onChange={(e) => setTelephone(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Mot de passe (8+ caracteres) *" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Confirmer le mot de passe *" value={motDePasseConfirm} onChange={(e) => setMotDePasseConfirm(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', boxSizing: 'border-box' }} />
              
              <div style={{ background: '#f0f4ff', padding: '10px', borderRadius: '5px', fontSize: '12px', color: '#555', margin: '10px 0' }}>
                <strong>Mot de passe requis :</strong><br/>
                8 caracteres minimum<br/>
                1 majuscule + 1 minuscule<br/>
                1 chiffre + 1 caractere special (!@#$%)
              </div>
              
              <button onClick={handleInscriptionEtape1} style={{ width: '100%', padding: '12px', background: '#1a237e', color: 'white', border: 'none', borderRadius: '5px', fontSize: '18px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }}>Envoyer le code</button>
            </>
          )}
          
          {modeInscription && etapeInscription === 2 && (
            <>
              <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '5px', marginBottom: '15px', textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#2e7d32', fontSize: '14px' }}>Un code de verification a ete envoye a</p>
                <strong style={{ color: '#1a237e' }}>{email}</strong>
                <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px' }}>Verifiez vos spams si vous ne le voyez pas</p>
              </div>
              
              <input type="text" placeholder="000000" value={codeVerification} onChange={(e) => setCodeVerification(e.target.value.replace(/\D/g, ''))} maxLength="6" style={{ width: '100%', padding: '15px', margin: '10px 0', border: '2px solid #1a237e', borderRadius: '5px', fontSize: '28px', textAlign: 'center', letterSpacing: '10px', boxSizing: 'border-box', fontWeight: 'bold' }} />
              
              <button onClick={handleInscriptionEtape2} style={{ width: '100%', padding: '12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', fontSize: '18px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }}>Verifier et creer</button>
              
              <button onClick={() => { setEtapeInscription(1); setCodeVerification(''); setMessage(''); }} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#666', border: 'none', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}>Retour</button>
            </>
          )}
          
          {message && (
            <p style={{ color: 'red', marginTop: '15px', textAlign: 'center', fontSize: '14px', padding: '10px', background: '#ffe6e6', borderRadius: '5px' }}>
              {message}
            </p>
          )}
          
          <p style={{ marginTop: '20px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
            {modeInscription ? 'Deja un compte ?' : 'Nouvelle boutique ?'}
            <button onClick={() => { setModeInscription(!modeInscription); setEtapeInscription(1); setMessage(''); }} style={{ background: 'none', border: 'none', color: '#1a237e', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginLeft: '5px', textDecoration: 'underline' }}>
              {modeInscription ? 'Se connecter' : 'Creer un compte'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ECRAN SUPER ADMIN
  if (user.role === 'super_admin') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f5f5f5' }}>
        <nav style={{ background: '#1a237e', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Smart Boutique - Super Admin</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontWeight: 'bold' }}>{user.nom}</span>
            <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Deconnexion</button>
          </div>
        </nav>
        
        <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
          <h2>Toutes les boutiques ({boutiques.length})</h2>
          
          <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginTop: '20px', overflowX: 'auto' }}>
            {boutiques.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '30px' }}>Aucune boutique enregistree</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a237e', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Nom boutique</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Proprietaire</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Telephone</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Utilisateurs</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Statut</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {boutiques.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{b.id}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{b.nom}</td>
                      <td style={{ padding: '10px' }}>{b.proprietaire || '-'}</td>
                      <td style={{ padding: '10px' }}>{b.telephone || '-'}</td>
                      <td style={{ padding: '10px' }}>{b.email || '-'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{b.nb_utilisateurs || 0}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '5px 12px', 
                          borderRadius: '15px', 
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: b.actif ? '#e8f5e9' : '#ffebee',
                          color: b.actif ? '#2e7d32' : '#c62828'
                        }}>
                          {b.actif ? 'Actif' : 'Desactive'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {b.actif ? (
                          <button onClick={() => handleSupprimerBoutique(b.id)} style={{ padding: '8px 15px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>Couper</button>
                        ) : (
                          <button onClick={() => handleReactiverBoutique(b.id)} style={{ padding: '8px 15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>Reactiver</button>
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

  // ECRAN VENDEUR
  if (user.role === 'vendeur') {
    return (
      <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f0f0f0' }}>
        <div style={{ background: '#1a237e', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Smart Boutique</h1>
          <div>
            <span style={{ marginRight: '15px' }}>{user.nom}</span>
            <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Deconnexion</button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px' }}>Selectionner un article</h2>
            <select value={articleSelectionne} onChange={(e) => setArticleSelectionne(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px' }}>
              <option value="">-- Choisir --</option>
              {articles.map(article => (
                <option key={article.id} value={article.id}>{article.nom} - {article.prix_vente} CDF</option>
              ))}
            </select>
            <input type="number" placeholder="Quantite" value={quantiteVente} onChange={(e) => setQuantiteVente(parseInt(e.target.value))} min="1" style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', boxSizing: 'border-box' }} />
            <button onClick={handleAjouterAuPanier} style={{ width: '100%', padding: '15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }}>Ajouter</button>
          </div>
          
          <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px' }}>Panier</h2>
            {panier.length === 0 && !showSuccess ? (
              <p style={{ color: '#999', textAlign: 'center', marginTop: '50px' }}>Le panier est vide</p>
            ) : panier.length > 0 ? (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Article</th>
                      <th style={{ textAlign: 'center', padding: '8px' }}>Qte</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
                      <th style={{ textAlign: 'center', padding: '8px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {panier.map(item => (
                      <tr key={item.article_id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ textAlign: 'left', padding: '8px' }}>{item.nom}</td>
                        <td style={{ textAlign: 'center', padding: '8px' }}>{item.quantite}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{item.prix_vente * item.quantite} CDF</td>
                        <td style={{ textAlign: 'center', padding: '8px' }}>
                          <button onClick={() => handleRetirerDuPanier(item.article_id)} style={{ padding: '5px 10px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>X</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '2px solid #ddd', paddingTop: '20px' }}>
                  <h2 style={{ fontSize: '28px', color: '#1a237e' }}>{totalPanier} CDF</h2>
                  <p style={{ color: '#666' }}>{(totalPanier / 2800).toFixed(2)} USD</p>
                  <button onClick={handleValiderVente} style={{ width: '100%', padding: '15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>VALIDER LA VENTE</button>
                </div>
              </>
            ) : null}
            
            {showSuccess && derniereFacture && (
              <div style={{ background: '#e8f5e9', padding: '20px', borderRadius: '10px', marginTop: '20px', textAlign: 'center', border: '2px solid #4CAF50' }}>
                <h3 style={{ color: '#2e7d32' }}>VENTE REUSSIE !</h3>
                <p><strong>Facture :</strong> {derniereFacture.numero_facture}</p>
                <p><strong>Benefice :</strong> {derniereFacture.benefice} CDF</p>
                <button onClick={() => handleImprimerFacture(derniereFacture.numero_facture)} style={{ width: '100%', padding: '12px', background: '#1a237e', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>Imprimer la facture</button>
                <button onClick={() => setShowSuccess(false)} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}>Fermer</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ECRAN ADMIN
  return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f5f5f5' }}>
      <nav style={{ background: '#1a237e', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0 }}>Smart Boutique</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setOngletActif('dashboard')} style={{ padding: '10px 20px', background: ongletActif === 'dashboard' ? '#ffd700' : 'transparent', color: ongletActif === 'dashboard' ? '#1a237e' : 'white', border: 'none', cursor: 'pointer', fontSize: '16px', borderRadius: '5px', fontWeight: 'bold' }}>Tableau de bord</button>
          <button onClick={() => setOngletActif('articles')} style={{ padding: '10px 20px', background: ongletActif === 'articles' ? '#ffd700' : 'transparent', color: ongletActif === 'articles' ? '#1a237e' : 'white', border: 'none', cursor: 'pointer', fontSize: '16px', borderRadius: '5px', fontWeight: 'bold' }}>Articles</button>
          <button onClick={() => setOngletActif('vente')} style={{ padding: '10px 20px', background: ongletActif === 'vente' ? '#ffd700' : 'transparent', color: ongletActif === 'vente' ? '#1a237e' : 'white', border: 'none', cursor: 'pointer', fontSize: '16px', borderRadius: '5px', fontWeight: 'bold' }}>Vente</button>
          <button onClick={() => { setOngletActif('historique'); chargerHistoriqueVentes(); }} style={{ padding: '10px 20px', background: ongletActif === 'historique' ? '#ffd700' : 'transparent', color: ongletActif === 'historique' ? '#1a237e' : 'white', border: 'none', cursor: 'pointer', fontSize: '16px', borderRadius: '5px', fontWeight: 'bold' }}>Historique</button>
          <button onClick={() => { setOngletActif('clients'); chargerClients(); }} style={{ padding: '10px 20px', background: ongletActif === 'clients' ? '#ffd700' : 'transparent', color: ongletActif === 'clients' ? '#1a237e' : 'white', border: 'none', cursor: 'pointer', fontSize: '16px', borderRadius: '5px', fontWeight: 'bold' }}>Clients</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontWeight: 'bold' }}>{user.nom} (admin)</span>
          <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Deconnexion</button>
        </div>
      </nav>

      <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {ongletActif === 'dashboard' && (
          <div>
            <h2>Tableau de bord</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
              <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                <h3>Articles en stock</h3>
                <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#1a237e' }}>{articles.length}</p>
              </div>
              <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                <h3>Valeur du stock</h3>
                <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#1a237e' }}>
                  {articles.reduce((total, art) => total + (art.prix_vente * (art.quantite_stock || 0)), 0).toFixed(0)} CDF
                </p>
              </div>
              <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                <h3>Benefice potentiel</h3>
                <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#2e7d32' }}>
                  {articles.reduce((total, art) => total + ((art.prix_vente - art.prix_achat) * (art.quantite_stock || 0)), 0).toFixed(0)} CDF
                </p>
              </div>
            </div>
            
            {ventesJour && (
              <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginTop: '20px' }}>
                <h3>Ventes du jour</h3>
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginTop: '15px' }}>
                  <p><strong>Nombre de ventes :</strong> {ventesJour.stats.nombre_ventes || 0}</p>
                  <p><strong>Chiffre d'affaires :</strong> {ventesJour.stats.chiffre_affaires || 0} CDF</p>
                  <p style={{ color: '#2e7d32' }}><strong>Benefice :</strong> {ventesJour.stats.benefice || 0} CDF</p>
                </div>
              </div>
            )}
          </div>
        )}

        {ongletActif === 'articles' && (
          <div>
            <h2>Gestion des articles</h2>
            <button onClick={handleRapportStock} style={{ padding: '12px 25px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>
              Telecharger le rapport du stock (PDF)
            </button>
            
            <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
              <h3>Ajouter un nouvel article</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <input placeholder="Reference *" value={nouvelArticle.reference} onChange={(e) => setNouvelArticle({...nouvelArticle, reference: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }} />
                <input placeholder="Nom *" value={nouvelArticle.nom} onChange={(e) => setNouvelArticle({...nouvelArticle, nom: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }} />
                <input placeholder="Prix d'achat (CDF) *" type="number" value={nouvelArticle.prix_achat} onChange={(e) => setNouvelArticle({...nouvelArticle, prix_achat: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }} />
                <input placeholder="Prix de vente (CDF) *" type="number" value={nouvelArticle.prix_vente} onChange={(e) => setNouvelArticle({...nouvelArticle, prix_vente: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }} />
                <input placeholder="Quantite *" type="number" value={nouvelArticle.quantite_stock} onChange={(e) => setNouvelArticle({...nouvelArticle, quantite_stock: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }} />
                <input placeholder="Taille" value={nouvelArticle.taille} onChange={(e) => setNouvelArticle({...nouvelArticle, taille: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }} />
                <input placeholder="Couleur" value={nouvelArticle.couleur} onChange={(e) => setNouvelArticle({...nouvelArticle, couleur: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handleAjouterArticle} style={{ width: '100%', padding: '12px', background: '#1a237e', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', marginTop: '15px' }}>Ajouter l'article</button>
            </div>

            <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
              <h3>Articles en stock ({articles.length})</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Reference</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Nom</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>Prix achat</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>Prix vente</th>
                    <th style={{ textAlign: 'center', padding: '10px' }}>Stock</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>Benefice</th>
                    <th style={{ textAlign: 'center', padding: '10px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map(article => (
                    <tr key={article.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ textAlign: 'left', padding: '8px' }}>{article.reference}</td>
                      <td style={{ textAlign: 'left', padding: '8px' }}>{article.nom}</td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>{article.prix_achat} CDF</td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>{article.prix_vente} CDF</td>
                      <td style={{ textAlign: 'center', padding: '8px', color: article.quantite_stock <= 5 ? 'red' : 'green', fontWeight: 'bold' }}>{article.quantite_stock}</td>
                      <td style={{ textAlign: 'right', padding: '8px', color: '#2e7d32' }}>{(article.prix_vente - article.prix_achat).toFixed(0)} CDF</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <button onClick={() => handleSupprimerArticle(article.id)} style={{ padding: '5px 10px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Suppr</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {ongletActif === 'historique' && (
          <div>
            <h2>Historique des ventes</h2>
            
            {historiqueVentes.length === 0 ? (
              <div style={{ background: 'white', padding: '50px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center', marginTop: '20px' }}>
                <p style={{ color: '#999', fontSize: '18px' }}>Aucune vente enregistree pour le moment</p>
              </div>
            ) : (
              <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflowX: 'auto', marginTop: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a237e', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>N Facture</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Vendeur</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Montant</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Details</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Facture</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historiqueVentes.map(vente => (
                      <tr key={vente.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{vente.numero_facture}</td>
                        <td style={{ padding: '10px' }}>{new Date(vente.created_at).toLocaleString('fr-FR')}</td>
                        <td style={{ padding: '10px' }}>{vente.vendeur_nom}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#1a237e' }}>
                          {Number(vente.montant_final).toFixed(0)} CDF
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button onClick={() => voirDetailsVente(vente.id)} style={{ padding: '8px 15px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Voir</button>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button onClick={() => handleImprimerFacture(vente.numero_facture)} style={{ padding: '8px 15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Impr</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {showDetails && venteDetail && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                  <h3 style={{ color: '#1a237e', textAlign: 'center' }}>Details de la vente</h3>
                  <p><strong>N Facture :</strong> {venteDetail.vente.numero_facture}</p>
                  <p><strong>Date :</strong> {new Date(venteDetail.vente.created_at).toLocaleString('fr-FR')}</p>
                  <p><strong>Vendeur :</strong> {venteDetail.vente.vendeur_nom}</p>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Article</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Qte</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Prix</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {venteDetail.details.map(d => {
                        const prixUnitaire = Number(d.prix_unitaire) || 0;
                        const quantite = Number(d.quantite) || 0;
                        return (
                          <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px' }}>{d.article_nom}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{quantite}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{prixUnitaire.toFixed(0)} CDF</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{(prixUnitaire * quantite).toFixed(0)} CDF</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <p><strong>TOTAL :</strong> {Number(venteDetail.vente.montant_final).toFixed(0)} CDF</p>
                    <p style={{ color: 'green' }}><strong>BENEFICE :</strong> {Number(venteDetail.benefice_total).toFixed(0)} CDF</p>
                  </div>
                  
                  <button onClick={() => setShowDetails(false)} style={{ width: '100%', padding: '12px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', marginTop: '20px' }}>Fermer</button>
                </div>
              </div>
            )}
          </div>
        )}

        {ongletActif === 'clients' && (
          <div>
            <h2>Gestion des clients</h2>
            
            <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
              <h3>Ajouter un client</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <input placeholder="Nom *" value={nouveauClient.nom} onChange={(e) => setNouveauClient({...nouveauClient, nom: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }} />
                <input placeholder="Email" value={nouveauClient.email} onChange={(e) => setNouveauClient({...nouveauClient, email: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }} />
                <input placeholder="Telephone" value={nouveauClient.telephone} onChange={(e) => setNouveauClient({...nouveauClient, telephone: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }} />
                <input placeholder="Date de naissance" type="date" value={nouveauClient.date_naissance} onChange={(e) => setNouveauClient({...nouveauClient, date_naissance: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handleAjouterClient} style={{ width: '100%', padding: '12px', background: '#1a237e', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', marginTop: '15px' }}>Ajouter le client</button>
            </div>

            <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
              <h3>Liste des clients ({clients.length})</h3>
              {clients.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', marginTop: '30px' }}>Aucun client pour le moment</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ background: '#1a237e', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Telephone</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Achats</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Details</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{client.nom}</td>
                        <td style={{ padding: '10px' }}>{client.telephone || '-'}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>{client.nombre_achats || 0}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#1a237e', fontWeight: 'bold' }}>
                          {Number(client.total_achats || 0).toFixed(0)} CDF
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button onClick={() => voirDetailsClient(client.id)} style={{ padding: '8px 15px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Voir</button>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button onClick={() => handleSupprimerClient(client.id)} style={{ padding: '8px 15px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Suppr</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {showClientDetails && clientDetail && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                  <h3 style={{ color: '#1a237e', textAlign: 'center' }}>{clientDetail.client.nom}</h3>
                  <p><strong>Email :</strong> {clientDetail.client.email || '-'}</p>
                  <p><strong>Telephone :</strong> {clientDetail.client.telephone || '-'}</p>
                  <p><strong>Points de fidelite :</strong> {clientDetail.client.points_fidelite || 0}</p>
                  
                  <h4 style={{ marginTop: '20px', color: '#1a237e' }}>Historique des achats</h4>
                  {clientDetail.historique.length === 0 ? (
                    <p style={{ color: '#999' }}>Aucun achat</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                      <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                          <th style={{ padding: '8px' }}>Facture</th>
                          <th style={{ padding: '8px' }}>Date</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientDetail.historique.map(achat => (
                          <tr key={achat.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px' }}>{achat.numero_facture}</td>
                            <td style={{ padding: '8px' }}>{new Date(achat.created_at).toLocaleDateString('fr-FR')}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{Number(achat.montant_final).toFixed(0)} CDF</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  
                  <button onClick={() => setShowClientDetails(false)} style={{ width: '100%', padding: '12px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', marginTop: '20px' }}>Fermer</button>
                </div>
              </div>
            )}
          </div>
        )}

        {ongletActif === 'vente' && (
          <div>
            <h2>Nouvelle vente</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px' }}>
              <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <h3>Selectionner un article</h3>
                <select value={articleSelectionne} onChange={(e) => setArticleSelectionne(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px' }}>
                  <option value="">-- Choisir --</option>
                  {articles.map(article => (
                    <option key={article.id} value={article.id}>{article.nom} - {article.prix_vente} CDF</option>
                  ))}
                </select>
                <input type="number" placeholder="Quantite" value={quantiteVente} onChange={(e) => setQuantiteVente(parseInt(e.target.value))} min="1" style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', boxSizing: 'border-box' }} />
                <button onClick={handleAjouterAuPanier} style={{ width: '100%', padding: '15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }}>Ajouter au panier</button>
              </div>
              
              <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <h3>Panier</h3>
                {panier.length === 0 && !showSuccess ? (
                  <p style={{ color: '#999', textAlign: 'center', marginTop: '50px' }}>Le panier est vide</p>
                ) : panier.length > 0 ? (
                  <>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #ddd' }}>
                          <th style={{ textAlign: 'left', padding: '8px' }}>Article</th>
                          <th style={{ textAlign: 'center', padding: '8px' }}>Qte</th>
                          <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
                          <th style={{ textAlign: 'center', padding: '8px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {panier.map(item => (
                          <tr key={item.article_id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ textAlign: 'left', padding: '8px' }}>{item.nom}</td>
                            <td style={{ textAlign: 'center', padding: '8px' }}>{item.quantite}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{item.prix_vente * item.quantite} CDF</td>
                            <td style={{ textAlign: 'center', padding: '8px' }}>
                              <button onClick={() => handleRetirerDuPanier(item.article_id)} style={{ padding: '5px 10px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>X</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '2px solid #ddd', paddingTop: '20px' }}>
                      <h2 style={{ fontSize: '28px', color: '#1a237e' }}>{totalPanier} CDF</h2>
                      <p style={{ color: '#666' }}>{(totalPanier / 2800).toFixed(2)} USD</p>
                      <button onClick={handleValiderVente} style={{ width: '100%', padding: '15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>Valider la vente</button>
                    </div>
                  </>
                ) : null}
                
                {showSuccess && derniereFacture && (
                  <div style={{ background: '#e8f5e9', padding: '20px', borderRadius: '10px', marginTop: '20px', textAlign: 'center', border: '2px solid #4CAF50' }}>
                    <h3 style={{ color: '#2e7d32' }}>VENTE REUSSIE !</h3>
                    <p><strong>Facture :</strong> {derniereFacture.numero_facture}</p>
                    <p><strong>Benefice :</strong> {derniereFacture.benefice} CDF</p>
                    <button onClick={() => handleImprimerFacture(derniereFacture.numero_facture)} style={{ width: '100%', padding: '12px', background: '#1a237e', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>Imprimer la facture</button>
                    <button onClick={() => setShowSuccess(false)} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}>Fermer</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;