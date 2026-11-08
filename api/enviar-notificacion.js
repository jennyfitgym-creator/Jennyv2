const security = require('./_lib/notification-security');

module.exports = async (req, res) => {
  if (!security.applyCors(req, res)) return res.status(403).json({ success: false, error: 'Origen no permitido.' });
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método no permitido.' });

  try {
    await security.verifyAppCheck(req);
    await security.verifyAdmin(req);
    if (!await security.enforceRateLimit(req, res, 'send-notification', 20, 60 * 60 * 1000)) return;

    const { title, body, image, topic, token, icon } = req.body || {};
    if (typeof title !== 'string' || !title.trim() || title.length > 120 ||
        typeof body !== 'string' || !body.trim() || body.length > 1000) {
      return res.status(400).json({ success: false, error: 'Título o mensaje no válido.' });
    }
    if ((topic && token) || (!topic && !token)) {
      return res.status(400).json({ success: false, error: 'Indica un único destino.' });
    }
    if (token && !security.validFcmToken(token)) {
      return res.status(400).json({ success: false, error: 'Token FCM no válido.' });
    }
    if (topic && !['noticias_jennyfit', 'recordatorio_agua'].includes(topic)) {
      return res.status(400).json({ success: false, error: 'Tema no permitido.' });
    }

    const validImage = value => typeof value === 'string' && /^https:\/\//i.test(value) && value.length <= 2048;
    const iconUrl = validImage(icon) ? icon : 'https://jennyv2.vercel.app/Iconojennyfit.png';
    const message = {
      notification: {
        title: title.trim(),
        body: body.trim(),
        ...(validImage(image) ? { image } : {})
      },
      android: { priority: 'high', notification: { sound: 'default' } },
      webpush: {
        notification: {
          title: title.trim(),
          body: body.trim(),
          icon: iconUrl,
          ...(validImage(image) ? { image } : {}),
          vibrate: [300, 100, 300, 100, 400]
        },
        fcmOptions: { link: 'https://admin-jennyfit.vercel.app/' }
      }
    };

    if (token) message.token = token;
    else message.topic = topic;

    const messageId = await security.getAdmin().messaging().send(message);
    return res.status(200).json({ success: true, messageId });
  } catch (error) {
    return security.handleSecurityError(res, error);
  }
};
