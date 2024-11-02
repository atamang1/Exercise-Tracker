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
    date: String, 
    _id: false
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
const convertDate = (dateString) => {

  if(!dateString) return (new Date().toDateString());

  const dateArray = dateString.split('-'); 
  if(dateArray.length === 1) {
    const year = parseInt(dateArray[0],10); 
    return (new Date(year, 0, 1).toDateString()); 
  }
  if(dateArray.length !== 3) throw new Error ("invalid date");
  const year = parseInt(dateArray[0], 10); 
  const month = parseInt(dateArray[1], 10) - 1; //Note: months are 0-indexed in JS
  const day = parseInt(dateArray[2], 10); 

  if(month > 11 || day > 31){
    throw new Error("invalid month or day");
  }

  const date = new Date(year, month, day).toDateString();
  return date;
}

//post exercises and response with json
app.route('/api/users/:_id/exercises').post(async (req, res) => {
  let id = req.params._id; 
  let description = req.body.description;
  let duration = parseInt(req.body.duration, 10); 
  let date;
  try{
    date = convertDate(req.body.date);
    console.log("Date: ", date); 
  } catch (error) {
    return res.json({error: error.message}); 
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
      updatedLog.log.sort((a, b) => new Date(b.date) - new Date(a.date)); 
      await updatedLog.save(); 

     return res.json({_id: id, username: updatedLog.username, date: date, duration: duration, description: description});
    }

    res.json({user: "not found"}); 

  } catch (err) {
    console.log(err); 
  }
});

//logs route
app.route('/api/users/:_id/logs').get( async (req, res) => {
  let id = req.params._id;
  let from = req.query.from; 
  let to = req.query.to; 
  let limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined; 

  try{

    //get the data 
    let logData = await LogModel.findById(id); 
    let exercises; 

    //if user not exist
    if(!logData)
    {
      return res.json({Error: "no logs found for this user"});
    }

    //query log based on to
    if(!isNaN(limit))
    {
      //get the count 
      let count = logData.count;
      if(limit > count)
      {
        limit = count;
      }

      logData.log = logData.log.slice(0, limit);
    }

    //query log base on from
    if(from) {
      try {
        console.log('From: ', from); 
        let fromDate = new Date(convertDate(from));
        console.log('fromDate: ', fromDate);
        logData.log = logData.log.filter(log => new Date(log.date) >= fromDate);
      }
      catch (err){
        return res.send(err.message);
      }
    }

    //query log based on to
    if(to){
      try {
        let toDate = new Date(convertDate(to));
        logData.log= logData.log.filter(log => new Date(log.date) <= toDate );
      }catch (err) {
        return res.send(err.message);
      }
    }
    
  
   logData.count = logData.log.length;
   console.log('logData.count: ', logData.count);
   console.log('id: ', logData._id);
    res.json({_id: id, count: logData.count, log: logData.log });
  }catch (err){
    console.log(err);
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
