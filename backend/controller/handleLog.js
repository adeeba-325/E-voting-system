const { check,validationResult } = require('express-validator');
const User=require('../model/logInfo');
const bcrypt=require('bcryptjs');
const crypto=require('crypto');

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate unique session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Update user with new session token (invalidates previous sessions)
    user.sessionToken = sessionToken;
    user.lastLogin = new Date();
    await user.save();
    
    // Success - return user info with session token
    res.status(200).json({ 
      message: 'Login successful', 
      sessionToken: sessionToken,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        scholarNumber: user.scholarNumber
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('name email scholarNumber branch section year hasVoted votedCandidate');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.postSignup=[
    check('password')
  .isLength({min:8})
  .withMessage('Password must be atleast 8 characters long')
  .matches(/[a-z]/)
  .withMessage('Password must contain atleast one lowercase letter')
    .matches(/[A-Z]/)
  .withMessage('Password must contain atleast one uppercase letter')
.matches(/[!@#$%^&*()_.?\-,;{}|]/)
  .withMessage('Password must contain atleast one special character')
  .trim(),

  check('confirmPassword')
  .trim()
  .custom((value,{req})=>{
 if(value!=req.body.password){
  throw new Error('Password must be same');
 }
 return true;
  }),
  check('name')
  .notEmpty()
  .withMessage('name is required')
  .trim()
  .isLength({min:3})
  .withMessage('name must be atleast 3 characters long')
  .matches(/^[a-zA-Z\s]+$/)
  .withMessage('First name can only contain letters'),

check('email')
  .notEmpty()
  .withMessage('Email is required')
  .custom((value) => {
    // If user typed full email
    if (!value.endsWith('@stu.manit.ac.in')) {
      throw new Error('Email must end with @stu.manit.ac.in');
    }
    // Optional: check scholar number prefix matches
    // const prefix = value.split('@')[0];
    // if (prefix !== req.body.scholar) throw new Error(...);
    return true;
  })
  .normalizeEmail(),
      check('scholarNumber')
    .notEmpty()
    .withMessage('Scholar number is required')
    .custom((scholarNumber, { req }) => {
      // Get the part before @ from email
      const emailPrefix = req.body.email.split('@')[0];
      if (scholarNumber !== emailPrefix) {
        throw new Error('Scholar number must match the email prefix before @');
      }
      return true;
    }),
  
 async(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, scholarNumber, section, year, branch,password,confirmPassword } = req.body;
        const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = new User({
        name,
        email,
        scholarNumber,
        section,
        branch,
        year,
        password:hashedPassword
      });
      // console.log("came to save");
   await newUser.save();
  //  console.log("saved");
     res.status(201).json({ message: 'Student saved successfully' });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }


 },
]

exports.validateSession = async (req, res) => {
  try {
    const { userId, sessionToken } = req.body;
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if session token matches
    if (user.sessionToken !== sessionToken) {
      return res.status(401).json({ message: 'Session invalid. Please login again' });
    }
    
    // Session is valid
    res.status(200).json({ message: 'Session valid', user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Find user and clear session token
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    user.sessionToken = null;
    await user.save();
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};