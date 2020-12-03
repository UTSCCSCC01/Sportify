const firebase = require('firebase-admin');
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const port = 3000

app.use(bodyParser.json());

const serviceAccount = require("./sportify-8d62e-firebase-adminsdk-sgz9l-882a9b2759.json");

const config = {
  apiKey: "AIzaSyC57XIbeDE6hgHYLulW7Pcyy-OHvnKEnu4",
  credential: firebase.credential.cert(serviceAccount),
  authDomain: "sportify-8d62e.firebaseapp.com",
  databaseURL: "https://sportify-8d62e.firebaseio.com",
  storageBucket: "sportify-8d62e.appspot.com"
};
firebase.initializeApp(config);

app.get('/', (req, res) => {
  res.send('I am the sportify server.');
})

app.get('/login', (req, res) => {
  res.sendStatus(200);
})

app.post('/user/new', (req, res) => {
  const {utorid, firstName, lastName, sportsInterests, favoriteTeam} = req.body;

  if (!(utorid && firstName && lastName && sportsInterests && favoriteTeam)) {
    return res.sendStatus(400);
  }

  const postData = {
    utorid : utorid,
    firstName: firstName,
    lastName: lastName,
    sportsInterests: sportsInterests,
    favoriteTeam: favoriteTeam,
    events: false
  };

  
  let updates = {};
  const newUserId = firebase.database().ref().child('events').push().key;
  updates['/users/' + newUserId] = postData;
  firebase.database().ref().update(updates);

  return res.sendStatus(200);
})

app.get('/user/:id', (req, res) => {
  const userRef = firebase.database().ref('/users/' + req.params.id);
  userRef.once('value').then(function(snapshot) {
    return res.send(snapshot.val());
  }).catch(function(error) {
    return res.sendStatus(404);
  });
})

app.put('/user/:id', (req, res) => {
  const {firstName, lastName, sportsInterests, favoriteTeam} = req.body;
  const utorid = req.params.id;

  if (!(firstName && lastName && sportsInterests && favoriteTeam)) {
    return res.sendStatus(400);
  }

  const putData = {
    utorid: utorid,
    firstName: firstName,
    lastName: lastName,
    sportsInterests: sportsInterests,
    favoriteTeam: favoriteTeam
  };

  let updates = {};
  Object.keys(putData).forEach((key) => {
    updates['/users/' + utorid + '/' + key] = putData[key];
  })
  firebase.database().ref().update(updates);

  return res.sendStatus(200);
})

app.post('/event/new', (req, res) => {
  const {utorid, title, description, location, date, sport} = req.body;

  if (!(utorid && title && description && location && date && sport)) {
    return res.sendStatus(400);
  }

  const users = {};
  users[utorid] = true;

  const postData = {
    owner: utorid, 
    users: users,
    title: title,
    description: description,
    location: location,
    date: date,
    sport: sport
  };

  let eventUpdates = {};
  const newEventId = firebase.database().ref().child('events').push().key;
  eventUpdates['/events/' + newEventId] = postData;
  firebase.database().ref().update(eventUpdates);

  let userUpdates = {};
  userUpdates['/users/' + utorid + '/events/' + newEventId] = true;
  firebase.database().ref().update(userUpdates);

  return res.sendStatus(200);
})

app.get('/events', (req, res) => {
  const eventRef = firebase.database().ref('/events');
  eventRef.once('value').then(function(snapshot) {
    return res.send(snapshot.val());
  }).catch(function(error) {
    return res.sendStatus(404);
  });
})

app.get('/event/:id', (req, res) => {
  const eventRef = firebase.database().ref('/events/' + req.params.id);
  eventRef.once('value').then(function(snapshot) {
    return res.send(snapshot.val());
  }).catch(function(error) {
    return res.sendStatus(404);
  });
})

app.put('/event/:id', (req, res) => {
  const {title, description, location, date, sport} = req.body;
  const eventId = req.params.id;

  if (!(title && description && location && date && sport)) {
    return res.sendStatus(400);
  }

  const putData = {
    title: title,
    description: description,
    location: location,
    date: date,
    sport: sport
  };

  let eventUpdates = {};
  Object.keys(putData).forEach((key) => {
    eventUpdates['/events/' + eventId + '/' + key] = putData[key];
  })
  firebase.database().ref().update(eventUpdates);

  return res.sendStatus(200);
})

app.get('/user/:id/events', (req, res) => {
  const userRef = firebase.database().ref('/users/' + req.params.id);
  userRef.once('value').then(function(snapshot) {
    if(!snapshot.val()){
      res.sendStatus(404)
    }
    if (snapshot.hasChild('events')) {
      const eventRef = firebase.database().ref('/users/' + req.params.id + '/events')
      eventRef.once('value').then(function(snapshot){
        return res.send(Object.keys(snapshot.val()));
      })
    } else {
      return res.send([]);
    }
  }).catch(function(error) {
    return res.sendStatus(404);
  });
})

app.put('/event/:eventId/:userId/attend', (req, res) => {
  const utorid = req.params.userId
  const eventId = req.params.eventId
 
  if (!(utorid && eventId)) {
    return res.sendStatus(400);
  }

  let eventUpdates = {};
  eventUpdates['/events/' + eventId + '/users/' + utorid] = true;
  firebase.database().ref().update(eventUpdates);

  let userUpdates = {};
  userUpdates['/users/' + utorid + '/events/' + eventId] = true;
  firebase.database().ref().update(userUpdates);

  return res.sendStatus(200);
})

app.put('/event/:eventId/:userId/unattend', (req, res) => {
  const utorid = req.params.userId
  const eventId = req.params.eventId
 
  if (!(utorid && eventId)) {
    return res.sendStatus(400);
  }

  let eventUpdates = {};
  eventUpdates['/events/' + eventId + '/users/' + utorid] = null;
  firebase.database().ref().update(eventUpdates);

  let userUpdates = {};
  userUpdates['/users/' + utorid + '/events/' + eventId] = null;
  firebase.database().ref().update(userUpdates);

  const userRef = firebase.database().ref('/users/' + utorid + '/events');
  userRef.once('value').then(function(snapshot) {
    if(!snapshot.val()){
      let userUpdates2 = {};
      userUpdates2['/users/' + utorid + '/events'] = false;
      firebase.database().ref().update(userUpdates2);
    }
  }).catch(function(error) {
    return res.sendStatus(500);
  });

  return res.sendStatus(200);
})

app.delete('/event/:id', (req, res) => {
  const eventId = req.params.id
  if (!eventId) {
    return res.sendStatus(400);
  }

  const eventRef = firebase.database().ref('/events/' + eventId);
  const usersRef = firebase.database().ref('/events/' + eventId + '/users');

  usersRef.once('value').then(function(snapshot) {
    const userIds = Object.keys(snapshot.val());
    userIds.forEach((userId) => {
      console.log(userId)
      let userEventRef = firebase.database().ref('/users/' + userId + '/events/' + eventId);
      userEventRef.remove()
    });
    eventRef.remove()
    return res.sendStatus(200);
  }).catch(function(error) {
    return res.sendStatus(404);
  });

  return res.sendStatus(200);
})

app.listen(port, () => {
  console.log(`Sportify server listening at http://localhost:${port}`)
})


