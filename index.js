const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
let mongoose = require('mongoose')


//set up mongodb
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true});

mongoose.plugin((schema)=>{
  schema.set('versionKey', false);
})
/*
let exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  description: {
    type: String, 
    required: true
  }, 
  duration: {
    type: Number, 
    required: true
  }, 
  date: String
})

let ExerciseModel = mongoose.model('Exercise', exerciseSchema);

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true, 
  }
})

let UserModel = mongoose.model('User', userSchema);
*/
let logSchema = new mongoose.Schema ({
  username: {
    type: String,
    required: true
  }, 
  count: {
    type: Number, 
    default: 0//Set default count to 0
  }, 
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
})

let LogModel = mongoose.model('Log', logSchema ); 

//body-parser to parse Post request
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



//post username and response with json
//get usernames 
app.route('/api/users').get(async (req, res) =>{
  let allUsers = await LogModel.find({}, {count: 0, log: 0}); //get all of the users

  res.json(allUsers);
}).post(async (req, res) => {
  //Parse username
  let username = req.body.username; 

  //add user to model
  let newUser = new LogModel({username: username});
  await newUser.save();

  res.json({username: newUser.username, _id: newUser._id});
});


//helper function validate date
const validateDate = (dateString) => {
  const dateArray = dateString.split('-'); 

  if(parseInt.length !== 3) return false;
  const year = parseInt(dateArray[0], 10); 
  const month = parseInt(dateArray[1], 10); //Note: months are 0-indexed in JS
  const day = parseInt(dateArray[2], 10); 

  const date = new Date(year, month, day);

  //check if the date object matches the input 
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
}

//post exercises and response with json
app.route('/api/users/:_id/exercises').post(async (req, res) => {
  let id = req.params._id; 
  let description = req.body.description;
  let duration = req.body.duration; 
  let date = req.body.date;

  //check date
  if(!date){
    date = new Date().toDateString();
  }else{
    date = new Date(date).toDateString();
  }
  
  let logEntry = {description: description, duration: duration, date: date};

  //check user exist in the database 
  try{
    //let findUser = await LogModel.findById(id);
    let updatedLog = await LogModel.findById(id);
    
    if(updatedLog)
    {
      updatedLog.log.push(logEntry); //push the new log entry
      updatedLog.count = updatedLog.log.length; //update the count
      await updatedLog.save(); 
    }

    res.json({username: updatedLog.username, date: date, duration: duration, description: description});
  } catch (err) {
    console.log(err); 
  }
});

//logs route
app.route('/api/users/:_id/logs?[from][&to][&limit]').get( async (req, res) => {
  let id = req.params._id;
  let fromDate = req.params.from; 
  let toDate = req.params.to; 
  let limit = req.params.limit ? parseInt(req.query.limit) : undefined; 

  let query = {_id: id};
  if(fromDate) query.date = {...query.date, $gte: new Date(from)};
  if(toDate) query.date = {...query.date, $lte: new Date(to)}; 

  try{
    let logData = await LogModel.find(query).limit(limit);
    res.json(logData);
  }catch (err){
    console.log(err);
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
