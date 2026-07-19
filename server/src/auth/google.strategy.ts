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
    const strategyOptions: any = {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
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
