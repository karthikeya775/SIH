const express = require("express");
const app = express();
var server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const https = require('https');
const {http} = require('http');
const fs = require('fs');
const { ExpressPeerServer } = require("peer");
const url = require("url");
const isHttps = process.env.HTTPS == 'true';
const peerServer = ExpressPeerServer(server, {
    debug: true,
});
// const httpserver = https.createServer(
//   {
//     key: fs.readFileSync(null), // Replace with your SSL key file path
//     cert: fs.readFileSync(null), // Replace with your SSL certificate file path
//   },
//   app
// );
const io = require("socket.io")(server);
const path = require("path");
app.set("view engine", "ejs");
app.use("/public", express.static(path.join(__dirname, "static")));
app.use("/public", express.static(path.join(__dirname, "js")));
app.use("/peerjs", peerServer);
const nodemailer = require('nodemailer');
const cron = require('node-cron');
app.use(express.static('static'));

app.use(express.static('public'));
//app.use(express.static(path.join(__dirname, "js")));

let httpsserver;
if (isHttps) {
  const fs = require('fs');
  const options = {
      key: fs.readFileSync(path.join(__dirname, '/key.pem'), 'utf-8'),
      cert: fs.readFileSync(path.join(__dirname, '/cert.pem'), 'utf-8'),
  };
  httpsserver = https.createServer(options, app);
} else {
  httpsserver = http.createServer(app);
}


let iceServers = [];
const stunServerUrl = process.env.STUN_SERVER_URL;
const turnServerUrl = process.env.TURN_SERVER_URL;
const turnServerUsername = process.env.TURN_SERVER_USERNAME;
const turnServerCredential = process.env.TURN_SERVER_CREDENTIAL;
const stunServerEnabled = getEnvBoolean(process.env.STUN_SERVER_ENABLED);
const turnServerEnabled = getEnvBoolean(process.env.TURN_SERVER_ENABLED);
if (stunServerEnabled && stunServerUrl) iceServers.push({ urls: stunServerUrl });
if (turnServerEnabled && turnServerUrl && turnServerUsername && turnServerCredential) {
    iceServers.push({ urls: turnServerUrl, username: turnServerUsername, credential: turnServerCredential });
}






const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Configure Passport
const GOOGLE_CLIENT_ID = '146141162410-u1bv4h3rjje286m2igsk0mlbejdlag6l.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET='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';
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, cb) => {
  // This is where you can handle the user data returned by Google
  // You can store the user in your database or perform any other actions
  // You can access the user profile data via the `profile` object

  // Call the callback function with the user object
  return cb(null, profile);
}));

passport.serializeUser((user, done) => {
  // Serialize the user object (e.g., store the user ID in the session)
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // Deserialize the user object (e.g., retrieve the user from the database based on the ID)
  const user = { id }; // Replace this with your logic to retrieve the user
  done(null, user);
});

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

function isLoggedIn(req, res, next) {
  req.user ? next() : res.redirect('/start');
}

// Routes
app.get('/start', (req, res) => {
  res.redirect('/auth/google');
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Authentication successful, redirect to the room creation page
    res.redirect('/');
  }
);

app.get("/",isLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, "static", "index.html"));
});


app.get("/join",isLoggedIn, (req, res) => {
  res.redirect(
      url.format({
          pathname: `/join/${uuidv4()}`,
          query: req.query,
      })
  );
});

app.get("/joinold",isLoggedIn, (req, res) => {
  res.redirect(
      url.format({
          pathname: req.query.meeting_id,
          query: req.query,
      })
  );
});

app.get("/join/:rooms",isLoggedIn, (req, res) => {
    res.render("room", { roomid: req.params.rooms, Myname: req.query.name });
});

app.get('/whiteboard/:rooms',isLoggedIn,(req, res) => {
  const roomId = req.params.rooms;
  res.render("whiteboard", { roomId }); 
});

let connections = [];
// Ends here

// WBC
// let connections = []

io.on('connect' , (socket) => {
  connections.push(socket);
  console.log(`${socket.id} has connected`);

  socket.on('draw' , (data) =>{
      connections.forEach(con =>{
          if(con.id !== socket.id){
              con.emit('ondraw' , {x :data.x ,y: data.y})
          }
      })
  })

  socket.on('down' , (data) =>{
      connections.forEach(con =>{
          if(con.id!==socket.id){
              con.emit('ondown', {x : data.x , y : data.y});
          }
      });
  });

  socket.on("disconnect" , (reason) => {
      console.log(`${socket.id} is disconnected`);
      connections = connections.filter((con) =>con.id != socket.id);
  });
});

//ends here



io.on("connection", (socket) => {
    socket.on("join-room", (roomId, id, myname) => {
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", id, myname);

        socket.on("messagesend", (message) => {
            console.log(message);
            io.to(roomId).emit("createMessage", message);
        });

        socket.on("tellName", (myname) => {
            console.log(myname);
            socket.to(roomId).emit("AddName", myname);
        });
        socket.on('screenshared' , (id ,roomId) => {
          socket.to(roomId).emit("displayscreen" , id);
        });
        
        // const turnCredentials = generateTurnCredentials();
        // socket.emit('turnservers', turnCredentials);

        socket.on("disconnect", () => {
            socket.to(roomId).emit("user-disconnected", id);
        });
        
        socket.on("sendmail" , (to , subject , time ,id) => {
          let transporter = nodemailer.createTransport(
            {
              service : 'gmail',
              auth : {
                user : `${email}`,
                pass : pass,
              }
            }
          );
        
            let text = "Please join the meet at ";
            text += time;
            text += " using the link ";
            text += id;
              var mailOptions = {
              from : `${email}`,
              to : to,
              subject : subject,
              text : text,
            };
        
            transporter.sendMail(mailOptions , function(error , info){
              if(error){
              }
              else{
                console.log('sent');
                console.log(info.response);
              }
            });
        
            let hour = time[0];
            hour += time[1];
            let minute = time[3];
            minute += time[4];
            minute -= 15;
            hour -= 0;
            
            cron.schedule(`00 ${minute} ${hour} * * *`, function () {
              mailOptions.subject = "Reminder";
              transporter.sendMail(mailOptions, (error, info) => {
                if (error) console.log(error);
                else console.log('Email sent: ' + info.response);
              });
            });
          
        
          });
        

    });
});

// const crypto = require('crypto');

// function generateTurnCredentials() {
//     const credentials = [];
//     config.turnservers.forEach(function (server) {
//         const hmac = crypto.createHmac('sha1', server.secret);
//         const username = Math.floor(new Date().getTime() / 1000) + (server.expiry || 86400) + "";
//         hmac.update(username);
//         credentials.push({
//             username: username,
//             credential: hmac.digest('base64'),
//             url: server.url
//         });
//     });
//     return credentials;
// }

function getEnvBoolean(key, force_true_if_undefined = false) {
  if (key == undefined && force_true_if_undefined) return true;
  return key == 'true' ? true : false;
}



server.listen(process.env.PORT || 3030);
