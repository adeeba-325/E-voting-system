const express=require('express');
const addUser=express.Router();
const userController=require('../controller/handleLog');
console.log("req was sent");
addUser.post('/login',userController.postLogin);
addUser.post('/signup',userController.postSignup);
addUser.post('/validate-session',userController.validateSession);
addUser.post('/logout',userController.logout);
module.exports=addUser;