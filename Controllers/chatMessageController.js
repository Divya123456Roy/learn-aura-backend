const asyncHandler = require("express-async-handler");
const ChatMessage = require("../Models/chatMessageModel");
const Group = require("../Models/groupModel");
const mongoose = require("mongoose");

const chatMessageController = {
  getChatMessagesBetweenUsers: asyncHandler(async (req, res) => {
    const { userId1, userId2 } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 25;
    const skip = (page - 1) * limit;

    const messages = await ChatMessage.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("senderId receiverId")
      .skip(skip)
      .limit(limit);

    res.json(messages);
  }),

  getChatMessagesInGroup: asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 25;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID format" });
    }

    const messages = await ChatMessage.find({ groupId })
      .sort({ createdAt: 1 })
      .populate("senderId groupId")
      .skip(skip)
      .limit(limit);

    res.json(messages);
  }),

  createChatMessage: asyncHandler(async (req, res) => {
    const { senderId, receiverId, message, groupId } = req.body;

    if (!senderId || (!receiverId && !groupId) || !message) {
      return res.status(400).json({ message: "Please provide senderId, receiverId or groupId, and message" });
    }

    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ message: "Invalid senderId format" });
    }
    if (receiverId && !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiverId format" });
    }
    if (groupId && !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid groupId format" });
    }

    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      if (!group.members.includes(senderId)) {
        return res.status(403).json({ message: "User is not a member of this group" });
      }
    }

    const chatMessage = new ChatMessage({
      senderId,
      receiverId,
      content: message,
      groupId,
      received: receiverId ? true : false,
    });

    const createdChatMessage = await chatMessage.save();
    res.status(201).json(createdChatMessage);
  }),

  createGroup: asyncHandler(async (req, res) => {
    const { groupName, members } = req.body;

    if (!groupName || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "Please provide groupName and members" });
    }

    const group = new Group({
      groupName,
      members,
      createdBy: req.user._id,
    });

    const createdGroup = await group.save();
    res.status(201).json(createdGroup);
  }),
};

module.exports = chatMessageController;