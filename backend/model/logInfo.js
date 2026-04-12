const mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
    branch: {
    type: String,
    required: true
  },
  scholarNumber: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
 year: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  sessionToken: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  }

});
module.exports=mongoose.model('User',userSchema);