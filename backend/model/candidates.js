const mongoose=require('mongoose');
const candidateSchema=new mongoose.Schema({
  name:{
    type:String, 
    required:true 
  },
  branch: {
    type: String,
    required: true 
  },
  scholarNumber:{
    type: String,
    required: true
  },
  section:{
    type: String,
    required: true
  },
  cgpa: {
    type: Number,
    required: true
  },
  manifesto: {
    type: String,
    required: true
  },
  wasPreviousCR: {
    type: Boolean,
    default: false 
  },
  votes: {
    type: Number,
    default: 0
  }
});
module.exports=mongoose.model('Candidate',candidateSchema);