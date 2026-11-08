const security = require('./_lib/notification-security');

module.exports = async (req, res) => {
  if (!security.applyCors(req, res)) return res.status(403).json({ success: false, error: 'Origen no permitido.' });
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método no permitido.' });

  try {
    await security.verifyAppCheck(req);
    const adminUser = await security.verifyAdmin(req);
    if (!await security.enforceRateLimit(req, res, 'send-water', 10, 60 * 60 * 1000, adminUser.uid)) return;

    const message = {
      data: {
        title: '💧 ¡Hora de hidratarte!',
        body: 'No olvides tomar agua para rendir al máximo en tu entrenamiento.'
      },
      webpush: {
        fcmOptions: { link: 'https://jennyv2.vercel.app/' }
      },
      topic: 'recordatorio_agua'
    };

    const messageId = await security.getAdmin().messaging().send(message);
    return res.status(200).json({ success: true, messageId });
  } catch (error) {
    return security.handleSecurityError(res, error);
  }
};
