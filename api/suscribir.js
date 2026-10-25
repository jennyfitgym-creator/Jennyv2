const admin = require('firebase-admin');

if (!admin.apps.length) {
  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64Key) {
    const serviceAccount = JSON.parse(Buffer.from(base64Key, 'base64').toString('utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { token, topic = 'recordatorio_agua', action = 'subscribe' } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: 'Falta el token FCM' });
    }

    if (action === 'unsubscribe') {
      await admin.messaging().unsubscribeFromTopic(token, topic);
      return res.status(200).json({ ok: true, status: 'unsubscribed', topic });
    } else {
      await admin.messaging().subscribeToTopic(token, topic);
      return res.status(200).json({ ok: true, status: 'subscribed', topic });
    }
  } catch (err) {
    console.error('Error en api/suscribir:', err);
    return res.status(500).json({ error: err.message });
  }
};
