// studyGroupController.js
const DiscussionForum = require('../Models/discussionForumModel');
const asyncHandler = require('express-async-handler');
const Notification = require('../Models/notificationModel');
const StudyGroup = require('../Models/studyGroupModel');

const studyGroupController = {
  // Create a new study group
  createStudyGroup: asyncHandler(async (req, res) => {
    const { groupName, description, tags } = req.body;

    if (!groupName) {
      return res.status(400).json({ message: 'GroupName is required' });
    }

    const studyGroup = new StudyGroup({
      groupName,
      description,      
      groupImage: req.file ? req.file.path : null, // Store image path from middleware
      tags,
      members: [req.user._id],
      admins: [req.user._id],
    });

    const createdStudyGroup = await studyGroup.save();

    res.status(201).json(createdStudyGroup);
  }),

  // Get all study groups
  getAllStudyGroups: asyncHandler(async (req, res) => {
    const studyGroups = await StudyGroup.find().populate('members admins');
    res.json(studyGroups);
  }),

  // Get study group by ID
  getStudyGroupById: asyncHandler(async (req, res) => {
    const studyGroup = await StudyGroup.findById(req.params.id).populate('members admins');
    if (studyGroup) {
      res.json(studyGroup);
    } else {
      res.status(404).json({ message: 'Study group not found' });
    }
  }),

  // Update study group (only admins)
  updateStudyGroup: asyncHandler(async (req, res) => {
    const studyGroup = await StudyGroup.findById(req.params.id);

    if (studyGroup) {
      if (!studyGroup.admins.includes(req.user._id)) {
        return res.status(403).json({ message: 'You are not authorized to update this study group' });
      }

      const { groupName, description, settings, courseId, forumId, tags } = req.body;

      studyGroup.groupName = groupName || studyGroup.groupName;
      studyGroup.description = description || studyGroup.description;
      studyGroup.settings = settings || studyGroup.settings;
      studyGroup.courseId = courseId || studyGroup.courseId;
      studyGroup.forumId = forumId || studyGroup.forumId;
      studyGroup.groupImage = req.file ? req.file.path : studyGroup.groupImage; // Update image if new file is uploaded
      studyGroup.tags = tags || studyGroup.tags;

      const updatedStudyGroup = await studyGroup.save();
      res.json(updatedStudyGroup);
    } else {
      res.status(404).json({ message: 'Study group not found' });
    }
  }),

  // Delete study group (only admins)
  deleteStudyGroup: asyncHandler(async (req, res) => {
    const studyGroup = await StudyGroup.findById(req.params.id);

    if (studyGroup) {
      if (!studyGroup.admins.includes(req.user._id)) {
        return res.status(403).json({ message: 'You are not authorized to delete this study group' });
      }

      if (studyGroup.forumId) {
        await DiscussionForum.findByIdAndDelete(studyGroup.forumId);
      }

      await studyGroup.remove();
      res.json({ message: 'Study group removed' });
    } else {
      res.status(404).json({ message: 'Study group not found' });
    }
  }),

  // Add member to study group (only admins)
  addMember : asyncHandler(async (req, res) => {
    const studyGroup = await StudyGroup.findById(req.params.id);

    if (!studyGroup) {
        return res.status(404).json({ message: 'Study group not found' });
    }

    // Uncomment and adjust authorization logic if needed
    // if (!studyGroup.admins.includes(req.user._id)) {
    //     return res.status(403).json({ message: 'You are not authorized to add members to this study group' });
    // }

    if (studyGroup.members.includes(req.user._id)) {
        return res.status(400).json({ message: 'User is already a member.' });
    }

    studyGroup.members.push(req.user._id);
    await studyGroup.save();

    // Create notification with properly formatted message
    const notification = new Notification({
        userId: req.user._id,
        type: 'groupJoined',
        message: `${req.user.username} added you to the study group "${studyGroup.groupName}".`,
        relatedId: studyGroup._id,
        relatedModel: 'StudyGroup',
    });
    await notification.save();

    res.json({ message: 'Member added' });
}),
  // Remove member from study group (only admins)
  removeMember: asyncHandler(async (req, res) => {
    const studyGroup = await StudyGroup.findById(req.params.id);

    if (studyGroup) {
      if (!studyGroup.admins.includes(req.user._id)) {
        return res.status(403).json({ message: 'You are not authorized to remove members from this study group' });
      }

      const index = studyGroup.members.indexOf(req.body.userId);
      if (index > -1) {
        studyGroup.members.splice(index, 1);
        await studyGroup.save();

        res.json({ message: 'Member removed' });
      } else {
        res.status(404).json({ message: 'User is not a member of this group.' });
      }
    } else {
      res.status(404).json({ message: 'Study group not found' });
    }
  }),

  // Invite user to group (only admins)
  inviteUserToGroup: asyncHandler(async (req, res) => {
    const { groupId, userId } = req.body;
    const studyGroup = await StudyGroup.findById(groupId);

    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (!studyGroup.admins.includes(req.user._id)) {
      return res.status(403).json({ message: 'You are not authorized to invite members to this study group' });
    }

    if (studyGroup.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member.' });
    }

    if (studyGroup.invitedUsers.includes(userId)) {
      return res.status(400).json({ message: 'User is already invited.' });
    }

    studyGroup.invitedUsers.push(userId);
    await studyGroup.save();

    const notification = new Notification({
      userId: userId,
      type: 'groupInvitation',
      message: `<span class="math-inline">\{req\.user\.username\} invited you to join the group "</span>{studyGroup.groupName}".`,
      relatedId: groupId,
      relatedModel: 'StudyGroup',
    });
    await notification.save();

    res.json({ message: 'User invited to group' });
  }),

  // Join group
  joinGroup: asyncHandler(async (req, res) => {
    const { groupId } = req.body;
    const studyGroup = await StudyGroup.findById(groupId);

    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (studyGroup.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'User is already a member.' });
    }

    studyGroup.invitedUsers = studyGroup.invitedUsers.filter(id => id.toString() !== req.user._id.toString());
    studyGroup.members.push(req.user._id);
    await studyGroup.save();

    if (studyGroup.admins.length > 0) {
      const notification = new Notification({
        userId: studyGroup.admins[0],
        type: 'groupJoined',
        message: `<span class="math-inline">\{req\.user\.username\} joined your group "</span>{studyGroup.groupName}".`,
        relatedId: groupId,
        relatedModel: 'StudyGroup',
      });
      await notification.save();
    }

    res.json({ message: 'User joined group successfully'  })
}),
};

module.exports = studyGroupController;