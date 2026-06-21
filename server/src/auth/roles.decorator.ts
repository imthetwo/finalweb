import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Gắn role yêu cầu cho route. Dùng kèm RolesGuard. Ví dụ: @Roles('ADMIN') */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
