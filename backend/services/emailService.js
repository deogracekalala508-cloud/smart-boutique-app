const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function verifierConfiguration() {
  try {
    const service = (process.env.EMAIL_SERVICE || '').toLowerCase();
    if (service === 'brevo') {
      console.log('✅ Service email configuré sur Brevo API');
      return true;
    }
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('ℹ️ Mode test email actif (console log)');
      return false;
    }
    transporter.verify().then(() => {
      console.log('✅ Service email SMTP vérifié');
    }).catch(err => {
      console.log('⚠️ SMTP indisponible (Port 587 bloqué), mode console/log actif.');
    });
    return true;
  } catch (error) {
    console.error('❌ Erreur configuration email:', error.message);
    return false;
  }
}

async function envoyerEmailBrevo(email, code, nomBoutique) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.log('⚠️ BREVO_API_KEY non définie, fallback console.');
      return null;
    }
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: "Smart Boutique", email: process.env.EMAIL_USER || "noreply@smartboutique.com" },
        to: [{ email: email }],
        subject: "🔐 Code de vérification - Smart Boutique",
        htmlContent: `<h2>Bonjour ${nomBoutique}</h2><p>Voici votre code de vérification : <strong>${code}</strong></p>`
      })
    });
    const data = await response.json();
    return { success: true, brevoResponse: data };
  } catch (error) {
    console.error('Erreur API Brevo:', error.message);
    return null;
  }
}

async function envoyerCodeVerification(email, code, nomBoutique) {
  const service = (process.env.EMAIL_SERVICE || '').toLowerCase();

  if (service === 'brevo') {
    const brevoResult = await envoyerEmailBrevo(email, code, nomBoutique);
    if (brevoResult) return brevoResult;
  }

  console.log('\n========================================');
  console.log('📧 CODE DE VÉRIFICATION SMART BOUTIQUE');
  console.log('========================================');
  console.log(`Boutique : ${nomBoutique}`);
  console.log(`Email    : ${email}`);
  console.log(`CODE     : ${code}`);
  console.log('========================================\n');

  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && service === 'smtp') {
    try {
      await transporter.sendMail({
        from: `"Smart Boutique" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `🔐 Code de vérification - Smart Boutique`,
        html: `<p>Bonjour ${nomBoutique}, votre code est : <strong>${code}</strong></p>`
      });
      console.log('✅ Email SMTP envoyé à:', email);
    } catch (err) {
      console.log('⚠️ SMTP échoué, code disponible dans la console.');
    }
  }

  return { success: true, mode: 'test', code: code };
}

module.exports = { envoyerCodeVerification, verifierConfiguration };