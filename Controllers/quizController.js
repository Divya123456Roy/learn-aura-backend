const Quiz = require('../Models/quizModel');
const Module = require('../Models/moduleModel');
const asyncHandler = require('express-async-handler');

const quizController = {
  getAllQuizzes: asyncHandler(async (req, res) => {
    const quizzes = await Quiz.find().populate('moduleId');
    res.json(quizzes);
  }),

  getQuizById: asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id).populate('moduleId');
    if (quiz) {
      res.json(quiz);
    } else {
      res.status(404).json({ message: 'Question not found' });
    }
  }),

  createQuestion: asyncHandler(async (req, res) => {
    const { moduleId, question:questionText, options, correctAnswer } = req.body;
    console.log(req.body);
    

    if (!moduleId || !questionText || !options || !correctAnswer) {
      return res.status(400).json({ message: 'moduleId, questionText, options, and correctAnswer are required' });
    }

    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    if (req.user.role !== 'admin' && module.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add questions to this module.' });
    }

    const quizQuestion = new Quiz({
      moduleId,
      question: {
        questionText,
        options,
        correctAnswer,
      },
    });

    const createdQuestion = await quizQuestion.save();
    res.status(201).json(createdQuestion);
  }),

  updateQuestion: asyncHandler(async (req, res) => {
    const { question:questionText, options, correctAnswer } = req.body;
    console.log("body data",req.body);
    
      
    const quizQuestion = await Quiz.findById(req.params.id).populate('moduleId');

    if (!quizQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const module = await Module.findById(quizQuestion.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    if (req.user.role !== 'admin' && module.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update questions for this module.' });
    }

    quizQuestion.question.questionText = questionText || quizQuestion.question.questionText;
    quizQuestion.question.options = options || quizQuestion.question.options;
    quizQuestion.question.correctAnswer = correctAnswer || quizQuestion.question.correctAnswer;

    const updatedQuestion = await quizQuestion.save();
    console.log(updatedQuestion);
    
    res.json(updatedQuestion);
  }),

  deleteQuestion: asyncHandler(async (req, res) => {
    const quizQuestion = await Quiz.findById(req.params.id).populate('moduleId');

    if (!quizQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const module = await Module.findById(quizQuestion.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    if (req.user.role !== 'admin' && module.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete questions from this module.' });
    }

    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question removed' });
  }),

  getQuestionsByModuleId: asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const questions = await Quiz.find({ moduleId }).populate('moduleId');
    res.json(questions);
  }),
};

module.exports = quizController;