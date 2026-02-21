const express = require('express');
const router = express.Router();
const tourTeamController = require('../controller/ourTeamController');
const { createS3Upload } = require('../utils/uploadHelper');
const authenticate = require('../middleware/authMiddleware');

const upload = createS3Upload('our-team', { limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', authenticate, upload.single('image'), tourTeamController.createMember);
router.get('/', tourTeamController.getAllMembers);
router.get('/:id', tourTeamController.getMemberById);
router.put('/:id', authenticate, upload.single('image'), tourTeamController.updateMember);
router.delete('/:id', authenticate, tourTeamController.deleteMember);

module.exports = router;
