const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const AdminUser = require('../model/adminUser');
const ElectionControl = require('../model/electionControl');
const Candidate = require('../../model/candidates');

const departments = ['CSE', 'MDS', 'ECE', 'EE', 'ME', 'CE', 'CHE', 'MME', 'Architecture', 'Planning', 'Management'];
const sections = ['1', '2', '3'];

const getMailer = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const sendOtpEmail = async (to, subject, otp, message) => {
  const transporter = getMailer();
  if (!transporter) {
    return false;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text: `${message}\n\nOTP: ${otp}\nThis OTP expires in 10 minutes.`,
  });

  return true;
};

const createToken = (adminId) => jwt.sign({ adminId }, process.env.JWT_SECRET || 'admin-dashboard-secret', { expiresIn: '8h' });

const generateOtp = () => String(crypto.randomInt(100000, 999999));

const sanitizeAdmin = (admin) => ({
  id: admin._id,
  name: admin.name,
  department: admin.department,
  email: admin.email,
});

const validateAdminPassword = (password) => /^\d{4}$/.test(password);

const validateCandidateData = (candidate) => {
  if (!candidate.name || !/^[a-zA-Z\s]+$/.test(candidate.name.trim())) {
    return 'Name is required and can contain letters only';
  }

  if (!candidate.branch) {
    return 'Department is required';
  }

  if (!candidate.section) {
    return 'Section is required';
  }

  if (!candidate.scholarNumber) {
    return 'Scholar number is required';
  }

  if (Number.isNaN(candidate.cgpa) || candidate.cgpa <= 8 || candidate.cgpa > 10) {
    return 'CGPA must be greater than 8 and at most 10';
  }

  if (!candidate.manifesto || candidate.manifesto.trim().length < 20) {
    return 'Manifesto must be at least 20 characters';
  }

  return '';
};

const buildCandidatePayload = (body) => ({
  name: body.name,
  branch: body.branch,
  scholarNumber: body.scholarNumber,
  section: body.section,
  cgpa: Number(body.cgpa),
  manifesto: body.manifesto,
  wasPreviousCR: Boolean(body.wasPreviousCR),
});

const getElectionState = async (department, section) => {
  return ElectionControl.findOne({ department, section });
};

const findCandidateById = (candidates, id) => {
  if (!id) {
    return null;
  }
  const idString = String(id);
  return candidates.find((candidate) => String(candidate._id) === idString) || null;
};

exports.registerAdmin = async (req, res) => {
  try {
    const { name, department, email, password } = req.body;

    console.log('📝 Registration attempt:', { name, department, email, password: '****' });

    if (!name || !department || !email || !password) {
      console.warn('❌ Validation failed: Missing fields');
      return res.status(400).json({ message: 'Name, department, email and password are required' });
    }

    if (!departments.includes(department)) {
      console.warn('❌ Invalid department:', department);
      return res.status(400).json({ message: 'Invalid department' });
    }

    if (!email.endsWith('@gmail.com')) {
      console.warn('❌ Invalid email format:', email);
      return res.status(400).json({ message: 'Admin email must be a @gmail.com address' });
    }

    if (!validateAdminPassword(password)) {
      console.warn('❌ Invalid password format');
      return res.status(400).json({ message: 'Admin password must be exactly 4 digits' });
    }

    const existingAdmin = await AdminUser.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      console.warn('❌ Admin already exists:', email);
      return res.status(409).json({ message: 'Admin already exists with this email. Please use a different email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await AdminUser.create({
      name,
      department,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    console.log('✅ Admin registered successfully:', admin._id);
    return res.status(201).json({ message: 'Admin registered successfully', admin: sanitizeAdmin(admin) });
  } catch (error) {
    console.error('❌ Server error during registration:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await AdminUser.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const otp = generateOtp();
    admin.loginOtp = otp;
    admin.loginOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();

    const mailSent = await sendOtpEmail(admin.email, 'Admin Login OTP', otp, 'Use this OTP to finish your admin login.');

    return res.status(200).json({
      message: 'OTP sent to registered email',
      adminId: admin._id,
      debugOtp: mailSent ? undefined : otp,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.verifyLoginOtp = async (req, res) => {
  try {
    const { adminId, otp } = req.body;

    if (!adminId || !otp) {
      return res.status(400).json({ message: 'Admin id and OTP are required' });
    }

    const admin = await AdminUser.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (!admin.loginOtp || !admin.loginOtpExpiresAt || admin.loginOtpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP expired. Please login again.' });
    }

    if (admin.loginOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    admin.loginOtp = null;
    admin.loginOtpExpiresAt = null;
    await admin.save();

    const token = createToken(admin._id);

    return res.status(200).json({
      message: 'Admin login successful',
      token,
      admin: sanitizeAdmin(admin),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const admin = await AdminUser.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const otp = generateOtp();
    admin.resetOtp = otp;
    admin.resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();

    const mailSent = await sendOtpEmail(admin.email, 'Admin Password Reset OTP', otp, 'Use this OTP to reset your admin password.');

    return res.status(200).json({
      message: 'Password reset OTP sent to registered email',
      debugOtp: mailSent ? undefined : otp,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const admin = await AdminUser.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (!admin.resetOtp || !admin.resetOtpExpiresAt || admin.resetOtpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    if (admin.resetOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const resetToken = jwt.sign({ adminId: admin._id, purpose: 'password-reset' }, process.env.JWT_SECRET || 'admin-dashboard-secret', { expiresIn: '15m' });

    return res.status(200).json({ message: 'OTP verified', resetToken });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (!validateAdminPassword(newPassword)) {
      return res.status(400).json({ message: 'Admin password must be exactly 4 digits' });
    }

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'admin-dashboard-secret');
    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const admin = await AdminUser.findById(decoded.adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    admin.password = await bcrypt.hash(newPassword, 12);
    admin.resetOtp = null;
    admin.resetOtpExpiresAt = null;
    await admin.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const admins = await AdminUser.find().select('name department email');
    const registeredCandidates = await Candidate.countDocuments();
    const activeElections = await ElectionControl.countDocuments({ isActive: true });

    return res.status(200).json({
      departments,
      sections,
      admins,
      totals: {
        registeredCandidates,
        activeElections,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getDepartments = async (req, res) => {
  return res.status(200).json({ departments });
};

exports.getSections = async (req, res) => {
  const { department } = req.params;
  if (!department) {
    return res.status(400).json({ message: 'Department is required' });
  }

  return res.status(200).json({ department, sections });
};

exports.getCandidatesBySection = async (req, res) => {
  try {
    const { department, section } = req.params;
    const filter = {};

    if (department) {
      filter.branch = department;
    }
    if (section) {
      filter.section = section;
    }

    const candidates = await Candidate.find(filter).sort({ votes: -1, name: 1 });
    const election = department && section ? await getElectionState(department, section) : null;

    return res.status(200).json({ candidates, election });
  } catch (error) {
    console.error('❌ getCandidatesBySection failed:', error);
    return res.status(500).json({ message: `Server error: ${error.message}`, error: error.message });
  }
};

exports.createCandidate = async (req, res) => {
  try {
    const payload = buildCandidatePayload(req.body);
    const validationError = validateCandidateData(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingCandidate = await Candidate.findOne({ scholarNumber: payload.scholarNumber });
    if (existingCandidate) {
      return res.status(409).json({ message: 'Candidate already exists for this scholar number' });
    }

    const candidate = await Candidate.create(payload);
    return res.status(201).json({ message: 'Candidate created successfully', candidate });
  } catch (error) {
    console.error('❌ createCandidate failed:', { body: req.body, error });
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Candidate already exists with this unique value', error: error.message });
    }
    return res.status(500).json({ message: `Server error: ${error.message}`, error: error.message });
  }
};

exports.updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = buildCandidatePayload(req.body);

    const validationError = validateCandidateData(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const candidate = await Candidate.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    return res.status(200).json({ message: 'Candidate updated successfully', candidate });
  } catch (error) {
    console.error('❌ updateCandidate failed:', { params: req.params, body: req.body, error });
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Candidate update conflicts with an existing unique value', error: error.message });
    }
    return res.status(500).json({ message: `Server error: ${error.message}`, error: error.message });
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Candidate.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    return res.status(200).json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('❌ deleteCandidate failed:', { params: req.params, error });
    return res.status(500).json({ message: `Server error: ${error.message}`, error: error.message });
  }
};

exports.getLiveVotes = async (req, res) => {
  try {
    const { department, section } = req.query;
    const filter = {};

    if (department) {
      filter.branch = department;
    }
    if (section) {
      filter.section = section;
    }

    const candidates = await Candidate.find(filter).sort({ votes: -1, name: 1 });

    return res.status(200).json({
      candidates: candidates.map((candidate) => ({
        id: candidate._id,
        name: candidate.name,
        branch: candidate.branch,
        section: candidate.section,
        votes: candidate.votes || 0,
      })),
    });
  } catch (error) {
    console.error('❌ getLiveVotes failed:', error);
    return res.status(500).json({ message: `Server error: ${error.message}`, error: error.message });
  }
};

exports.startElection = async (req, res) => {
  try {
    const body = req.body || {};
    const department = String(body.department || '').trim();
    const section = String(body.section || '').trim();
    console.log('🗳️ startElection request:', { department, section, admin: req.admin?._id });
    if (!department || !section) {
      return res.status(400).json({ message: 'Department and section are required' });
    }

    let election = await ElectionControl.findOne({ department, section });
    if (!election) {
      try {
        election = await ElectionControl.create({ department, section });
      } catch (createError) {
        // Another request may have created it first.
        if (createError?.code === 11000) {
          election = await ElectionControl.findOne({ department, section });
        } else {
          throw createError;
        }
      }
    }

    election.isActive = true;
    election.startedAt = new Date();
    election.endedAt = null;
    election.announcedResults = false;
    election.winnerCandidateId = null;
    election.coWinnerCandidateId = null;
    await election.save();

    return res.status(200).json({ message: 'Election started successfully', election });
  } catch (error) {
    console.error('❌ startElection failed:', error);
    return res.status(500).json({ message: `Server error: ${error.message}`, error: error.message });
  }
};

exports.endElection = async (req, res) => {
  try {
    const body = req.body || {};
    const department = String(body.department || '').trim();
    const section = String(body.section || '').trim();
    console.log('🗳️ endElection request:', { department, section, admin: req.admin?._id });
    if (!department || !section) {
      return res.status(400).json({ message: 'Department and section are required' });
    }

    const candidates = await Candidate.find({ branch: department, section }).sort({ votes: -1, name: 1 });
    let election = await ElectionControl.findOne({ department, section });
    if (!election) {
      try {
        election = await ElectionControl.create({ department, section });
      } catch (createError) {
        if (createError?.code === 11000) {
          election = await ElectionControl.findOne({ department, section });
        } else {
          throw createError;
        }
      }
    }

    election.isActive = false;
    election.endedAt = new Date();
    election.announcedResults = true;
    const topVoteCount = candidates[0]?.votes || 0;
    const secondVoteCount = candidates[1]?.votes || 0;

    if (topVoteCount > 0) {
      election.winnerCandidateId = candidates[0]?._id || null;
      election.coWinnerCandidateId = secondVoteCount > 0 ? candidates[1]?._id || null : null;
    } else {
      election.winnerCandidateId = null;
      election.coWinnerCandidateId = null;
    }
    await election.save();

    return res.status(200).json({
      message: topVoteCount > 0 ? 'Election ended successfully' : 'Election ended successfully. No votes were cast, so no CR or Co-CR was declared.',
      election,
      results: {
        cr: topVoteCount > 0 ? candidates[0] || null : null,
        coCr: topVoteCount > 0 && secondVoteCount > 0 ? candidates[1] || null : null,
         allCandidates: candidates,
      },
    });
  } catch (error) {
    console.error('❌ endElection failed:', error);
    return res.status(500).json({ message: `Server error: ${error.message}`, error: error.message });
  }
};

exports.getElectionStatus = async (req, res) => {
  try {
    const { department, section } = req.query;
    if (!department || !section) {
      return res.status(400).json({ message: 'Department and section are required' });
    }

    const election = await getElectionState(department, section);
    return res.status(200).json({ election });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const { department, section } = req.query;
    if (!department || !section) {
      return res.status(400).json({ message: 'Department and section are required' });
    }

    const candidates = await Candidate.find({ branch: department, section }).sort({ votes: -1, name: 1 });
    const election = await getElectionState(department, section);

    const announcedCr = election?.announcedResults ? findCandidateById(candidates, election.winnerCandidateId) : null;
    const announcedCoCr = election?.announcedResults ? findCandidateById(candidates, election.coWinnerCandidateId) : null;

    return res.status(200).json({
      election,
      results: {
        cr: announcedCr,
        coCr: announcedCoCr,
        allCandidates: candidates,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.verifyAdminToken = async (req, res) => {
  return res.status(200).json({ admin: sanitizeAdmin(req.admin) });
};