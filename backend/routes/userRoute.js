const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.get('/users/export', userController.exportUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUserById);
router.delete('/users/:id', userController.deleteUserById);
router.post('/send-bulk-registration-emails', userController.sendBulkRegistrationEmails);

module.exports = router;
