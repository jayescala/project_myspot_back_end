// Imports
const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const session = require("express-session");
const cors = require("cors");
const socket = require("socket.io");
const request = require("request");
const qs = require("qs");

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


// app.use(function (req, res, next) {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Credentials', true);
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Content-length, Accept, x-access-token');
//     res.header('Access-Control-Allow-Methods', '*');
//     next();
// });

  // Spotify API
const clientID = "ca8ab994a87a4687b57c44bc51c7bd7c";
const clientSecret = "a0bcd59da55547a5bcfab2695ef3d2f5";

app.get("/authorize", (req, res) => {
  const query = qs.stringify({
                  client_id: clientID,
                  response_type: "code",
                  redirect_uri: "http://localhost:9000/callback",
                  scope: "playlist-modify-public"
                });

  const authorizeOptions = {
    url: "https://accounts.spotify.com/authorize?" + query,
    headers: {
      "Authorization": "Basic " + clientID + ":" + clientSecret
    },
    form: {
      grant_type: "client_credentials"
    }
  }

  res.redirect("https://accounts.spotify.com/authorize?" + query);
  // request.get(authorizeOptions, function(error, response, body) {
  //   // console.log(error, "error");
  //   // console.log(response, "response");
  //   res.send(body);
  //   console.log(body, "body");
  // });
});

// app.get('/auth',(req,res) => {
//     res.redirect('https://accounts.spotify.com/authorize?' +
//         querystring.stringify({
//             response_type: 'code',
//             client_id: process.env.clientID,
//             redirect_uri: `${process.env.redirectURI}/redirect`
//         }));
// });

app.get("/callback", (req, res) => {
  console.log("CALLBACK HIT");

  const code = req.query.code || null;

  const tokenOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      'Authorization': 'Basic ' + (new Buffer(clientID + ':' + clientSecret).toString('base64'))
    },
    form: {
      code: code,
      redirect_uri: "http://localhost:9000/callback",
      grant_type: "authorization_code"
    },
    json: true
  };

  request.post(tokenOptions, function(error, response, body) {
    const accessToken = body.access_token;
    const refreshToken = body.refresh_token;
    console.log(body);
    // console.log(accessToken);

    var tokenOptions = {
      url: "https://api.spotify.com/v1/me",
      headers: { "Authorization": "Bearer " + accessToken },
      json: true
    };

    request.get(tokenOptions, function(error, response, body) {
      // console.log(body);
    });

    const query = qs.stringify({
      accessToken: accessToken,
      refreshToken: refreshToken
    });
    // console.log("HIT");
    // console.log(res);
    // console.log(body);

    // res.send(body);
    // res.redirect("back");
    res.redirect("http://localhost:3000/home/" + accessToken + "/" + refreshToken);
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
});

app.get("/playlist/add/track/:id/:accessToken/:track", (req, res) => {
      const accessToken = req.params.accessToken;
      console.log(accessToken, "accessToken");
      const options = {
        url: "https://api.spotify.com/v1/playlists/" + req.params.id + "/tracks" ,
        headers: {
          "Authorization": "Bearer " + req.params.accessToken,
          "Content-Type": "application/json"
        },
        body: {
          "uris": ["spotify:track:" + "0E9ZjEAyAwOXZ7wJC0PD33"]
        }
      };
      request.post(options, function(error, response, body) {
        res.send(body);
      });
    });
