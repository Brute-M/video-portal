const express = require('express');
const router = express.Router();
const tourTeamController = require('../controller/ourTeamController');

// Multer upload middleware
const upload = tourTeamController.upload;

const authenticate = require('../middleware/authMiddleware');

// Routes
router.post('/', authenticate, upload.single('image'), tourTeamController.createMember);
router.get('/', tourTeamController.getAllMembers);
router.get('/:id', tourTeamController.getMemberById);
router.put('/:id', authenticate, upload.single('image'), tourTeamController.updateMember); // Supports partial updates
router.delete('/:id', authenticate, tourTeamController.deleteMember);

module.exports = router;
