import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AuthUser = { userId: string; email: string; role: string };

/** Lấy user đã xác thực từ request. Ví dụ: @CurrentUser() user: AuthUser
 *  Hoặc lấy 1 field: @CurrentUser('userId') userId: string */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return data ? req.user?.[data] : req.user;
  },
);
