import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import pkg from "pg";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import http from "http";
import { Server } from "socket.io";
import connectPgSimple from "connect-pg-simple";
import { promises } from "fs";

const { Pool } = pkg;
const app = express();
dotenv.config();

app.use(bodyParser.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);

app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    cookie: {
      secure: process.env.NODE_ENV === "production" ? "true" : "auto",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: `https://echoes-av5f.onrender.com/auth/google/home`,
    },
    async (accessToken, refreshToken, profile, done) => {
      const account = profile._json;
      let user = {};
      try {
        const currentuser = await pool.query(
          "SELECT * FROM users WHERE googleid=$1",
          [account.sub]
        );
        if (currentuser.rows.length === 0) {
          //INSERT USER
          await pool.query(
            "INSERT INTO users(googleid,username,email)VALUES($1,$2,$3)",
            [account.sub, account.name, account.email]
          );
          user = { googleid: account.googleid, username: account.name };
        } else {
          googleid: currentuser.rows[0].googleid,
            (user = {
              googleid: currentuser.rows[0].googleid,
              username: currentuser.rows[0].username,
            });
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
  "/auth/google/home",
  passport.authenticate("google", { session: true }),
  (req, res) => {
    res.redirect("https://echoes-1.onrender.com");
  }
);

app.get("/search/:receiver", async (req, res) => {
  const receiver = req.params.receiver;
  const receiverdata = await pool.query("SELECT * FROM users WHERE email=$1", [
    receiver,
  ]);
  res.send(receiverdata.rows[0]);
});

app.get("/api/login-status", (req, res) => {
  if (req.isAuthenticated()) {
    // User is logged in
    res.json({ loggedIn: true, user: req.user });
  } else {
    // User is not logged in
    res.json({ loggedIn: false });
  }
});

app.get("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send("Error logging out");
      }
      res.clearCookie("connect.sid", {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
});

app.get("/messages/:sendid/:receiveid", async (req, res) => {
  const sendid = req.params.sendid;
  const receiveid = req.params.receiveid;
  const sendmessages = await pool.query(
    "SELECT * FROM messages WHERE sender_id=$1 AND receiver_id=$2",
    [sendid, receiveid]
  );
  const receivemessges = await pool.query(
    "SELECT * FROM messages WHERE sender_id=$1 AND receiver_id=$2",
    [receiveid, sendid]
  );
  const messages = [...sendmessages.rows, ...receivemessges.rows];
  messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  res.send(messages);
});

let userRooms = new Set();

io.on("connection", (socket) => {
  socket.on("joinRoom", (room) => {
    if (!userRooms.has(socket.id)) {
      socket.join(room);
      userRooms.add(socket.id); // Track user rooms to prevent duplicate joins
      console.log(`User joined room: ${room}`);
    }
  });

  socket.on("send_message", async (message) => {
    const room = [message.sender_id, message.receiver_id].sort().join("-");
    io.to(room).emit("receive_message", message); // Emit message to the correct room

    try {
      await pool.query(
        "INSERT INTO messages(sender_id,receiver_id,message)VALUES($1,$2,$3)",
        [message.sender_id, message.receiver_id, message.message]
      );
      console.log("Message stored in DB successfully");
    } catch (err) {
      console.error("Error saving message to DB:", err);
    }
  });

  socket.on("disconnect", () => {
    userRooms.delete(socket.id); // Remove user from tracked rooms on disconnect
  });
});

app.get("/friends/:id", async (req, res) => {
  const id = req.params.id;
  const receiversid = await pool.query(
    "SELECT DISTINCT receiver_id FROM messages WHERE sender_id = $1",
    [id]
  );
  const sendersid = await pool.query(
    "SELECT DISTINCT sender_id FROM messages WHERE receiver_id=$1",
    [id]
  );

  const reciveArray = await Promise.all(
    receiversid.rows.map(async (fr) => {
      const user = await pool.query("SELECT * FROM users WHERE googleid=$1", [
        fr.receiver_id,
      ]);
      return user.rows[0];
    })
  );

  const sendArray = await Promise.all(
    sendersid.rows.map(async (fr) => {
      const user = await pool.query("SELECT * FROM users WHERE googleid=$1", [
        fr.sender_id,
      ]);
      return user.rows[0];
    })
  );
  const FriendsArray = Array.from(
    new Map(
      [...reciveArray, ...sendArray].map((user) => [user.googleid, user])
    ).values()
  );
  res.send(FriendsArray);
});

app.delete("/friends/:userid/:friendId", async (req, res) => {
  const userid = req.params.userid;
  const friendId = req.params.friendId;
  try {
    await pool.query(
      "DELETE FROM messages WHERE (sender_id = $1 OR receiver_id = $1) AND (sender_id = $2 OR receiver_id = $2)",
      [userid, friendId]
    );
    res.send(1);
  } catch (err) {
    console.log(err);
    res.send(0);
  }
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

server.listen(process.env.PORT || 8000, () => {
  console.log("Server Up and Running");
});
