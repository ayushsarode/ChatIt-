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
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IoIosChatboxes } from "react-icons/io";

const App = () => {
  const socket = useMemo(() => io("http://localhost:3000"), []);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("");
  const [socketId, setSocketId] = useState("");
  const [roomName, setRoomName] = useState("");

  const handleSumbit = (e) => {
    e.preventDefault();
    socket.emit("message", { message, room });
    setMessage("");
  };

  const joinRoomHandler = (e) => {
    e.preventDefault();

    if (!roomName.trim()) {
      toast.error("Room name cannot be empty", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    socket.emit("join-room", roomName);
    setRoom(roomName);
    setRoomName("");
    toast.success(`Joined room: ${roomName}`, {
      position: "top-right",
      autoClose: 1500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  useEffect(() => {
    socket.on("connect", () => {
      setSocketId(socket.id);
    });

    socket.on("recive-message", (data) => {
      setMessages((messages) => [...messages, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  // Helper function to format the timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes()}`;
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "90vh",
      }}
    >
      <Typography
        variant="h2"
        component="div"
        gutterBottom
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "50px",
          height: "100%",
        }}
      >
        ChatIt! <IoIosChatboxes style={{ marginLeft: "10px" }} />
      </Typography>
      <ToastContainer />
      <Grid container spacing={4}>
        {/* Left Column - Form */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              height: "70vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: "100%", // Ensure full width for Paper
              maxWidth: "600px", // Max width constraint
              mx: "auto", // Centering
            }}
          >
            <Typography variant="h4" component="div" gutterBottom>
              Join & Chat
            </Typography>

            <Typography variant="body1" color="textSecondary" gutterBottom>
              Connected with ID: {socketId}
            </Typography>

            {!room && (
              <form
                onSubmit={joinRoomHandler}
                style={{ marginBottom: "20px", width: "90%" }} // Ensure form is full width
              >
                <Box sx={{ mb: 2, width: "100%" }}>
                  <TextField
                    fullWidth
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    label="Enter Room Name"
                    variant="outlined"
                    sx={{ width: "100%" }}
                  />
                </Box>
                <Button
                  variant="contained"
                  type="submit"
                  color="primary"
                  fullWidth
                  sx={{
                    py: 1.5,
                    background:
                      "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
                    color: "white",
                    "&:hover": {
                      background:
                        "linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)",
                    },
                    borderRadius: "50px",
                    width: "100%",
                  }}
                >
                  Join Room
                </Button>
              </form>
            )}

            <form onSubmit={handleSumbit} style={{ width: "90%" }}>
              <Stack spacing={2} sx={{ width: "100%" }}>
                <TextField
                  fullWidth
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  label="Enter Message"
                  variant="outlined"
                  sx={{ width: "100%" }}
                />
                <TextField
                  fullWidth
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  label="Room Name"
                  variant="outlined"
                  disabled
                  sx={{ width: "100%" }}
                />
                <Button
                  variant="contained"
                  type="submit"
                  color="primary"
                  fullWidth
                  sx={{
                    py: 1.5,
                    background:
                      "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
                    color: "white",
                    "&:hover": {
                      background:
                        "linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)",
                    },
                    borderRadius: "50px",
                    width: "100%",
                  }}
                >
                  Send Message
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>

        {/* Right Column - Chat Messages */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4, height: "520px", overflowY: "auto" }}>
            <Typography variant="h5" component="div" gutterBottom>
              Chat Room: {room ? room : "No Room Joined"}
            </Typography>

            <Stack spacing={2} sx={{ mt: 2, alignItems: "flex-start" }}>
              {messages.map((m, i) => (
                <Paper
                  key={i}
                  elevation={2}
                  sx={{
                    display: "inline-block", // Ensure Paper wraps only the content
                    maxWidth: "80%", // Optional: limit max width for long messages
                    p: 0.5,
                    background: "skyblue",
                    borderRadius: "50px",
                    color: "white",
                    px: 2,
                    wordBreak: "break-word", // Ensure long words wrap within the Paper
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ fontSize: "1.2rem", mt: 0.5 }}
                    gutterBottom
                  >
                    {m.message}
                    <Typography
                      variant="caption"
                      sx={{ display: "block", fontSize: "0.8rem", color: "lightgray" }}
                    >
                      {formatTimestamp(m.timestamp)}
                    </Typography>
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default App;
