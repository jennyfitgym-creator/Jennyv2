const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

export default async function handler(req, res) {
    const topic = 'recordatorio_agua';
    const message = {
        data: {
            title: '💧 ¡Hora de hidratarte!',
            body: 'No olvides tomar agua para rendir al máximo en tu entrenamiento.',
            icon: 'https://jenny-one-green.vercel.app/Iconojennyfit.jpg'
        },
        topic: topic
    };

    try {
        const response = await admin.messaging().send(message);
        return res.status(200).json({ success: true, messageId: response });
    } catch (error) {
        console.error('Error al enviar agua:', error);
        return res.status(500).json({ error: error.message });
    }
};
