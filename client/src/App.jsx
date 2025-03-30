import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  Grid,
  Box,
  Avatar,
  Divider,
  Chip,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IoIosChatboxes, IoMdSend } from "react-icons/io";
import { MdGroups } from "react-icons/md";

const App = () => {
  const socket = useMemo(() => io("http://localhost:8000"), []);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("");
  const [socketId, setSocketId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(1); // Default to 1 (self)

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!room) {
      toast.error("Please join a room first", {
        position: "top-right",
        autoClose: 1500,
      });
      return;
    }
    
    const newMessage = {
      message,
      room,
      sender: username || socketId,
      senderId: socketId,
      timestamp: Date.now(),
    };
    
    socket.emit("message", newMessage);
    setMessages((prevMessages) => [...prevMessages, { ...newMessage, isOwnMessage: true }]);
    setMessage("");
  };

  const joinRoomHandler = (e) => {
    e.preventDefault();

    if (!roomName.trim()) {
      toast.error("Room name cannot be empty", {
        position: "top-right",
        autoClose: 1500,
      });
      return;
    }

    const displayName = username.trim() || `User-${socketId.slice(0, 4)}`;
    setUsername(displayName);
    
    socket.emit("join-room", { room: roomName, username: displayName });
    setRoom(roomName);
    setRoomName("");
    setIsJoined(true);
    
    toast.success(`Joined room: ${roomName}`, {
      position: "top-right",
      autoClose: 1500,
    });
    
    // Add system message
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        message: `You joined the room: ${roomName}`,
        timestamp: Date.now(),
        isSystem: true,
      },
    ]);
  };

  useEffect(() => {
    socket.on("connect", () => {
      setSocketId(socket.id);
    });

    socket.on("receive-message", (data) => {
      setMessages((prevMessages) => [...prevMessages, { ...data, isOwnMessage: false }]);
    });
    
    socket.on("user-joined", ({ username, count }) => {
      setOnlineUsers(count);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          message: `${username} joined the chat`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
    });
    
    socket.on("user-left", ({ username, count }) => {
      setOnlineUsers(count);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          message: `${username} left the chat`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  // Helper function to format the timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        py: 4,
        backgroundColor: "#f5f5f5",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            backgroundColor: "#3f51b5",
            color: "white",
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="h4"
            component="div"
            sx={{
              display: "flex",
              alignItems: "center",
              fontWeight: "bold",
            }}
          >
            ChatIt! <IoIosChatboxes style={{ marginLeft: "10px" }} />
          </Typography>
          
          {room && (
            <Chip 
              icon={<MdGroups />} 
              label={`${onlineUsers} online in ${room}`} 
              variant="outlined" 
              sx={{ 
                color: "white", 
                borderColor: "rgba(255,255,255,0.5)",
                "& .MuiChip-icon": { color: "white" }
              }} 
            />
          )}
        </Box>
        <ToastContainer />
        
        <Grid container>
          {/* Left Column - Chat Messages */}
          <Grid item xs={12} md={8} sx={{ borderRight: "1px solid #e0e0e0" }}>
          <Box 
    sx={{ 
      height: "60vh", 
      overflowY: "auto",
      p: 3,
      backgroundColor: "#f9f9f9",
      display: "flex",
      flexDirection: "column",
    }}
    id="messageContainer"
  >
    {messages.length === 0 && !isJoined ? (
      <Box 
        sx={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          height: "100%",
          opacity: 0.7
        }}
      >
        <IoIosChatboxes size={100} color="#3f51b5" />
        <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
          Join a room to start chatting
        </Typography>
      </Box>
    ) : messages.length === 0 ? (
      <Box 
        sx={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          height: "100%",
          opacity: 0.7
        }}
      >
        <IoIosChatboxes size={100} color="#3f51b5" />
        <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
          No messages yet. Start the conversation!
        </Typography>
      </Box>
    ) : (
      messages.map((msg, i) => (
        <Box
          key={i}
          sx={{
            display: "flex",
            width: "100%",
            justifyContent: msg.isOwnMessage ? "flex-end" : msg.isSystem ? "center" : "flex-start",
            mb: 2,
          }}
        >
          {msg.isSystem ? (
            <Chip
              label={msg.message}
              variant="outlined"
              size="small"
              sx={{ 
                backgroundColor: "rgba(0,0,0,0.05)",
                my: 1,
                color: "text.secondary"
              }}
            />
          ) : (
            <Box sx={{ maxWidth: "70%", position: "relative" }}>
              {!msg.isOwnMessage && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    position: "absolute", 
                    top: -18, 
                    left: 8, 
                    color: "text.secondary",
                    fontWeight: "medium"
                  }}
                >
                  {msg.sender || "Anonymous"}
                </Typography>
              )}
              
              <Box sx={{ display: "flex", alignItems: "flex-end" }}>
                {!msg.isOwnMessage && (
                  <Avatar
                    sx={{
                      bgcolor: stringToColor(msg.sender || "Anonymous"),
                      width: 36,
                      height: 36,
                      mr: 1,
                      fontSize: "0.875rem"
                    }}
                  >
                    {(msg.sender || "A")[0].toUpperCase()}
                  </Avatar>
                )}
                
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: "16px",
                    borderTopLeftRadius: msg.isOwnMessage ? "16px" : "4px",
                    borderTopRightRadius: msg.isOwnMessage ? "4px" : "16px",
                    backgroundColor: msg.isOwnMessage ? "#3f51b5" : "white",
                    color: msg.isOwnMessage ? "white" : "black",
                    border: msg.isOwnMessage ? "none" : "1px solid #e0e0e0",
                  }}
                >
                  <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                    {msg.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      textAlign: "right",
                      mt: 0.5,
                      opacity: 0.7,
                    }}
                  >
                    {formatTimestamp(msg.timestamp)}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}
        </Box>
      ))
    )}
  </Box>
            
            <Divider />
            
            <Box sx={{ p: 2 }}>
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={room ? "Type your message..." : "Join a room to chat"}
                  variant="outlined"
                  disabled={!room}
                  autoComplete="off"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          type="submit" 
                          color="primary" 
                          disabled={!room || !message.trim()}
                        >
                          <IoMdSend />
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: "24px",
                    }
                  }}
                />
              </form>
            </Box>
          </Grid>
          
          {/* Right Column - Join Room */}
          <Grid item xs={12} md={4}>
            <Box 
              sx={{ 
                p: 3, 
                height: "60vh",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <Typography variant="h5" gutterBottom>
                {isJoined ? "Room Information" : "Join a Room"}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Your ID: {socketId}
                </Typography>
                
                {isJoined ? (
                  <Box sx={{ mt: 3 }}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        backgroundColor: "rgba(63, 81, 181, 0.05)",
                        borderRadius: "12px",
                        mb: 3
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        Currently in
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: "bold", color: "#3f51b5" }}>
                        {room}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                        Chatting as: <strong>{username || socketId}</strong>
                      </Typography>
                    </Paper>
                    
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      onClick={() => {
                        setRoom("");
                        setIsJoined(false);
                        setMessages([]);
                        socket.emit("leave-room", { room, username: username || socketId });
                        toast.info(`Left room: ${room}`, {
                          position: "top-right",
                          autoClose: 1500,
                        });
                      }}
                      sx={{
                        py: 1.5,
                        borderRadius: "8px",
                      }}
                    >
                      Leave Room
                    </Button>
                  </Box>
                ) : (
                  <form onSubmit={joinRoomHandler} style={{ marginTop: "16px" }}>
                    <TextField
                      fullWidth
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      label="Your Display Name (optional)"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      label="Room Name"
                      variant="outlined"
                      required
                      sx={{ mb: 2 }}
                    />
                    
                    <Button
                      variant="contained"
                      type="submit"
                      color="primary"
                      fullWidth
                      sx={{
                        py: 1.5,
                        borderRadius: "8px",
                        background: "#3f51b5",
                        "&:hover": {
                          background: "#303f9f",
                        },
                      }}
                    >
                      Join Room
                    </Button>
                  </form>
                )}
              </Box>
              
              <Box sx={{ mt: "auto", pt: 4 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="textSecondary" align="center">
                  ChatIt! - Real-time messaging platform
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

// Utility function to generate a color from a string
function stringToColor(string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

export default App;