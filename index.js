'use strict';

const helpers = require('./core/helpers');
const dialogue = require('./core/dialogue');
const context = require('./core/context');

const express = require('express');
const bodyParser = require('body-parser');
const Smooch = require('smooch-core');

const PORT = 8000;
const KEY_ID = 'app_58816f88ebb13b640062bbae';
const SECRET = 'V3nadjJncuzAx7OlfJmOxr_B';
const PRODUCT_INFO_ENDPOINT = "http://ed837810.ngrok.io/GetProduct";

const smooch = new Smooch({
  keyId: KEY_ID,
  secret: SECRET,
  scope: 'app'
});

const app = express();

function sendMessage(userID, message) {
  smooch.appUsers.sendMessage(userID, {
    type: 'text',
    text: message,
    role: 'appMaker'
  })
  .then((response) => {
    helpers.log('send', 'success', response);
  })
  .catch((err) => {
    helpers.log('send', 'error', err);
  });
};

app.use(bodyParser.json());

app.post('/Messages', function(request, response) {
  helpers.log('receive', 'success', request);

  const userID = request.body.appUser.userId;
  const inMessage = request.body.messages[0].text;

  // TODO: Verify that the userID exists within
  //       the database of users

  if (request.body.trigger === 'message:appUser') {
    dialogue.parse(userID, inMessage)
      .then((outMessages) => {
        if (outMessages == null) return;

        var sender = function(index) {
          sendMessage(userID, outMessages[index]);

          if (index + 1 !== outMessages.length) {
            setTimeout(function() {
              sender(index + 1);
            }, 2000);
          }
        };

        sender(0);
      });

    response.end();
  };
});

app.post('/SendUser', function(request, response) {
  var data = request.body;
  var contextData = {
    topic: "none",
    retail_name: data.dispensaryname,
    retail_id: data.dispensaryid
  };

  context.set(data.userid, contextData).then(function() {
    dialogue.parse(data.userid, 'test')
      .then((outMessages) => {
        var sender = function(index) {
          sendMessage(data.userid, outMessages[index]);

          if (index + 1 !== outMessages.length) {
            setTimeout(function() {
              sender(index + 1);
            }, 2000);
          }
        };

        sender(0);
      });
  });

  response.end("HELLO");
})

helpers.get(PRODUCT_INFO_ENDPOINT).then(function(data) {
  dialogue.setGlobals(data);
});

app.listen(PORT, () => {
  console.log(`Starting up on Port ${PORT}`);
});
