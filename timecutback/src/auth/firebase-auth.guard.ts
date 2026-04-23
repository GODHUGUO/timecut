import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { initFirebaseAdmin } from './firebase-admin';

type RequestWithUser = Request & {
  user?: {
    id: string;
    uid?: string;
    email?: string;
  };
};

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    initFirebaseAdmin();

    const authHeader = req.headers.authorization;
    const headerUserId = req.headers['x-user-id'];

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      try {
        const decoded = await getAuth().verifyIdToken(token);
        req.user = {
          id: decoded.uid,
          uid: decoded.uid,
          email: decoded.email,
        };

        return true;
      } catch {
        throw new UnauthorizedException('Token Firebase invalide ou expire.');
      }
    }

    // Fallback local development only.
    if (
      process.env.ALLOW_X_USER_ID === 'true' &&
      typeof headerUserId === 'string' &&
      headerUserId.trim().length > 0
    ) {
      req.user = { id: headerUserId.trim(), uid: headerUserId.trim() };
      return true;
    }

    throw new UnauthorizedException(
      'Authentification requise (Bearer Firebase ID token).',
    );
  }
}
