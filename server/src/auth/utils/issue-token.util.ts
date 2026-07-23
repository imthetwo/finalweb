import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

type TokenUser = { id: string; email: string; fullName: string; role: Role; isEmailVerified: boolean };

// Shared by every flow that hands back a fresh session (login, Google OAuth,
// email verification) so the JWT payload and the safe-user shape returned to
// the client can't drift out of sync between them.
export function issueToken(jwtService: JwtService, user: TokenUser) {
  const payload = { sub: user.id, email: user.email, fullName: user.fullName, role: user.role, isEmailVerified: user.isEmailVerified };
  const access_token = jwtService.sign(payload);
  const safeUser = { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isEmailVerified: user.isEmailVerified };
  return { access_token, user: safeUser };
}
