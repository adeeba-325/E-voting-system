const express=require('express');
const bodyParser=require('body-parser');
const cors=require('cors');
const app=express();

const URL='mongodb+srv://sanarahman2510_db_user:sana321@evote.pbf0spf.mongodb.net/evoteDB';
const { default: mongoose } = require('mongoose');
const addUser = require('./routes/logRoute');
const registerUser = require('./routes/userRoute');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// const MongoDBStore = require('connect-mongodb-session')(session);
app.get('/',(req,res)=>{
res.send("Sever is connected");
});
app.use('/api',addUser);
app.use('/api',registerUser);
const PORT=5000;
mongoose.connect(URL).then(()=>{
  console.log('Connected to Mongoose');
app.listen(PORT,()=>{
  console.log(`Sever is running on PORT ${PORT}`);
})
}).catch((err)=>{
  console.log("MongoDB Error:", err.message);
});