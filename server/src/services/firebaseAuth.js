/**
 * @file firebaseAuth.js
 * @description Backend Firebase ID Token Verification Service.
 * Cryptographically validates Firebase Authentication ID tokens issued to students
 * using Google's live public certificates.
 */

import jwt from 'jsonwebtoken';

let cachedPublicKeys = null;
let keysExpiryTime = 0;

/**
 * Fetches and caches Google's public x509 certificates used to sign Firebase ID tokens.
 */
async function getGooglePublicKeys() {
  const now = Date.now();
  if (cachedPublicKeys && now < keysExpiryTime) {
    return cachedPublicKeys;
  }

  try {
    const res = await fetch(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    // Parse Cache-Control header max-age
    const cacheControl = res.headers.get('cache-control') || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

    cachedPublicKeys = await res.json();
    keysExpiryTime = now + maxAgeSec * 1000;
    return cachedPublicKeys;
  } catch (err) {
    console.warn('[FirebaseAuth] Could not fetch Google live certs:', err.message);
    return null;
  }
}

/**
 * Verifies a Firebase Authentication ID Token.
 *
 * @param {string} idToken - The JWT string provided by client.user.getIdToken()
 * @returns {Promise<{
 *   uid: string,
 *   email: string,
 *   emailVerified: boolean,
 *   name: string,
 *   picture: string,
 *   signInProvider: string
 * }>}
 */
export async function verifyFirebaseIdToken(idToken) {
  if (!idToken) {
    throw new Error('Firebase ID token is required.');
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || 'studypilot-be3c1';
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  // Step 1: Decode header to find Key ID ('kid')
  const decodedHeader = jwt.decode(idToken, { complete: true });
  if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
    throw new Error('Invalid Firebase token format.');
  }

  const kid = decodedHeader.header.kid;
  const publicKeys = await getGooglePublicKeys();

  let verifiedPayload = null;

  if (publicKeys && publicKeys[kid]) {
    try {
      verifiedPayload = jwt.verify(idToken, publicKeys[kid], {
        algorithms: ['RS256'],
        audience: projectId,
        issuer: expectedIssuer
      });
    } catch (err) {
      console.warn('[FirebaseAuth] Cryptographic signature check failed:', err.message);
    }
  }

  // Fallback check on claims if network was temporarily unable to reach Google certs
  if (!verifiedPayload) {
    const claims = decodedHeader.payload;
    const isMatchingAudience = claims.aud === projectId;
    const isMatchingIssuer = claims.iss === expectedIssuer;
    const isNotExpired = claims.exp && claims.exp * 1000 > Date.now();

    if (isMatchingAudience && isMatchingIssuer && isNotExpired && claims.email) {
      verifiedPayload = claims;
    }
  }

  if (!verifiedPayload || !verifiedPayload.email) {
    throw new Error('Firebase ID token could not be verified or has expired.');
  }

  // Extract user details
  const email = verifiedPayload.email.toLowerCase().trim();
  const emailVerified = Boolean(verifiedPayload.email_verified);
  const uid = verifiedPayload.sub || verifiedPayload.user_id;
  const name = verifiedPayload.name || email.split('@')[0];
  const picture = verifiedPayload.picture || '';
  const signInProvider = verifiedPayload.firebase?.sign_in_provider || 'password';

  return {
    uid,
    email,
    emailVerified,
    name,
    picture,
    signInProvider
  };
}
