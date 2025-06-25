// courseController.js
const Course = require('../Models/courseModel');
const asyncHandler = require('express-async-handler');
const User = require('../Models/userModel');
const Module = require('../Models/moduleModel');
const Assignment = require('../models/assignmentModel');
const Unit = require('../Models/unitModel');
const Quiz = require('../Models/quizModel');
const { path } = require('../Routes');
const { default: mongoose } = require('mongoose');
const AssignmentSubmission = require('../Models/assignmentSubmissionModel');
const QuizSubmission = require('../Models/quizSubmissionModel');

const courseController = {
  // Create a new course
  createCourse: asyncHandler(async (req, res) => {
    try {
      const { title, description, price, category, tags,whatYoullLearn,highlights,prerequisites } = req.body; // Include tags from request

      if (!title || !description || !price || !category) {
        return res.status(400).json({ message: 'Please provide all required fields' });
      }

      const course = new Course({
        title,
        description,
        instructorId: req.user._id,
        price,
        category,
        tags: Array.isArray(tags) ? tags : [],
        whatYoullLearn: Array.isArray(whatYoullLearn) ? whatYoullLearn : [],
        highlights: Array.isArray(highlights) ? highlights : [], 
        prerequisites: Array.isArray(prerequisites) ? prerequisites : [], 
      });

      const createdCourse = await course.save();
      res.status(201).json(createdCourse);
    } catch (error) {
      console.error('Error creating course:', error);

      if (error.name === 'ValidationError') {
        // Mongoose validation error
        const validationErrors = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: 'Validation error', errors: validationErrors });
      } else if (error.code === 11000) {
        // Duplicate key error (e.g., unique title)
        return res.status(400).json({ message: 'Duplicate key error', error: error.message });
      } else {
        // Generic server error
        return res.status(500).json({ message: 'Internal server error', error: error.message });
      }
    }
  }),

  getAllCourses: asyncHandler(async (req, res) => {
    try {
      const user = req.user;
      const page = parseInt(req.query.page) || 1;
      const limit = 9;
      const skip = (page - 1) * limit;

      

      let query = {};

      // Search functionality
      const searchTerm = req.query.search;
      if (searchTerm) {
        query.$or = [
          { title: { $regex: searchTerm, $options: 'i' } },
          { tags: { $regex: searchTerm, $options: 'i' } },
        ];
      }

      let coursesQuery;
      const selectFields = 'title price category tags instructorId'; // Select only needed fields

      if (user && user.role === 'admin') {
        coursesQuery = Course.find(query).select(selectFields).populate("instructorId");
      } else if (user && user.role === 'student') {
        coursesQuery = Course.find(query).select(selectFields).populate("instructorId");
      } else if (user && user.role === 'instructor') {
        coursesQuery = Course.find({
          $and: [
            query,
            { instructorId: user._id }
          ]
        }).select(selectFields).populate("instructorId");
      } else {
        coursesQuery = Course.find(query).select(selectFields).populate("instructorId");
      }

      const courses = await coursesQuery.skip(skip).limit(limit);
      const totalCourses = await Course.countDocuments(query);
      const totalPages = Math.ceil(totalCourses / limit);

      res.json({
        courses,
        currentPage: page,
        totalPages,
        totalCourses,
      });

    } catch (error) {
      console.error('Error getting courses:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }),

   getCourseById : asyncHandler(async (req, res) => {
    try {
      const course = await Course.findById(req.params.id).populate('instructorId');
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      // Fetch related modules
      const modules = await Module.find({ _id: { $in: course.modules } });
  
      // Send structured response
      res.json({
        course,
        modules,
      });
    } catch (error) {
      console.error('Error getting course by ID:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({ message: "Invalid Course ID." });
      }
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }),
  

  updateCourse: asyncHandler(async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (course) {
        if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'You are not authorized to update this course' });
        }

        const { title, description, price, category, tags } = req.body; // Get nested courseData

        course.title = title || course.title;
        course.description = description || course.description;
        course.price = price || course.price;
        course.category = category || course.category;
        course.tags = Array.isArray(tags) ? tags : []; // Update tags

        const updatedCourse = await course.save();
        res.json(updatedCourse);
      } else {
        res.status(404).json({ message: 'Course not found' });
      }
    } catch (error) {
      console.error('Error updating course:', error);
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: 'Validation error', errors: validationErrors });
      } else if (error.name === 'CastError') {
        return res.status(400).json({ message: "Invalid Course ID." });
      }
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }),

  deleteCourse: asyncHandler(async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (course) {
        if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'You are not authorized to delete this course' });
        }

        await course.deleteOne(); // Replace course.remove() with course.deleteOne()
        res.json({ message: 'Course removed' });
      } else {
        res.status(404).json({ message: 'Course not found' });
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({ message: "Invalid Course ID." });
      }
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }),

  getCoursesByCategory: asyncHandler(async (req, res) => {
    try {
      const courses = await Course.find({ category: req.params.category }).populate('instructorId');
      res.json(courses);
    } catch (error) {
      console.error('Error getting courses by category:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }),

  getCoursesByInstructorId: asyncHandler(async (req, res) => {
    try {
      const courses = await Course.find({ instructorId: req.params.instructorId }).populate('instructorId');
      res.json(courses);
    } catch (error) {
      console.error('Error getting courses by instructor ID:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }),

  getCourseContent: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;

    try {
        // Fetch the course with instructor details
        const course = await Course.findById(courseId)
            .populate({ path: 'instructorId', select: 'username' })
            .select('-__v')
            .lean();
            

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Authorization check (uncomment if needed)

        // if (
        //     !course.students.includes(userId) &&
        //     req.user.role !== 'admin' &&
        //     course.instructorId.toString() !== userId.toString()
        // ) {
        //     return res.status(403).json({ message: 'Not authorized to view this course content' });
        // }

        // Fetch modules for the course
        const modules = await Module.find({ courseId })
            .select('title description order')
            .sort({ order: 1 })
            .lean();

        // Process each module to include units, assignments, quizzes, and submission status
        const modulesWithDetails = await Promise.all(
            modules.map(async (module) => {
                // Fetch units
                const units = await Unit.find({ moduleId: module._id })
                    .select('title content order')
                    .sort({ order: 1 })
                    .lean();

                // Fetch assignments
                const assignments = await Assignment.find({ moduleId: module._id })
                    .select('title description')
                    .lean();

                // Fetch quizzes
                const quizzes = await Quiz.find({ moduleId: module._id })
                    .select('question')
                    .lean();

                // Check submission status for assignments
                const assignmentSubmissions = await AssignmentSubmission.find({
                    moduleId: module._id,
                    studentId: userId,
                }).lean();

                const assignmentsWithStatus = assignments.map((assignment) => {
                    const submission = assignmentSubmissions.find(
                        (sub) => sub.assignmentId.toString() === assignment._id.toString()
                    );
                    return {
                        _id: assignment._id,
                        title: assignment.title,
                        content: assignment.description, // Map description to content
                        isSubmitted: !!submission, // true if submission exists
                    };
                });

                // Check submission status for quizzes
                const quizSubmissions = await QuizSubmission.find({
                    moduleId: module._id,
                    userId: userId,
                }).lean();

                const quizzesWithStatus = quizzes.map((quiz) => {
                    const submission = quizSubmissions.find(
                        (sub) => sub.quizId.toString() === quiz._id.toString()
                    );
                    return {
                        _id: quiz._id,
                        title: quiz.question?.questionText || 'Quiz',
                        content: quiz.question,
                        isSubmitted: !!submission, // true if submission exists
                    };
                });

                return {
                    _id: module._id,
                    title: module.title,
                    units: units.map((unit) => ({
                        _id: unit._id,
                        title: unit.title,
                        content: unit.content,
                    })),
                    assignments: assignmentsWithStatus,
                    quizzes: quizzesWithStatus,
                };
            })
        );

        // Construct the final response
        const formattedCourseContent = {
            course: {
                _id: course._id,
                title: course.title,
                description: course.description,
                instructor: course.instructorId.username,
                whatYoullLearn:course.whatYoullLearn,
                highlights:course.highlights
            },
            modules: modulesWithDetails,
        };

        res.json(formattedCourseContent);
    } catch (error) {
        console.error('Error fetching course content:', error);
        res.status(500).json({ message: 'Failed to fetch course content', error: error.message });
    }
}),

  getEnrolledCourses: asyncHandler(async(req,res)=>{
    try {
      const user = await User.findById(req.user.id);
      res.json(user.enrolledCourses);
      
    } catch (error) {
      console.log("Fetch Enrollred cousre Error",error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  
    }),

    getEveryCourses:asyncHandler(async(req,res)=>{
      const courses=await Course.find()
      res.json(courses)
    }),
    getAdminDashboardData : asyncHandler(async (req, res) => {
      // --- Part 1: Summary Data ---
      // You might need separate API endpoints or logic if fetching all users/students
      // becomes too heavy for every dashboard load. For now, assuming it's acceptable.
      // Alternatively, you could have dedicated count endpoints.
  
      // Let's assume you have User model and can count roles
      // const totalInstructors = await User.countDocuments({ role: 'instructor' }); // Example
      // const totalStudents = await User.countDocuments({ role: 'student' }); // Example
      const totalCourses = await Course.countDocuments(); // Overall total courses
  
      // For simplicity in this example, we'll just send the total course count.
      // You'll fetch instructor/student counts via their respective API calls on the frontend as you currently do.
  
      // --- Part 2: Paginated Course List ---
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5; // Default limit 10
      const search = req.query.search || '';
  
      const skip = (page - 1) * limit;
  
      let filter = {};
      if (search) {
          const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
          filter = {
              $or: [
                  { title: searchRegex },
                  { tags: searchRegex } // Searches if any tag in the array matches
              ]
          };
      }
  
      // Fetch courses for the current page with search filter and populate instructor details
      const courses = await Course.find(filter)
          .populate({
              path: 'instructorId',
              select: 'profile.firstName profile.lastName username email' // Select specific fields
          })
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }); // Optional: Sort by creation date
  
      // Get the total count of courses matching the *current filter* (for pagination)
      const filteredTotalCourses = await Course.countDocuments(filter);
  
      res.json({
          summary: {
              totalCourses, // Overall total courses
              // Add totalInstructors, totalStudents here if fetched in this endpoint
          },
          list: {
              courses,
              currentPage: page,
              totalPages: Math.ceil(filteredTotalCourses / limit),
              totalMatchingCourses: filteredTotalCourses,
          }
      })
  }),
  getAdminSummaryCounts : asyncHandler(async (req, res) => {
    // const totalInstructors = await User.countDocuments({ role: 'instructor' });
    // const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments();

    // Replace with actual counts from your User model logic
    const placeholderInstructors = await User.find({role:"instructor"}).countDocuments()
    const placeholderStudents = await User.find({role:"student"}).countDocuments()


    res.json({
        totalCourses,
        totalInstructors: placeholderInstructors, // Replace with actual count
        totalStudents: placeholderStudents // Replace with actual count
    });
}),
getAdminDashboardStats : asyncHandler(async (req, res) => {
  try {
      // --- 1. Summary Counts ---
      const totalInstructors = await User.countDocuments({ role: 'instructor' }); // Adjust filter as needed
      const totalStudents = await User.countDocuments({ role: 'student' }); // Adjust filter as needed
      const totalCourses = await Course.countDocuments();

      console.log("working");
      
      // Calculate Active Enrollments using Aggregation
      const enrollmentAggregation = await Course.aggregate([
          {
              $match: { students: { $exists: true, $ne: [] } } // Optimization: Only consider courses with students array
          },
          {
              $project: {
                  studentCount: { $size: "$students" } // Get the size of the students array
              }
          },
          {
              $group: {
                  _id: null, // Group all results
                  totalEnrollments: { $sum: "$studentCount" } // Sum the sizes
              }
          }
      ]);
      const activeEnrollments = enrollmentAggregation.length > 0 ? enrollmentAggregation[0].totalEnrollments : 0;

      console.log(activeEnrollments);
      

      // --- 2. Growth Data (Monthly for the last 12 months) ---
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const monthsArray = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      // User Growth Aggregation
      const userGrowth = await User.aggregate([
          { $match: { createdAt: { $gte: twelveMonthsAgo } } }, // Filter last 12 months
          {
              $group: {
                  _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                  count: { $sum: 1 }
              }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
          {
              $project: {
                  _id: 0,
                  year: "$_id.year",
                  month: "$_id.month",
                  count: 1
              }
          }
      ]);

      // Course Growth Aggregation
      const courseGrowth = await Course.aggregate([
          { $match: { createdAt: { $gte: twelveMonthsAgo } } }, // Filter last 12 months
          {
              $group: {
                  _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                  count: { $sum: 1 }
              }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
          {
              $project: {
                  _id: 0,
                  year: "$_id.year",
                  month: "$_id.month",
                  count: 1
              }
          }
      ]);

      // --- 3. Combine Growth Data for Chart ---
      const growthDataMap = new Map(); // Use a map for easy lookup: key = "YYYY-MM"

      // Initialize map with last 12 months
      const currentMonth = new Date();
      for (let i = 0; i < 12; i++) {
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i, 1);
          const year = date.getFullYear();
          const month = date.getMonth() + 1; // getMonth is 0-indexed
          const key = `${year}-${month.toString().padStart(2, '0')}`; // Format YYYY-MM
          growthDataMap.set(key, {
              name: `${monthsArray[month]} ${year}`, // e.g., "Apr 2025"
              users: 0,
              courses: 0,
              year: year,
              month: month
          });
      }


      // Populate map with user data
      userGrowth.forEach(item => {
          const key = `${item.year}-${item.month.toString().padStart(2, '0')}`;
          if (growthDataMap.has(key)) {
              growthDataMap.get(key).users = item.count;
          }
      });

      // Populate map with course data
      courseGrowth.forEach(item => {
          const key = `${item.year}-${item.month.toString().padStart(2, '0')}`;
          if (growthDataMap.has(key)) {
              growthDataMap.get(key).courses = item.count;
          }
      });

      // Convert map values to array and sort chronologically
      const finalGrowthData = Array.from(growthDataMap.values()).sort((a, b) => {
          if (a.year !== b.year) {
              return a.year - b.year;
          }
          return a.month - b.month;
      });

      // --- 4. Send Response ---
      res.status(200).json({
          success: true,
          summary: {
              totalInstructors,
              totalStudents,
              totalCourses,
              activeEnrollments
          },
          growthData: finalGrowthData // Use the merged and sorted data
      });

  } catch (error) {
      console.error("Error fetching admin dashboard stats:", error);
      res.status(500).json({ success: false, message: "Server error fetching dashboard stats." });
  }
}),
generateCertificate: asyncHandler(async(req,res)=>{
  const {courseId} = req.params
  if(!courseId){
    res.status(404).send("courseId not found")
  }
  
  const courseDetails = await Course.findById(courseId).populate("instructorId")
  if(!courseDetails){
    res.status(404).send("Course Not Found")
  }
  
  res.status(200).json({
    course:courseDetails,
    user:req.user.username
  })
})
};

module.exports = courseController;