import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import dayjs from 'dayjs'; // For formatting timestamps

const PORT = 8000;
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Track users in rooms
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  
  // Handle sending messages
  socket.on("message", (messageData) => {
    const { room, message, sender, senderId } = messageData;
    const timestamp = Date.now(); // Use timestamp in milliseconds for client-side formatting
    
    console.log({ room, message, sender, timestamp });
    
    // Broadcast the message to the room
    socket.to(room).emit("receive-message", { 
      message, 
      timestamp,
      sender,
      senderId
    });
  });
  
  // Handle joining rooms
  socket.on("join-room", ({ room, username }) => {
    socket.join(room);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(room)) {
      rooms.set(room, new Map());
    }
    
    // Add user to room
    const roomUsers = rooms.get(room);
    roomUsers.set(socket.id, username);
    
    // Get user count
    const userCount = roomUsers.size;
    
    console.log(`User ${username} (${socket.id}) joined room ${room}. Total users: ${userCount}`);
    
    // Notify others in the room
    socket.to(room).emit("user-joined", { 
      username, 
      count: userCount
    });
  });
  
  // Handle leaving rooms
  socket.on("leave-room", ({ room, username }) => {
    socket.leave(room);
    
    if (rooms.has(room)) {
      const roomUsers = rooms.get(room);
      roomUsers.delete(socket.id);
      
      const userCount = roomUsers.size;
      
      console.log(`User ${username} left room ${room}. Total users: ${userCount}`);
      
      // Notify others in the room
      socket.to(room).emit("user-left", { 
        username, 
        count: userCount
      });
      
      // Clean up empty rooms
      if (roomUsers.size === 0) {
        rooms.delete(room);
        console.log(`Room ${room} was deleted (empty)`);
      }
    }
  });
  
  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    // Find which rooms this user was in
    rooms.forEach((users, roomName) => {
      if (users.has(socket.id)) {
        const username = users.get(socket.id);
        users.delete(socket.id);
        
        // Notify others
        socket.to(roomName).emit("user-left", { 
          username: username || socket.id,
          count: users.size
        });
        
        console.log(`User ${username || socket.id} left room ${roomName} due to disconnect`);
        
        // Clean up empty rooms
        if (users.size === 0) {
          rooms.delete(roomName);
          console.log(`Room ${roomName} was deleted (empty after disconnect)`);
        }
      }
    });
  });
});

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

server.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});