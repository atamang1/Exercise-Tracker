const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let mongoose = require('mongoose')

//set up mongodb
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true});

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

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
})


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
