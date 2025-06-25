// resourceLibraryController.js
const ResourceLibrary = require('../Models/resourceLibraryModel');
const Notification = require('../Models/notificationModel');
const asyncHandler = require('express-async-handler');
const User = require('../Models/userModel'); // Import User model

const resourceLibraryController = {
  // Create a new resource
  createResource:asyncHandler(async (req, res) => {
    const { title, description, category } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({ message: 'Title and file are required' });
    }

    const fileUrl = req.file.path; // Get the Cloudinary URL

    const resource = new ResourceLibrary({
      title,
      description,
      fileUrl,
      userId: req.user._id,
      category,
    });

    const createdResource = await resource.save();
    res.status(201).json(createdResource);
  }),

  // Get all resources
  getAllResources: asyncHandler(async (req, res) => {
    const resources = await ResourceLibrary.find().populate('userId');
    res.json(resources);
  }),

  // Get resource by ID
  getResourceById: asyncHandler(async (req, res) => {
    const resource = await ResourceLibrary.findById(req.params.id).populate('userId');
    if (resource) {
      res.json(resource);
    } else {
      res.status(404).json({ message: 'Resource not found' });
    }
  }),

  // Update resource (only creator or admin)
  updateResource: asyncHandler(async (req, res) => {
    const resource = await ResourceLibrary.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (req.user.role !== 'admin' && resource.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to update this resource' });
    }

    resource.title = req.body.title || resource.title;
    resource.description = req.body.description || resource.description;
    resource.category = req.body.category || resource.category;

    if (req.file) {
      resource.fileUrl = req.file.path; // Update the file URL
    }

    const updatedResource = await resource.save();
    res.json(updatedResource);
  }),

  // Delete resource (only creator or admin)
  deleteResource: asyncHandler(async (req, res) => {
    const resource = await ResourceLibrary.findById(req.params.id);

    if (resource) {
      if (req.user.role !== 'admin' && resource.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to delete this resource' });
      }

      await resource.remove();
      res.json({ message: 'Resource removed' });
    } else {
      res.status(404).json({ message: 'Resource not found' });
    }
  }),

  // Get resources by user ID
  getResourcesByUserId: asyncHandler(async (req, res) => {
    const resources = await ResourceLibrary.find({ userId: req.params.userId }).populate('userId');
    res.json(resources);
  }),

  // Get resources by category
  getResourcesByCategory: asyncHandler(async (req, res) => {
    const resources = await ResourceLibrary.find({ category: req.params.category }).populate('userId');
    res.json(resources);
  }),

  shareResource: asyncHandler(async (req, res) => {
    const { resourceId, userId, groupId } = req.body;

    try {
      const resource = await ResourceLibrary.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      if (userId) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        if (!resource.sharedWithUsers.includes(userId)) {
          resource.sharedWithUsers.push(userId);
          await resource.save();

          const notification = new Notification({
            userId: userId,
            type: 'resourceShared',
            message: `The resource "${resource.title}" was shared with you.`,
            relatedItemId: resourceId,
          });
          await notification.save();

          io.to(userId).emit('resourceShared', { resource, userId }); // Real-time update
        }
      }

      if (groupId) {
        const group = await StudyGroup.findById(groupId);
        if (!group) {
          return res.status(404).json({ message: 'Group not found' });
        }

        if (!resource.sharedWithGroups.includes(groupId)) {
          resource.sharedWithGroups.push(groupId);
          await resource.save();

          group.members.forEach(async (memberId) => {
            const notification = new Notification({
              userId: memberId,
              type: 'resourceShared',
              message: `The resource "<span class="math-inline">\{resource\.title\}" was shared in group "</span>{group.groupName}".`,
              relatedItemId: resourceId,
            });
            await notification.save();
            io.to(memberId).emit('resourceShared', { resource, groupId }); // Real-time update
          });
        }
      }

      res.json({ message: 'Resource shared successfully' });
    } catch (error) {
      console.error('Sharing error:', error);
      res.status(500).json({ message: 'Internal server error during sharing' });
    }
  }),

  searchResources: asyncHandler(async (req, res) => {
    const { query } = req.query;
    const resources = await ResourceLibrary.find({ title: { $regex: query, $options: 'i' } })
      .populate('userId');
    res.json(resources);
  }),
};

module.exports = resourceLibraryController;