// moduleController.js
const Module = require('../Models/moduleModel');
const Course = require('../Models/courseModel');
const asyncHandler = require('express-async-handler');

const moduleController = {
  // Create a new module
  createModule: asyncHandler(async (req, res) => {
    const { title, description, courseId, order } = req.body;
  
    if (!title || !courseId) {
      return res.status(400).json({ message: 'Title and courseId are required' });
    }
  
    try {
      // Check if the course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      // Check if the user is the instructor of the course
      if (course.instructorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to add modules to this course' });
      }
  
      const module = new Module({
        title,
        description,
        courseId,
        order: order || 0,
        instructorId: req.user._id, // Default order if not provided
      });
  
      const createdModule = await module.save();

      course.modules.push(createdModule._id);
      await course.save();

      res.status(201).json(createdModule);
    } catch (error) {
      console.error('Error creating module:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }),

  // Get all modules
  getAllModules: asyncHandler(async (req, res) => {
    const modules = await Module.find().populate('courseId');
    res.json(modules);
  }),

  // Get module by ID
  getModuleById: asyncHandler(async (req, res) => {
    const module = await Module.findById(req.params.id).populate('courseId units');
    if (module) {
      res.json(module);
    } else {
      res.status(404).json({ message: 'Module not found' });
    }
  }),

  // Update module (only admin or instructor who created the course)
  updateModule: asyncHandler(async (req, res) => {
    const module = await Module.findById(req.params.id).populate('courseId');
    

    if (module) {
      const course = await Course.findById(module.courseId);

      if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to update this module' });
      }

      module.title = req.body.title || module.title;
      module.description = req.body.description || module.description;
      module.order = req.body.order || module.order;

      const updatedModule = await module.save();
      res.json(updatedModule);
    } else {
      res.status(404).json({ message: 'Module not found' });
    }
  }),

  // Delete module (only admin or instructor who created the course)
  deleteModule: asyncHandler(async (req, res) => {
    const module = await Module.findById(req.params.id).populate('courseId');
  
    if (module) {
      const course = await Course.findById(module.courseId);
  
      if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to delete this module' });
      }
  
      // Remove the module from the course's modules array
      await Course.updateOne(
        { _id: module.courseId },
        { $pull: { modules: module._id } }
      );
  
      await module.deleteOne(); // Replace module.remove() with module.deleteOne()
      res.json({ message: 'Module removed' });
    } else {
      res.status(404).json({ message: 'Module not found' });
    }
  }),

  // Get modules by course ID
  getModulesByCourseId: asyncHandler(async (req, res) => {
    const modules = await Module.find({ courseId: req.params.courseId }).populate('courseId');
    res.json(modules);
  }),
};

module.exports = moduleController;