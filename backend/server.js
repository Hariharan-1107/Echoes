import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import pkg from "pg";
import session from "express-session";
import { google } from "googleapis";
import http from "http";
import { Server } from "socket.io";
import connectPgSimple from "connect-pg-simple";

const { Pool } = pkg;
dotenv.config();

const app = express();
app.use(bodyParser.json());
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false, // Required for Render's hosted databases
  },
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://echoes-1.onrender.com",
    credentials: true,
  },
});

app.use(
  cors({
    credentials: true,
    origin: "https://echoes-1.onrender.com", // Ensure this matches your client
    httpOnly: false,
  })
);

const PGStore = connectPgSimple(session);

app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    cookie: {
      secure: true,
      sameSite: "none",
    },
    resave: false,
    saveUninitialized: false,
  })
);

// Google OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://echoes-av5f.onrender.com/auth/google/home"
);

// Define scopes
const SCOPES = ["profile", "email"];

// Routes
app.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  res.redirect(url);
});

app.get("/auth/google/home", async (req, res) => {
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();
    const account = userInfo.data;

    // Check or insert user into the database
    const currentuser = await pool.query(
      "SELECT * FROM users WHERE googleid=$1",
      [account.id]
    );

    if (currentuser.rows.length === 0) {
      await pool.query(
        "INSERT INTO users(googleid, username, email) VALUES($1, $2, $3)",
        [account.id, account.name, account.email]
      );
    }

    // Save user information in the session
    req.session.user = {
      googleid: account.id,
      username: account.name,
    };
    const redirectUrl = `${
      process.env.CLIENT_URL
    }?userData=${encodeURIComponent(JSON.stringify(req.session.user))}`;
    res.redirect(redirectUrl);
  } catch (err) {
    console.error("Error during Google authentication:", err);
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/login-status/:id", async (req, res) => {
  const id = req.params.id;
  console.log(id);
  if (id) {
    const user = await pool.query("SELECT * from users where googleid=$1", [
      id,
    ]);
    res.json({ loggedIn: true, user: user.rows[0] });
  } else {
    res.json({ loggedIn: false });
  }
});

app.get("/auth/logout", (req, res) => {
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
  res.send(req.user);
});
server.listen(process.env.port || 8000, () => {
  console.log("Server Up and Running");
});
