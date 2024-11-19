import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';

const PORT = process.env.PORT || 8000
const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Removed trailing slash
    methods: ["GET", "POST"],
    credentials: true,
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("message", ({ room, message }) => {
    const timestamp = new Date(); // Create a timestamp for the message
    console.log({ room, message, timestamp });

    // Send the message along with the timestamp to the specified room
    socket.to(room).emit("recive-message", { message, timestamp });
  });

  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`User joined room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", `${socket.id}`);
  });
});

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true,
}));



server.listen(PORT, () => {
  console.log('Server is running at port 3000');
});
