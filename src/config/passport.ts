import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { env } from './env.js';
import { authService } from '@modules/auth/index.js';

passport.use(
  new LocalStrategy({ usernameField: 'email', session: false }, (email, password, done) => {
    authService
      .verifyCredentials(email, password)
      .then((user) => (user ? done(null, user) : done(null, false, { message: 'Invalid email or password' })))
      .catch(done);
  }),
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: env.JWT_SECRET,
      algorithms: ['HS256'],
    },
    (payload: { sub?: string }, done) => {
      if (!payload.sub) return done(null, false);
      // * Looking the user up on every request means deleted accounts lose access immediately
      authService
        .findUserById(payload.sub)
        .then((user) => done(null, user ?? false))
        .catch(done);
    },
  ),
);

export { passport };
