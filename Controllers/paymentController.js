const Enrollment = require('../Models/enrollmentModel');
const Course = require('../Models/courseModel');
const Payment = require('../Models/paymentModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const asyncHandler = require('express-async-handler');
const User = require('../Models/userModel');

const paymentController = {
  createPaymentIntent: asyncHandler(async (req, res) => {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    try {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: course.price * 100,
        currency: 'usd',
        metadata: { courseId: course._id.toString(), userId: req.user._id.toString() },
      });

      

       await User.findByIdAndUpdate(req.user.id,{$push:{enrolledCourses:courseId}},{runValidators:true,new:true})
       await Course.findByIdAndUpdate(course.id,{$push:{students:req.user.id}},{runValidators:true,new:true})

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }),

  handleStripeWebhook: async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      await processStripeEvent(event);
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).send('Webhook processing failed');
    }
  },
};

async function processStripeEvent(event) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const courseId = paymentIntent.metadata.courseId;
    const userId = paymentIntent.metadata.userId;

    const user = await User.findById(userId)

    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const enrollment = new Enrollment({
      studentId: userId,
      courseId: courseId,
    });
    const createdEnrollment = await enrollment.save();

    const payment = await Payment.create({
      userId: userId,
      enrollmentId: createdEnrollment._id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      paymentMethod: 'stripe',
      transactionId: paymentIntent.id,
      status: 'completed',
      details: paymentIntent,
    });
    enrollment.paymentId = payment._id;
    await enrollment.save();

    await Notification.create({
      userId:course.instructorId,
      type:"courseBrought",
      message: `${user.username} purchased ${course.title} course`,
      relatedItemId:payment._id
    })

    course.students.push(userId);
    course.enrollmentCount++;
    await course.save();

  } catch (error) {
    console.error('Error handling payment_intent.succeeded event:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const userId = paymentIntent.metadata.userId;
    const payment = await Payment.findOne({ transactionId: paymentIntent.id });
    if(payment){
        payment.status = 'failed';
        payment.details = paymentIntent;
        await payment.save();
    }
    const enrollment = await Enrollment.findOne({studentId: userId, paymentId: payment._id});
    if(enrollment){
        enrollment.paymentId = null;
        await enrollment.save();
    }
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed event:', error);
    throw error;
  }
}

module.exports = paymentController;