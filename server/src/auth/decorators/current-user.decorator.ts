import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AuthUser = { userId: string; email: string; role: string };

/** Gets the authenticated user from the request. Example: @CurrentUser() user: AuthUser
 *  Or get a single field: @CurrentUser('userId') userId: string */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return data ? req.user?.[data] : req.user;
  },
);
