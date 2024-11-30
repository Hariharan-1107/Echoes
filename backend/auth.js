import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotev from "dotenv";
dotev.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:8000/auth/google/home",
    },
    (accessToken, refreshToken, profile, done) => {
      const account = profile._json;
      console.log(account);
    }
  )
);
