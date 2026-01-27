const express = require('express');
const router = express.Router();
const jobController = require('../controller/jobController');

router.post('/create', jobController.upload.single('jdFile'), jobController.createJob);
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJob);
router.put('/:id', jobController.upload.single('jdFile'), jobController.updateJob);
router.delete('/:id', jobController.deleteJob);

module.exports = router;
