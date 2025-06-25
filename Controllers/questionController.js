// questionController.js
const Question = require('../Models/questionModel');
const asyncHandler = require('express-async-handler');
const Notification = require('../Models/notificationModel');

const questionController = {
  createQuestion: asyncHandler(async (req, res) => {
    const { chatId, questionText, options, correctAnswer, deadline } = req.body;

    if (!chatId || !questionText || !options || !correctAnswer) {
      return res.status(400).json({ message: 'chatId, questionText, options, and correctAnswer are required' });
    }

    const question = new Question({
      chatId,
      questionText,
      options,
      correctAnswer,
      deadline: deadline ? new Date(deadline) : new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24 hours
    });

    const createdQuestion = await question.save();
    res.status(201).json(createdQuestion);
  }),

  answerQuestion: asyncHandler(async (req, res) => {
    const { questionId, answer } = req.body;

    if (!questionId || !answer) {
      return res.status(400).json({ message: 'questionId and answer are required' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.userAnswers.push({ userId: req.user._id, answer });
    await question.save();

    res.json({ message: 'Answer submitted successfully' });
  }),

  getAllQuestions: asyncHandler(async (req, res) => {
    const questions = await Question.find();
    res.json(questions);
  }),

  getQuestionById: asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id);
    if (question) {
      res.json(question);
    } else {
      res.status(404).json({ message: 'Question not found' });
    }
  }),

  getQuestionsByChatId: asyncHandler(async (req, res) => {
    const questions = await Question.find({ chatId: req.params.chatId });
    res.json(questions);
  }),

  updateQuestion: asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id);

    if (question) {
      question.questionText = req.body.questionText || question.questionText;
      question.options = req.body.options || question.options;
      question.correctAnswer = req.body.correctAnswer || question.correctAnswer;
      question.deadline = req.body.deadline || question.deadline;

      const updatedQuestion = await question.save();
      res.json(updatedQuestion);
    } else {
      res.status(404).json({ message: 'Question not found' });
    }
  }),

  deleteQuestion: asyncHandler(async (req, res) => {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (question) {
      res.json({ message: 'Question removed' });
    } else {
      res.status(404).json({ message: 'Question not found' });
    }
  }),

  checkExpiredPolls: async () => {
    const now = new Date();
    const expiredPolls = await Question.find({ deadline: { $lte: now } });

    for (const poll of expiredPolls) {
      const notification = new Notification({
        userId: poll.chatId, // Notify the chat
        type: 'pollExpired',
        message: `The poll "${poll.questionText}" has expired.`,
        relatedItemId: poll._id,
      });
      await notification.save();
      if(io){
        io.to(poll.chatId).emit('pollExpired', poll);
      }
    }
  },
};



module.exports = questionController;