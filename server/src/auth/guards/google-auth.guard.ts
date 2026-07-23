import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

// Threads ?redirect=<path> from the initial /auth/google request through
// Google's own `state` param (session: false means there's no server-side
// session to stash it in otherwise), so the callback below can read it back
// and send the user to wherever they started OAuth from (e.g. /checkout)
// instead of always landing on the homepage.
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const redirectTo = typeof req.query.redirect === 'string' ? req.query.redirect : undefined;
    return redirectTo ? { state: redirectTo } : {};
  }
}
