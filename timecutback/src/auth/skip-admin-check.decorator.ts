import { SetMetadata } from '@nestjs/common';

export const SKIP_ADMIN_CHECK_KEY = 'skipAdminCheck';
export const SkipAdminCheck = () => SetMetadata(SKIP_ADMIN_CHECK_KEY, true);
