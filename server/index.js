import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import dayjs from 'dayjs'; // For formatting timestamps

const PORT = process.env.PORT || 8000;
const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://chat-it-five.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("message", ({ room, message }) => {
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss'); // Timestamp with format
    console.log({ room, message, timestamp });

    // Broadcast the message to the room
    socket.to(room).emit("receive-message", { message, timestamp });
  });

  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`User joined room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use(
  cors({
    origin: "https://chat-it-five.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

server.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
