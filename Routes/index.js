const express = require('express');
const userRouter = require('./userRouter');
const assignmentRouter = require('./assignmentRouter');
const chatMessageRouter = require('./chatMessageRouter');
const courseRouter = require('./courseRouter');
const discussionForumRouter = require('./discussionForumRouter');
const feedbackRouter = require('./feedbackRouter');
const gamificationRouter = require('./gamificationRouter');
const moduleRouter = require('./moduleRouter');
const notificationRouter = require('./notificationRouter');
const postRouter = require('./postRouter');
const questionRouter = require('./questionRouter');
const quizRouter = require('./quizRouter');
const replyRouter = require('./replyRouter');
const studyGroupRouter = require('./studyGroupRouter');
const submissionRouter = require('./submissionRouter');
const unitRouter = require('./unitRouter');
const feedRouter = require('./feedRoute');
const assignmentSubmissionRouter = require('./assignmentSubmissionRoutes');
const paymentRouter = require('./paymentRouter');
const quizSubmissionRouter = require('./quizSubmissionRouter');
const router = express();


router.use("/payment",paymentRouter)

router.use(express.json())

router.use("/user",userRouter)
router.use("/assignment",assignmentRouter)
router.use("/chat",chatMessageRouter)
router.use('/course',courseRouter)
router.use("/discussion",discussionForumRouter)
router.use("/feed",feedRouter)
router.use("/feedback",feedbackRouter)
router.use("/gamification",gamificationRouter)
router.use("/module",moduleRouter)
router.use("/notification",notificationRouter)
router.use("/post",postRouter)
router.use("/question",questionRouter)
router.use("/quiz",quizRouter)
router.use("/reply",replyRouter)
router.use("/study-group",studyGroupRouter)
router.use("/submission",submissionRouter)
router.use("/unit",unitRouter)
router.use("/assignment-submission",assignmentSubmissionRouter)
router.use("/quiz-submission",quizSubmissionRouter)


module.exports = router

