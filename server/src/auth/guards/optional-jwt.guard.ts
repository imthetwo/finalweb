import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// A JWT guard that never blocks the request: a valid token populates
// req.user, anything else (no token, expired, malformed) just leaves it
// undefined and lets the handler run as a guest. The inherited canActivate
// already runs the strategy and awaits it; overriding handleRequest to
// return the user instead of throwing on failure is all that's needed to
// make it optional (per @nestjs/passport docs — the default handleRequest
// throws an UnauthorizedException when there's no user).
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(_err: Error | null, user: T): T {
    return user || (undefined as T);
  }
}
