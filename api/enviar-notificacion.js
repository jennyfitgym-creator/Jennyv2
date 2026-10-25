const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { title, body, topic, secret } = req.body;

    if (secret !== 'JENNYFIT_ADMIN_2026') {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        const message = {
            // Usamos DATA en lugar de NOTIFICATION para evitar duplicados
            data: {
                title: title,
                body: body,
                icon: 'https://jenny-one-green.vercel.app/Iconojennyfit.jpg'
            },
            topic: topic
        };
        const response = await admin.messaging().send(message);
        return res.status(200).json({ success: true, messageId: response });
    } catch (error) {
        console.error('Error al enviar:', error);
        return res.status(500).json({ error: error.message });
    }
};
