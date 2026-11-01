import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        let serviceAccount;
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        }
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('Error inicializando Firebase Admin:', error);
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método no permitido' });

    const { title, body, image, topic, token, secret } = req.body;

    if (secret !== 'JENNYFIT_ADMIN_2026') return res.status(403).json({ success: false, error: 'No autorizado' });
    
    // Validamos que venga el título y el cuerpo, y que venga O un topic O un token
    if (!title || !body || (!topic && !token)) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios (title, body, y topic o token)' });
    }

    try {
        const message = {
            notification: {
                title: title,
                body: body,
                image: image || '' 
            },
            webpush: {
                notification: {
                    title: title,
                    body: body,
                    icon: './Iconojennyfit.png',
                    image: image || '' 
                }
            }
        };

        // 🚨 LÓGICA BILINGÜE 🚨
        if (token) {
            message.token = token; // Envío directo (Para el Admin)
        } else {
            message.topic = topic; // Envío masivo (Para los Clientes)
        }

        const response = await admin.messaging().send(message);
        return res.status(200).json({ success: true, messageId: response });
    } catch (error) {
        console.error('Error enviando notificación:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
