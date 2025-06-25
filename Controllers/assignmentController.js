const Assignment = require('../models/assignmentModel');
const asyncHandler = require('express-async-handler');
const Module = require('../Models/moduleModel');
const Course = require('../Models/courseModel');

const assignmentController = {
  // Create a new assignment
  createAssignment: asyncHandler(async (req, res) => {
    const { title, description, courseId, moduleId } = req.body;
    const instructorId = req.user._id;

    if (!title || !description || !courseId || !moduleId) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const module = await Module.findById(moduleId);
    const course = await Course.findById(courseId);

    if (!module || !course) {
      return res.status(404).json({ message: 'Module or Course not found' });
    }

    if (req.user.role !== 'admin' && module.instructorId.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: 'Not authorized to create assignments for this module' });
    }

    const assignment = new Assignment({
      title,
      description,
      courseId,
      moduleId,
      instructorId,
    });

    const createdAssignment = await assignment.save();
    res.status(201).json(createdAssignment);
  }),

  // Get all assignments
  getAllAssignments: asyncHandler(async (req, res) => {
    const assignments = await Assignment.find().populate('courseId', 'title').populate('moduleId', 'title');
    res.json(assignments);
  }),

  // Get assignment by ID
  getAssignmentById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const assignment = await Assignment.findById(id).populate('courseId', 'title').populate('moduleId', 'title');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  }),

  // Update an assignment
  updateAssignment: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, courseId, moduleId } = req.body;
    const instructorId = req.user._id;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const module = await Module.findById(assignment.moduleId);

    if (req.user.role !== 'admin' && module.instructorId.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this assignment' });
    }

    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (courseId) assignment.courseId = courseId;
    if (moduleId) assignment.moduleId = moduleId;

    const updatedAssignment = await assignment.save();
    res.json(updatedAssignment);
  }),

  // Delete an assignment
  deleteAssignment: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const instructorId = req.user._id;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const module = await Module.findById(assignment.moduleId);

    if (req.user.role !== 'admin' && module.instructorId.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this assignment' });
    }

    await Assignment.findByIdAndDelete(id);
    res.json({ message: 'Assignment deleted successfully' });
  }),

  // Get assignments by course ID
  getAssignmentsByCourse: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const assignments = await Assignment.find({ courseId }).populate('moduleId', 'title');
    res.json(assignments);
  }),

  // Get assignments by module ID
  getAssignmentsByModule: asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    console.log(moduleId);
    
    const assignments = await Assignment.find({ moduleId }).populate('courseId', 'title');
    console.log(assignments);
    
    res.json(assignments);
  }),
};

module.exports = assignmentController;