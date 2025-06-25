const express = require('express');
const paymentRouter = express.Router();
const { protect } = require('../Middlewares/authMiddleware');
const paymentController = require('../Controllers/paymentController');

paymentRouter.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);


paymentRouter.post('/create-payment-intent',express.json(), protect, paymentController.createPaymentIntent);


module.exports = paymentRouter;