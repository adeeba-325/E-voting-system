const express = require('express');
const candidatesController = require('../controller/handleUser');
const registerUser = express.Router();

console.log("registration req is sent");
registerUser.post('/register/:id', candidatesController.getCandidates);
registerUser.get('/candidates', candidatesController.fetchAllCandidates);
registerUser.post('/vote/:id', candidatesController.castVote);
module.exports = registerUser;
