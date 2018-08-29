// Imports
const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const session = require("express-session");
const cors = require("cors");
const socket = require("socket.io");
// const request = require("request");
// const request = require("superagent");
// const querystring = require("querystring");

// Application
const app = express();

// Front-End Hosts
const heroku = "";
const localHost = "http://localhost:3000";
const activeHost = localHost;

// Port Setup
    // Server Port
const PORT = process.env.PORT || 9000;

const server = app.listen(PORT, () => {
  const timestamp = (new Date(Date.now())).toLocaleString();
  console.log(timestamp + ": running on port " + PORT);
});

// mongodb Connection
require("./db/db.js");

// Models

// Middleware
    // body-parser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
    // method-override
app.use(methodOverride("_method"));
    // express-session
app.use(session({secret: "max", resave: false, saveUninitialized: false}));
    // cors
const corsOptions = {
  origin: activeHost,
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions));

// Controllers
    // user
const userController = require("./controllers/userController.js");
app.use("/user", userController);
    // room
const roomController = require("./controllers/roomController.js");
app.use("/rooms", roomController);

// Static Routes
    // images
app.use("/images", express.static("images"));

// APIs
    // socket.io Setup
const io = socket(server);

io.on("connection", function(socket){
  console.log("Socket.io is connected.", socket.id);

  socket.on("chat", function(data){
    io.sockets.emit("chat", data);
  });

  socket.on("typing", function(data){
    socket.broadcast.emit("typing", data);
  });

  socket.on("disconnect", () => {
    console.log("Socket.io is disconnected.");
  });
});

    // Spotify API

const clientID = "ca8ab994a87a4687b57c44bc51c7bd7c";
const clientSecret = "a0bcd59da55547a5bcfab2695ef3d2f5";
const scopes = "user-read-private user-read-email playlist-modify-public";
const redirectURI = "http://localhost:3000/home";

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Content-length, Accept, x-access-token');
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    next();
});

app.get('/auth',(req,res) => {
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: process.env.clientID,
            redirect_uri: `${process.env.redirectURI}/redirect`
        }));
});

app.get('/redirect',(req,res) => {
    const code = req.url.match(/code=([\w\d-_.]+)/)[1];
    const base64Token = `${process.env.clientID}:${process.env.clientSecret}`
    request({
        url: 'https://accounts.spotify.com/api/token',
        method: 'POST',
        form: {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: `${process.env.redirectURI}/redirect`
        },
        json: true,
        headers: {
            'Authorization': `Basic ${new Buffer(base64Token).toString('base64')}`
        }
    },(err,response,body) => {
        res.redirect(`${process.env.APP_URL}?${querystring.stringify(body)}`);
    });
});

const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      "Authorization": "Basic " + (new Buffer(clientID + ":" + clientSecret).toString("base64"))
    },
    form: {
      grant_type: "client_credentials"
    },
    json: true
  };
  
  const generateSearchType = (searchType) => {
    let searchTypeString = "";
  
    for(let i = 0; i <= searchType.length-1; i++) {
      if(i !== searchType.length-1) {
        searchTypeString += searchType[i] + "%2C";
      } else {
        searchTypeString += searchType[i];
      }
    }
    return searchTypeString;
  }

    // Search
app.get("/search/:query", (req, res) => {
  request.post(authOptions, function(error, response, body) {
    if(!error && response.statusCode === 200) {
      const query = req.params.query;
      const typeArray = ["track"];
      const type = generateSearchType(typeArray);
      const limit = 10;
      const token = body.access_token;
      console.log(type, "This is type.");
      const options = {
        url: "https://api.spotify.com/v1/search?q=" + query + "&type=" + type + "&limit=" + limit,
        headers: {
          "Authorization": "Bearer " + token
        },
        json: true
      };
      request.get(options, function(error, response, body) {
        res.send(body);
      });
    }
  });
});

    // Tracks
app.get("/tracks/:id", (req, res) => {
  request.post(authOptions, function(error, response, body) {
    if(!error && response.statusCode === 200) {
      const token = body.access_token;
      const options = {
        url: "https://api.spotify.com/v1/tracks/" + req.params.id,
        headers: {
          "Authorization": "Bearer " + token
        },
        json: true
      };
      request.get(options, function(error, response, body) {
        res.send(body);
      });
    }
  });