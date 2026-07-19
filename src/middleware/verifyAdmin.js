const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * The frontend hides/shows admin controls client-side, but that's just UI —
 * anyone can bypass it via devtools. This middleware is the REAL gate: it
 * verifies the Google ID token's signature with Google directly, and only
 * lets the request through if the verified email matches ADMIN_EMAIL.
 */
async function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization header. Sign in again.' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.email_verified) {
      return res.status(401).json({ error: 'Could not verify Google account.' });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (payload.email.toLowerCase() !== adminEmail) {
      return res.status(403).json({ error: 'This account is not authorized as admin.' });
    }

    req.admin = { email: payload.email, name: payload.name };
    next();
  } catch (err) {
    console.error('[verifyAdmin] token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired sign-in token. Sign in again.' });
  }
}

module.exports = { verifyAdmin };
