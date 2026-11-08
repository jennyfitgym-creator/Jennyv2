const security = require('./_lib/notification-security');

module.exports = async (req, res) => {
  if (!security.applyCors(req, res)) return res.status(403).json({ ok: false, error: 'Origen no permitido.' });
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método no permitido.' });

  try {
    await security.verifyAppCheck(req);
    if (!await security.enforceRateLimit(req, res, 'subscribe', 30, 60 * 60 * 1000)) return;

    const { token, topic, action = 'subscribe' } = req.body || {};
    const allowedTopics = new Set(['recordatorio_agua', 'noticias_jennyfit']);

    if (!security.validFcmToken(token)) return res.status(400).json({ ok: false, error: 'Token FCM no válido.' });
    if (!allowedTopics.has(topic)) return res.status(400).json({ ok: false, error: 'Tema no permitido.' });
    if (action !== 'subscribe' && action !== 'unsubscribe') return res.status(400).json({ ok: false, error: 'Acción no válida.' });

    const messaging = security.getAdmin().messaging();
    if (action === 'unsubscribe') {
      await messaging.unsubscribeFromTopic(token, topic);
      return res.status(200).json({ ok: true, status: 'unsubscribed', topic });
    }

    await messaging.subscribeToTopic(token, topic);
    return res.status(200).json({ ok: true, status: 'subscribed', topic });
  } catch (error) {
    return security.handleSecurityError(res, error);
  }
};
