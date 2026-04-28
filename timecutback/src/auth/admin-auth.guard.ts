// src/auth/admin-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { SKIP_ADMIN_CHECK_KEY } from './skip-admin-check.decorator';

// Interface pour typer le user injecté par Firebase
interface AuthenticatedUser {
  uid: string;
  id: string;
  email?: string;
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class AdminAuthGuard extends FirebaseAuthGuard {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ── 1. SkipAdminCheck EN PREMIER ─────────────────────────
    const skipAdminCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_ADMIN_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipAdminCheck) return true;

    // ── 2. Vérifie Firebase Auth ──────────────────────────────
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) return false;

    // ── 3. Vérifie si l'user est admin ────────────────────────
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user: AuthenticatedUser = request.user;

    const adminUids = (process.env.ADMIN_UIDS ?? '')
      .split(',')
      .map((uid: string) => uid.trim())
      .filter(Boolean);

    const userId: string = user.uid ?? user.id ?? '';

    if (!adminUids.includes(userId)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
