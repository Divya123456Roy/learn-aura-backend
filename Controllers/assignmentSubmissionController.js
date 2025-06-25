
const asyncHandler = require('express-async-handler');
const AssignmentSubmission = require('../Models/assignmentSubmissionModel');
const Module = require('../Models/moduleModel');
const Course = require('../Models/courseModel');
const Assignment = require('../models/assignmentModel');
const { default: mongoose } = require('mongoose');
const Enrollment = require('../Models/enrollmentModel');

const assignmentSubmissionController = {
  // Student submits an assignment
  submitAssignment: asyncHandler(async (req, res) => {
    const submissionFile = req.file.path
    
    const { assignmentId } = req.body;
    const studentId = req.user._id;

    if (!assignmentId || !submissionFile) {
      return res.status(400).json({ message: 'Assignment ID and submission file are required' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const existingSubmission = await AssignmentSubmission.findOne({ assignmentId, studentId });
    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this assignment' });
    }

    const module = await Module.findById(assignment.moduleId);
    const course = await Course.findById(assignment.courseId);

    const submission = new AssignmentSubmission({
      assignmentId,
      studentId,
      courseId: course._id,
      moduleId: module._id,
      submissionFile,
      submissionDate: new Date(), // Explicitly set submission date
    });

    const savedSubmission = await submission.save();
    res.status(201).json(savedSubmission);
  }),

  // Teacher gets all submissions for a specific assignment
  getAssignmentSubmissionsForTeacher: asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const instructorId = req.user?._id;

    // Validate user
    if (!req.user?._id || !req.user?.role) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate assignmentId
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        return res.status(400).json({ message: 'Invalid Assignment ID format' });
    }

    try {
        // 1. Fetch Assignment and verify instructor access
        const assignment = await Assignment.findById(assignmentId)
            .populate('moduleId', 'title')
            .populate('courseId', 'title instructorId');

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        if (!assignment.courseId || !assignment.moduleId) {
            return res.status(404).json({ message: 'Assignment is not linked to a course or module' });
        }

        // Authorization
        if (assignment.courseId.instructorId?.toString() !== instructorId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view submissions' });
        }

        const courseId = assignment.courseId._id;

        // 2. Fetch all submissions for this assignment
        const submissions = await AssignmentSubmission.find({ assignmentId })
            .populate({
                path: 'studentId',
                select: 'username email _id', // Adjust based on User model fields
            });

        console.log(submissions);
        

        // 3. Process submission data
        const studentData = submissions
            .map(submission => {
                const student = submission.studentId;
                if (!student) return null; // Handle potential null student refs

                return {
                    studentId: student._id,
                    name: student.username,
                    email: student.email, // Omit if not needed
                    submitted: true, // All entries are submissions
                    submissionId: submission._id,
                    grade: submission.grade || null,
                    assignmentLink: submission.submissionFile || null,
                    submissionDate: submission.submissionDate || null,
                    feedback: submission.feedback || null,
                };
            })
            .filter(Boolean); // Remove null entries

        // 4. Get total enrolled students (optional)
        let totalEnrolled = studentData.length; // Default to submitted count if no enrollment data
        const course = await Course.findById(courseId).select('enrolledStudents'); // Adjust based on schema
        if (course && course.enrolledStudents) {
            totalEnrolled = course.enrolledStudents.length; // Adjust based on Course schema
        }

        // 5. Construct response
        const responseData = {
            courseData: {
                courseName: assignment.courseId.title,
                module: assignment.moduleId.title,
                assignment: assignment.title,
                totalEnrolled, // May need adjustment
                totalSubmitted: submissions.length,
            },
            students: studentData,
        };

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}),

  // Teacher grades a specific assignment submission
  gradeAssignmentSubmission: asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    // Only extract grade and feedback if they are actually sent
    const { grade, feedback } = req.body;
    const instructorId = req.user._id;

     if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: 'Invalid Submission ID format' });
    }

    // Use populate to get assignment details for authorization check
    const submission = await AssignmentSubmission.findById(submissionId)
      .populate({
        path: 'assignmentId',
        select: 'instructorId courseId', // Select only needed fields from assignment
        populate: { // Optionally populate course from assignment if needed for deeper auth
          path: 'courseId',
          select: 'instructorId' // Select instructorId from course
        }
      });

    if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
    }

    // Authorization Check: Ensure the logged-in user is the instructor for the course
    // linked to this assignment submission, or an admin.
    // Adjust this logic based on where the definitive instructorId is stored (Assignment or Course)
    const assignedInstructorId = submission.assignmentId?.courseId?.instructorId || submission.assignmentId?.instructorId;
    if (assignedInstructorId?.toString() !== instructorId.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to grade this submission' });
    }

    // Update grade only if it's provided in the request body
    // Allow setting grade to null or 0
    if (grade !== undefined) {
         const parsedGrade = parseFloat(grade);
         // Add validation if needed (e.g., check range)
         if (!isNaN(parsedGrade)) {
             submission.grade = parsedGrade;
         } else if (grade === null) {
             submission.grade = null; // Explicitly allow setting back to null
         } else {
            // Optional: return an error if grade is provided but invalid
            // return res.status(400).json({ message: 'Invalid grade format.' });
         }
    }

    // Update feedback only if it's provided
    if (feedback !== undefined) {
        submission.feedback = feedback;
    }

    const updatedSubmission = await submission.save();
    res.json(updatedSubmission);
}),

  checkAssignmentSubmission: asyncHandler(async(req,res)=>{
    const studentId = req.user.id
      const {assignmentId} = req.body;
      const submission = await AssignmentSubmission.findOne({assignmentId,studentId});
      console.log(submission);
      
      if(submission){
        return res.status(200).json({response:true,assignment:submission.submissionFile,grade:submission.grade});
      } else{
        return res.status(200).json({response:false});
      }
  }),

  // Student views their submitted assignments
  getStudentSubmissions: asyncHandler(async (req, res) => {
    const studentId = req.user._id;
    const submissions = await AssignmentSubmission.find({ studentId })
      .populate('assignmentId', 'title description')
      .sort({ submissionDate: -1 });
    res.json(submissions);
  }),

  // Admin can view all submissions for an assignment
  getAllSubmissionsForAdmin: asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const submissions = await AssignmentSubmission.find({ assignmentId })
      .populate('studentId', 'name email')
      .populate('assignmentId', 'title description')
      .sort({ submissionDate: -1 });
    res.json(submissions);
  }),

  // Admin can view all submissions by a student
  getAllSubmissionsByStudentForAdmin: asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const submissions = await AssignmentSubmission.find({ studentId })
      .populate('assignmentId', 'title description moduleId courseId')
      .populate('moduleId', 'title')
      .populate('courseId', 'title')
      .sort({ submissionDate: -1 });
    res.json(submissions);
  }),
};

module.exports = assignmentSubmissionController;