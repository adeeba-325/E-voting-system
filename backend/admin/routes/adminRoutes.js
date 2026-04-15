const express = require('express');

const adminController = require('../controller/adminController');
const authAdmin = require('../middleware/adminAuth');

const router = express.Router();

router.post('/register', adminController.registerAdmin);
router.post('/login', adminController.loginAdmin);
router.post('/verify-otp', adminController.verifyLoginOtp);
router.post('/forgot-password', adminController.forgotPassword);
router.post('/verify-reset-otp', adminController.verifyResetOtp);
router.post('/reset-password', adminController.resetPassword);

router.get('/dashboard', authAdmin, adminController.getDashboardSummary);
router.get('/verify-session', authAdmin, adminController.verifyAdminToken);
router.get('/departments', authAdmin, adminController.getDepartments);
router.get('/departments/:department/sections', authAdmin, adminController.getSections);
router.get('/departments/:department/sections/:section/candidates', authAdmin, adminController.getCandidatesBySection);
router.get('/live-votes', authAdmin, adminController.getLiveVotes);
router.get('/election-status', authAdmin, adminController.getElectionStatus);
router.get('/results', authAdmin, adminController.getResults);

router.post('/candidates', authAdmin, adminController.createCandidate);
router.put('/candidates/:id', authAdmin, adminController.updateCandidate);
router.delete('/candidates/:id', authAdmin, adminController.deleteCandidate);

router.post('/election/start', authAdmin, adminController.startElection);
router.post('/election/end', authAdmin, adminController.endElection);

module.exports = router;