require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

const URL = process.env.MONGODB_URI;
const { default: mongoose } = require('mongoose');
const addUser = require('./routes/logRoute');
const registerUser = require('./routes/userRoute');
const adminRoutes = require('./admin/routes/adminRoutes');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// const MongoDBStore = require('connect-mongodb-session')(session);

if (!URL) {
  throw new Error('MONGODB_URI is not set in backend/.env');
}

app.get('/', (req, res) => {
  res.send('Sever is connected');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'backend', timestamp: new Date().toISOString() });
});
app.use('/api',addUser);
app.use('/api',registerUser);
app.use('/api/admin', adminRoutes);
const PORT=5000;
mongoose.connect(URL).then(()=>{
  console.log('Connected to Mongoose');
app.listen(PORT,()=>{
  console.log(`Sever is running on PORT ${PORT}`);
})
}).catch((err)=>{
  console.log("MongoDB Error:", err.message);
});