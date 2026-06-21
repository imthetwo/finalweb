import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const result = super.canActivate(context);
    if (typeof result === 'boolean') return result;
    return Promise.resolve(result)
      .then(() => true)
      .catch(() => true);
  }

  handleRequest<T>(_err: Error | null, user: T): T {
    return user ?? (null as T);
  }
}
