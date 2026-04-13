const express=require('express');
const addUser=express.Router();
const userController=require('../controller/handleLog');

addUser.post('/login',userController.postLogin);
addUser.post('/signup',userController.postSignup);
addUser.post('/validate-session',userController.validateSession);
addUser.get('/user-profile/:id', userController.getUserProfile);
addUser.post('/logout',userController.logout);
module.exports=addUser;