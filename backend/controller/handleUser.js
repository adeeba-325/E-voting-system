const Candidate = require('../model/candidates');
const User = require('../model/logInfo');
const ElectionControl = require('../admin/model/electionControl');

exports.getCandidates = async (req, res) => {
  try {
    console.log("came to get candidates");

    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ message: 'User id is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { cgpa, manifesto, wasPreviousCR } = req.body;
    if (!cgpa || manifesto === undefined) {
      return res.status(400).json({ message: 'CGPA and manifesto are required' });
    }

    const existingCandidate = await Candidate.findOne({ scholarNumber: user.scholarNumber });
    if (existingCandidate) {
      return res.status(400).json({ message: 'Candidate already exists' });
    }

    const candidate = new Candidate({
      name: user.name,
      branch: user.branch,
      scholarNumber: user.scholarNumber,
      section: user.section,
      cgpa: parseFloat(cgpa),
      manifesto,
      wasPreviousCR: !!wasPreviousCR
    });

    await candidate.save();

    return res.status(201).json({ message: 'Candidate registered successfully', candidate });
  } catch (error) {
    console.error('register candidate error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.fetchAllCandidates = async (req, res) => {
  try {
    const { branch, section } = req.query;
    const filter = {};

    if (branch) filter.branch = branch;
    if (section) filter.section = section;

    const candidates = await Candidate.find(filter).sort({ votes: -1, name: 1 });
    return res.status(200).json({ candidates });
  } catch (error) {
    console.error('fetch candidates error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.castVote = async (req, res) => {
  try {
    const candidateId = req.params.id;
    const { userId } = req.body;

    if (!candidateId || !userId) {
      return res.status(400).json({ message: 'Candidate id and user id are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.hasVoted) {
      return res.status(400).json({ message: 'You have already voted and cannot change your vote.' });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const election = await ElectionControl.findOne({ department: candidate.branch, section: candidate.section });
    if (!election || !election.isActive) {
      return res.status(403).json({ message: 'Voting is currently disabled for this department and section' });
    }

    candidate.votes = (candidate.votes || 0) + 1;
    user.hasVoted = true;
    user.votedCandidate = candidate._id;

    await Promise.all([candidate.save(), user.save()]);

    return res.status(200).json({ message: 'Vote recorded successfully', candidate });
  } catch (error) {
    console.error('cast vote error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};