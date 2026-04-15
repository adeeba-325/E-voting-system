const mongoose = require('mongoose');

const electionControlSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    announcedResults: {
      type: Boolean,
      default: false,
    },
    winnerCandidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      default: null,
    },
    coWinnerCandidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

electionControlSchema.index({ department: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('ElectionControl', electionControlSchema);