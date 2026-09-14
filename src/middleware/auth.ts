import { Request, Response, NextFunction } from 'express';
import { firebaseAdmin } from '../config/firebase';
import { DecodedIdToken } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
    }
  }
}

export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  console.log(`\n[Middleware: Auth] Verifying Firebase Token...`);
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Middleware: Auth] ❌ Missing or invalid Authorization header.');
    res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // If admin is not initialized, this will throw
    if (!firebaseAdmin.apps.length) {
       console.error('[Middleware: Auth] ❌ Firebase Admin not initialized.');
       res.status(500).json({ error: 'Internal Server Error', message: 'Firebase Admin not initialized on backend' });
       return;
    }
    
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    console.log(`[Middleware: Auth] ✅ Token verified successfully for UID: ${decodedToken.uid}`);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error('[Middleware: Auth] ❌ Firebase token verification error:', error.message);
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
};
