import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';

@Injectable()
export class AdminAuthGuard extends FirebaseAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First verify Firebase authentication
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) return false;

    // Then check admin whitelist
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const adminUids = (process.env.ADMIN_UIDS || '')
      .split(',')
      .map((uid) => uid.trim())
      .filter(Boolean);

    if (!adminUids.includes(user.uid || user.id)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
