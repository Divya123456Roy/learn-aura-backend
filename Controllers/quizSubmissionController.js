const Module = require('../Models/moduleModel');
const asyncHandler = require('express-async-handler');
const Quiz = require('../Models/quizModel');
const QuizSubmission = require('../Models/quizSubmissionModel');

const quizSubmissionController = {

  // === Submit quiz for ONE question ===
  submitQuiz: asyncHandler(async (req, res) => {
    try {
        const { quizId, selectedAnswer, courseId } = req.body;
    console.log(req.body);
    
    const userId = req.user._id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Optional: prevent duplicate submissions for same user & quiz
    const existingSubmission = await QuizSubmission.findOne({ userId, quizId });
    if (existingSubmission) {
      return res.status(400).json({ message: 'Quiz already submitted by this user.' });
    }

    const correctAnswer = quiz.question.correctAnswer;
    const isCorrect = selectedAnswer === correctAnswer;
    const score = isCorrect ? 1 : 0;

    const submission = await QuizSubmission.create({
        userId,
        quizId,
        questionText: quiz.question.questionText,
        selectedAnswer,
        correctAnswer,
        isCorrect,
        score,
        moduleId: quiz.moduleId,
        courseId,
      });

      if(!submission){
        res.status(403).json({message: "Quiz Submission Failed!!"});
      }
     
    if(!isCorrect){
        res.status(201).json({
            message: 'Answer is not correct!! and correct Answer is',correctAnswer,
            submission,
          });
    }

    res.status(201).json({
      message: 'Answer is correct',
    });
        
    } catch (error) {
        console.log("Quiz Submission Error",error);
        res.status(500).json(error)
    }
    

    // Optionally trigger learning progress logic here
    // await updateUserProgress(userId, quiz.moduleId, courseId);
  }),

  checkQuizSubmission: asyncHandler(async (req, res) => {
    const studentId = req.user._id;
    const { quizId } = req.body;
    console.log(quizId);
    
  
    const submission = await QuizSubmission.findOne({ quizId, userId: studentId });
  
    if (submission) {
      return res.status(200).json({
        response: true,
        isCorrect: submission.isCorrect,
        selectedAnswer: submission.selectedAnswer,
        correctAnswer:submission.correctAnswer,
        score: submission.score,
      });
    } else {
      return res.status(200).json({ response: false });
    }
  }),

  // === Get a specific quiz submission ===
  getQuizSubmission: asyncHandler(async (req, res) => {
    const submissionId = req.params.submissionId;
    const submission = await QuizSubmission.findById(submissionId)
      .populate('userId', 'username')
      .populate('quizId', 'question.questionText');

    if (!submission) {
      return res.status(404).json({ message: 'Quiz submission not found' });
    }

    res.status(200).json(submission);
  }),

  // === Admin: Get all submissions for a quiz ===
  getAllSubmissionsForQuizAdmin: asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const submissions = await QuizSubmission.find({ quizId })
      .populate('userId', 'username')
      .populate('quizId', 'question.questionText');

    res.status(200).json(submissions);
  }),

  // === Instructor: Get all submissions from all their quizzes ===
  getAllSubmissionsForInstructor: asyncHandler(async (req, res) => {
    const instructorId = req.user._id;

    const modules = await Module.find({ instructorId });
    const moduleIds = modules.map((module) => module._id);

    const quizzes = await Quiz.find({ moduleId: { $in: moduleIds } });
    const quizIds = quizzes.map((quiz) => quiz._id);

    const submissions = await QuizSubmission.find({ quizId: { $in: quizIds } })
      .populate('userId', 'username')
      .populate('quizId', 'question.questionText');

    res.status(200).json(submissions);
  }),

  // === Instructor: Get submissions for one quiz (with auth check) ===
  getSubmissionsForQuizByInstructor: asyncHandler(async (req, res) => {
    const instructorId = req.user._id;
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).populate('moduleId');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const module = await Module.findById(quiz.moduleId);
    if (!module || module.instructorId.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this quiz\'s submissions.' });
    }

    const submissions = await QuizSubmission.find({ quizId })
      .populate('userId', 'username')
      .populate('quizId', 'question.questionText');

    res.status(200).json(submissions);
  }),
};

module.exports = quizSubmissionController;
