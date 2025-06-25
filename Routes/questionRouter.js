const express = require('express');
const questionRouter = express.Router();
const questionController = require('../Controllers/questionController');
const { protect, authorize } = require('../Middlewares/authMiddleware');

questionRouter.post('/', protect, questionController.createQuestion);
questionRouter.post('/answer', protect, questionController.answerQuestion);
questionRouter.get('/', questionController.getAllQuestions);
questionRouter.get('/:id', questionController.getQuestionById);
questionRouter.get('/chat/:chatId', questionController.getQuestionsByChatId);
questionRouter.put('/:id', protect,authorize('admin') , questionController.updateQuestion);
questionRouter.delete('/:id', protect,authorize('admin'), questionController.deleteQuestion);

module.exports = questionRouter;    