// quizRoutes.js
const express = require('express');
const quizRouter = express.Router();
const quizController = require('../Controllers/quizController');
const { protect, authorize } = require('../Middlewares/authMiddleware');

quizRouter.get('/', quizController.getAllQuizzes);
quizRouter.get('/:id', quizController.getQuizById);
quizRouter.post('/', protect, authorize("instructor") , quizController.createQuestion);
quizRouter.put('/:id', protect, authorize("instructor"), quizController.updateQuestion);
quizRouter.delete('/:id', protect, authorize("instructor"), quizController.deleteQuestion);
quizRouter.get('/module/:moduleId', quizController.getQuestionsByModuleId);

module.exports = quizRouter;