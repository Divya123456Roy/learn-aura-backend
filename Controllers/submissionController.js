const Quiz = require('../Models/quizModel');
const Module = require('../Models/moduleModel');
const Course = require('../Models/courseModel');
const Submission = require('../Models/submissionModel');
const asyncHandler = require('express-async-handler');

const submissionController = {
  submitAnswer: asyncHandler(async (req, res) => {
    const { selectedAnswer } = req.body;
    const { questionId } = req.params;
    const userId = req.user._id;

    if (!questionId || selectedAnswer === undefined) {
      return res.status(400).json({ message: 'questionId and selectedAnswer are required' });
    }

    const question = await Quiz.findById(questionId).populate('moduleId');
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const module = await Module.findById(question.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const course = await Course.findById(module.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found for this module' });
    }

    const isCorrect = question.question.correctAnswer === selectedAnswer;

    const submission = new Submission({
      quizId: questionId,
      userId,
      moduleId: question.moduleId,
      courseId: course._id,
      selectedAnswer,
      correct: isCorrect,
    });

    const savedSubmission = await submission.save();
    res.status(201).json(savedSubmission);
  }),

  getModuleSubmissions: asyncHandler(async (req, res) => {
    const { moduleId } = req.params;

    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    if (req.user.role !== 'admin' && module.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view submissions for this module.' });
    }

    const submissions = await Submission.find({ moduleId }).populate('userId', 'name email').populate('quizId', 'question.questionText');
    res.json(submissions);
  }),

  getUserSubmissionsForModule: asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const userId = req.user._id;

    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const submissions = await Submission.find({ userId, moduleId }).populate('quizId', 'question.questionText');
    res.json(submissions);
  }),

  getSubmissionById: asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const submission = await Submission.findById(submissionId)
      .populate('userId', 'name email')
      .populate('quizId', 'question.questionText');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const module = await Module.findById(submission.moduleId);
    if (
      req.user._id.toString() !== submission.userId.toString() &&
      req.user.role !== 'admin' &&
      module?.instructorId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this submission.' });
    }

    res.json(submission);
  }),

  getStudentScoresByCourse: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const submissions = await Submission.find({ userId, courseId })
      .populate('quizId', 'question.questionText')
      .populate('moduleId', 'title')
      .sort({ submittedAt: -1 });

    res.json(submissions.map(sub => ({
      questionId: sub.quizId._id,
      questionText: sub.quizId.question.questionText,
      selectedAnswer: sub.selectedAnswer,
      correct: sub.correct,
      moduleId: sub.moduleId._id,
      moduleTitle: sub.moduleId.title,
      submittedAt: sub.submittedAt,
    })));
  }),

  getTeacherSubmissionsByModule: asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const userId = req.user._id;

    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    if (req.user.role !== 'admin' && module.instructorId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view submissions for this module.' });
    }

    const submissions = await Submission.find({ moduleId })
      .populate('userId', 'name')
      .populate('quizId', 'question.questionText');

    res.json(submissions.map(sub => ({
      userId: sub.userId._id,
      userName: sub.userId.name,
      questionId: sub.quizId._id,
      questionText: sub.quizId.question.questionText,
      selectedAnswer: sub.selectedAnswer,
      correct: sub.correct,
      submittedAt: sub.submittedAt,
    })));
  }),

  getAllScoresByCourse: asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view all scores for this course.' });
    }

    const submissions = await Submission.find({ courseId })
      .populate('userId', 'name email')
      .populate('quizId', 'question.questionText')
      .populate('moduleId', 'title');

    const aggregatedScores = {};
    submissions.forEach(sub => {
      const userModuleKey = `${sub.userId._id}-${sub.moduleId._id}`;
      if (!aggregatedScores[userModuleKey]) {
        aggregatedScores[userModuleKey] = {
          userId: sub.userId._id,
          userName: sub.userId.name,
          moduleId: sub.moduleId._id,
          moduleTitle: sub.moduleId.title,
          correctAnswers: 0,
          totalQuestions: 0,
        };
      }
      aggregatedScores[userModuleKey].totalQuestions++;
      if (sub.correct) {
        aggregatedScores[userModuleKey].correctAnswers++;
      }
    });

    res.json(Object.values(aggregatedScores));
  }),

  getAllSubmissionsByModule: asyncHandler(async (req, res) => {
    const { moduleId } = req.params;

    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view all submissions for this module.' });
    }

    const submissions = await Submission.find({ moduleId })
      .populate('userId', 'name email')
      .populate('quizId', 'question.questionText');

    res.json(submissions);
  }),
};

module.exports = submissionController;