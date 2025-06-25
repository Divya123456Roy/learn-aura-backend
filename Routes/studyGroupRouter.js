const express = require('express');
const groupRouter = express.Router();
const studyGroupController = require('../Controllers/studyGroupController');
const { protect } = require('../Middlewares/authMiddleware');
const upload = require('../Middlewares/imageUpload');

groupRouter.post(
  '/',
  protect,
  upload('studyGroups').single("groupImage"),
  studyGroupController.createStudyGroup
);
groupRouter.get('/', studyGroupController.getAllStudyGroups);
groupRouter.get('/:id', studyGroupController.getStudyGroupById);
groupRouter.put(
  '/:id',
  protect,
  upload('studyGroups').single("groupImage"),
  studyGroupController.updateStudyGroup
);
groupRouter.delete('/:id', protect, studyGroupController.deleteStudyGroup);
groupRouter.post('/addMember/:id', protect, studyGroupController.addMember);
groupRouter.post('/removeMember/:id', protect, studyGroupController.removeMember);
groupRouter.post('/invite', protect, studyGroupController.inviteUserToGroup);
groupRouter.post('/join', protect, studyGroupController.joinGroup);

module.exports = groupRouter;