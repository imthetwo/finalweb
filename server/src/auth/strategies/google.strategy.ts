import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

type GoogleProfile = {
  id?: string;
  emails?: Array<{ value?: string }>;
  name?: {
    givenName?: string;
    familyName?: string;
  };
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy as any,
  'google',
) {
  constructor() {
    // .trim() guards against a stray trailing newline/whitespace in the env
    // var value (easy to introduce via copy-paste into a hosting provider's
    // env var UI) — Google matches the redirect_uri against the registered
    // Authorized redirect URI byte-for-byte, so an invisible trailing \n
    // here is enough to fail with invalid_request even though every visible
    // character looks correct.
    const strategyOptions: any = {
      clientID: (process.env.GOOGLE_CLIENT_ID || '').trim(),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
      callbackURL:
        (process.env.GOOGLE_CALLBACK_URL || '').trim() ||
        'http://localhost:3001/auth/google/callback',
      scope: ['email', 'profile'],
      // Stateless: we mint a JWT in the callback, so Passport must not try to
      // serialize the user into a session (no express-session is configured).
      session: false,
    };

    super(strategyOptions);
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
  ) {
    const email = profile.emails?.[0]?.value ?? '';
    const firstName = profile.name?.givenName ?? '';
    const lastName = profile.name?.familyName ?? '';

    return {
      id: profile.id ?? '',
      email,
      firstName,
      lastName,
    };
  }
}
