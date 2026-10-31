import admin from 'firebase-admin';

// Inicializar Firebase Admin de forma segura
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('Error inicializando Firebase Admin:', error);
    }
}

export default async function handler(req, res) {
    // 🚨 CABECERAS CORS PARA PERMITIR EL ACCESO DESDE EL PANEL DE ADMIN 🚨
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Responder a la petición de verificación del navegador (Preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Método no permitido' });
    }

    const { title, body, image, topic, secret } = req.body;

    // Validar clave secreta
    if (secret !== 'JENNYFIT_ADMIN_2026') {
        return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    if (!title || !body || !topic) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }

    try {
        const message = {
            topic: topic,
            notification: {
                title: title,
                body: body,
            },
            data: {
                title: title,
                body: body,
                image: image || ''
            }
        };

        if (image) {
            message.notification.image = image;
        }

        const response = await admin.messaging().send(message);
        return res.status(200).json({ success: true, messageId: response });
    } catch (error) {
        console.error('Error enviando notificación:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
