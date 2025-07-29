// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const participants = {};
const roomSocketMap = {};
const roomParticipantsMap = {};

// Hardcoded credentials for demo
const users = {
  "admin": "password123",
  "user1": "mypass456",
  "developer": "dev789",
  "guest": "guest123"
};

// Room secret keys - in production, these would be stored in a database
const roomSecrets = {};

app.use(express.static(path.join(__dirname, "client")));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

// Authentication endpoint
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  
  if (users[username] && users[username] === password) {
    res.json({ success: true, message: "Login successful" });
  } else {
    res.json({ success: false, message: "Invalid credentials" });
  }
});

// Room secret verification endpoint
app.post("/api/verify-room", (req, res) => {
  const { roomId, secretKey } = req.body;
  
  // If room doesn't exist, create it with the provided secret
  if (!roomSecrets[roomId]) {
    roomSecrets[roomId] = secretKey;
    res.json({ success: true, message: "Room created successfully", isCreator: true });
  } else if (roomSecrets[roomId] === secretKey) {
    res.json({ success: true, message: "Room access granted", isCreator: false });
  } else {
    res.json({ success: false, message: "Invalid secret key for this room" });
  }
});
app.get("/:roomId", (req, res) => {
  const roomId = req.params.roomId;
  res.sendFile(path.join(__dirname, "client", "editorPage.html"));
});

io.on("connection", (socket) => {
  console.log("A user connected");

  // Listen for Chatting
  socket.on("user-message", (message) =>{
    io.emit("message",message);
  })

  socket.on("joinRoom", (roomId, userName, secretKey) => {
    // Verify room secret before allowing join
    if (!roomSecrets[roomId] || roomSecrets[roomId] !== secretKey) {
      socket.emit("roomError", "Invalid secret key for this room");
      return;
    }

    socket.join(roomId);

    if (!roomParticipantsMap[roomId]) {
      roomParticipantsMap[roomId] = [];
    }
    roomParticipantsMap[roomId].push({
      id: socket.id,
      name: userName,
    });

    io.to(roomId).emit("updateParticipants", roomParticipantsMap[roomId]);

    roomSocketMap[socket.id] = roomId;

    participants[socket.id] = {
      id: socket.id,
      name: userName,
      roomId: roomId,
    };

    io.emit("participants", roomParticipantsMap[roomId]);
  });

  socket.on("textUpdate", (text) => {
    const roomId = roomSocketMap[socket.id];
    io.to(roomId).emit("textUpdate", { id: socket.id, text });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");

    const roomId = roomSocketMap[socket.id];

    if (roomId && roomParticipantsMap[roomId]) {
      roomParticipantsMap[roomId] = roomParticipantsMap[roomId].filter(
        (participant) => participant.id !== socket.id
      );
      io.to(roomId).emit("updateParticipants", roomParticipantsMap[roomId]);
    }

    delete participants[socket.id];
    io.emit("participants", Object.values(participants));

    delete roomSocketMap[socket.id];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
