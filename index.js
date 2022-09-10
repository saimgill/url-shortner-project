require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
// const mongo = require('monogdb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const validUrl = require('valid-url');
const shortId = require('shortid')
  
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

const uri = process.env.MONGO_URI;
mongoose.connect(uri,{
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error: '));
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
})
const URL = mongoose.model("URL", urlSchema);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url;
  const urlCode = shortId.generate();
  console.log(url)
  
  if(!validUrl.isWebUri(url)){
    res.json({error: "Invalid URL"})
  }
  else {
    try {
      let findOne = await URL.findOne({original_url: url})
      if(findOne){
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      }
      else {
        findOne = new URL({
            original_url: url,
            short_url: urlCode         
        });
        await findOne.save()
        res.json({
          original_url: url,
          short_url: urlCode
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({Error: "Server Error"})
    }
  }
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  try {
    const UrlParams = await URL.findOne({short_url: req.params.short_url});
    if(UrlParams){
      return res.redirect(UrlParams.original_url)
    }
    else {
      return res.status(404).json({error: "URL Not Found"});
    }
  } catch (error) {
      console.error(error);
      res.status(500).json({Error: "Server Error"})
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
