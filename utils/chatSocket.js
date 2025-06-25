const socketIO = require("socket.io");
const ChatMessage = require("../Models/chatMessageModel");
const Group = require("../Models/groupModel");
const jwt = require("jsonwebtoken");

const setupSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  // JWT authentication
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      console.log("Authenticated user:", decoded);
      next();
    } catch (error) {
      console.error("Token verification error:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join a room
    socket.on("joinRoom", ({ roomId }) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room: ${roomId}`);
      // Notify all clients in the room that a user has joined
      io.to(roomId).emit("userJoined", { userId: socket.user.id, roomId });
    });

    // Leave a room
    socket.on("leaveRoom", ({ roomId }) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room: ${roomId}`);
    });

    // Send message
    socket.on("sendMessage", async (messageData, callback) => {
      try {
        const newMessage = new ChatMessage({
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          content: messageData.message,
          groupId: messageData.groupId,
          roomId: messageData.roomId,
        });

        const savedMessage = await newMessage.save();
        const populatedMessage = await ChatMessage.findById(savedMessage._id).populate("senderId");

        // Emit to room (group or individual)
        io.to(messageData.roomId).emit("message", populatedMessage);

        // Update chat list
        if (messageData.groupId) {
          const group = await Group.findById(messageData.groupId);
          if (group) {
            io.emit("chatUpdated", {
              chatId: messageData.groupId,
              lastMessage: { content: messageData.message },
              updatedAt: new Date(),
              chatType: "group",
            });
          }
        } else {
          // Emit chatUpdated to both sender and receiver
          const roomMembers = [messageData.senderId, messageData.receiverId];
          roomMembers.forEach((userId) => {
            io.emit("chatUpdated", {
              chatId: userId === messageData.senderId ? messageData.receiverId : messageData.senderId,
              lastMessage: { content: messageData.message },
              updatedAt: new Date(),
              chatType: "individual",
            });
          });
        }

        callback({ status: "success", messageId: savedMessage._id });
      } catch (error) {
        console.error("Error saving message:", error);
        callback({ status: "error", error: "Failed to save message" });
      }
    });

    // Handle group creation
    socket.on("groupCreated", (group) => {
      // Broadcast to all clients, including those in other tabs
      io.emit("groupCreated", group);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = { setupSocket };