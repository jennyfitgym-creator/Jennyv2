const admin = require('firebase-admin');
const crypto = require('crypto');

const DEFAULT_ORIGIN = 'https://jennyv2.vercel.app';

function getAllowedOrigins() {
  return new Set((process.env.NOTIFICATION_ALLOWED_ORIGINS || DEFAULT_ORIGIN)
    .split(',').map(value => value.trim()).filter(Boolean));
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && !getAllowedOrigins().has(origin)) return false;
  res.setHeader('Access-Control-Allow-Origin', origin || DEFAULT_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Firebase-AppCheck');
  res.setHeader('Cache-Control', 'no-store');
  return true;
}

function getAdmin() {
  if (admin.apps.length) return admin;
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    const error = new Error('Firebase Admin credentials are not configured.');
    error.code = 'CONFIG';
    throw error;
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return req.headers['x-real-ip'] || 'unknown';
}

async function enforceRateLimit(req, res, bucket, maxRequests, windowMs) {
  const db = getAdmin().firestore();
  const key = crypto.createHash('sha256')
    .update(bucket + ':' + getClientIp(req))
    .digest('hex');
  const ref = db.collection('_security_rate_limits').doc(key);
  const now = Date.now();

  const allowed = await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.exists ? snapshot.data() : {};
    if (!data.resetAt || data.resetAt.toMillis() <= now) {
      transaction.set(ref, {
        count: 1,
        resetAt: admin.firestore.Timestamp.fromMillis(now + windowMs)
      });
      return true;
    }
    if (data.count >= maxRequests) return false;
    transaction.update(ref, { count: data.count + 1 });
    return true;
  });

  if (!allowed) {
    res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
    res.status(429).json({ success: false, error: 'Demasiadas solicitudes. Inténtalo más tarde.' });
  }
  return allowed;
}

async function verifyAppCheck(req) {
  const token = req.headers['x-firebase-appcheck'];
  if (typeof token !== 'string' || !token) {
    const error = new Error('App Check token required.');
    error.code = 'APP_CHECK_REQUIRED';
    throw error;
  }
  await getAdmin().appCheck().verifyToken(token);
}

async function verifyAdmin(req) {
  const match = (req.headers.authorization || '').match(/^Bearer\\s+(.+)$/i);
  if (!match) {
    const error = new Error('Authentication required.');
    error.code = 'AUTH_REQUIRED';
    throw error;
  }
  const configuredUids = (process.env.NOTIFICATION_ADMIN_UIDS || '')
    .split(',').map(value => value.trim()).filter(Boolean);
  if (!configuredUids.length) {
    const error = new Error('Notification administrators are not configured.');
    error.code = 'CONFIG';
    throw error;
  }
  const decoded = await getAdmin().auth().verifyIdToken(match[1]);
  if (!configuredUids.includes(decoded.uid)) {
    const error = new Error('Administrator access required.');
    error.code = 'FORBIDDEN';
    throw error;
  }
  return decoded;
}

function validFcmToken(token) {
  return typeof token === 'string' && token.length >= 20 && token.length <= 4096 &&
    /^[A-Za-z0-9_:\\-]+$/.test(token);
}

function validTopic(topic) {
  return typeof topic === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(topic);
}

function handleSecurityError(res, error) {
  if (error.code === 'APP_CHECK_REQUIRED' || error.code === 'AUTH_REQUIRED') {
    return res.status(401).json({ success: false, error: 'No autorizado.' });
  }
  if (error.code === 'FORBIDDEN') {
    return res.status(403).json({ success: false, error: 'No autorizado.' });
  }
  if (error.code === 'CONFIG') {
    console.error('[notifications] Server configuration error:', error.message);
    return res.status(503).json({ success: false, error: 'Servicio de notificaciones no configurado.' });
  }
  console.error('[notifications] Security verification failed:', error.message);
  return res.status(401).json({ success: false, error: 'No se pudo validar la solicitud.' });
}

module.exports = {
  getAdmin, applyCors, enforceRateLimit, verifyAppCheck, verifyAdmin,
  validFcmToken, validTopic, handleSecurityError
};
