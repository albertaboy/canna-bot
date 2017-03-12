const helpers = require('./helpers');
const context = require('./context');
const script = require('../script.json');

var globals = {};

module.exports.setGlobals = function(newGlobals) {
  globals = helpers.objMerge(globals, newGlobals)
};

module.exports.parse = function(userID, inMessage) {
  inMessage = inMessage.toLowerCase();

  return new Promise(function (success, fail) {
    context.retrieve(userID)
      .then(function(userContext) {
        var response, nextTopicKey;
        var contextData = {};
        var currentTopic = script[userContext.topic];

        var dispensaryProducts = { products: formatProducts(globals.products) };
        var messageVariables = helpers.objMerge(userContext, dispensaryProducts);

        if (currentTopic.hasOwnProperty("choice")) {
          var choiceNumber;
          var numberTest = inMessage.match(/\d+/);
          if (numberTest) {
            choiceNumber = parseInt(numberTest[0]) - 1;
          };

          if (userContext.topic === "display_deals" || userContext.topic === "learn_more") {
            var choicePrefixes = currentTopic.choice.prefixes;
            var matchedKey = helpers.fuzzySearch(Object.keys(choicePrefixes), choicePrefixes, inMessage);

            if (matchedKey && globals.products[choiceNumber] !== null) {
              nextTopicKey = currentTopic.choice.prefix_topics[matchedKey];

              switch (matchedKey) {
                case "learn":
                  messageVariables.description = globals.products[choiceNumber].description;
                  contextData.currentInventoryChoice = choiceNumber;
                  break;
                case "buy":
                  contextData.currentInventoryChoice = choiceNumber;
                  break;
              }
            }
          };

          if ((nextTopicKey && nextTopicKey === "cart_quantity") || userContext.topic !== "cart_quantity") {
            var inventoryItems = globals.products[choiceNumber || userContext.currentInventoryChoice].inventory;
            messageVariables.inventory = formatInventory(inventoryItems);
          };

          if (userContext.topic === "cart_quantity") {
            nextTopicKey = "order_confirmation";
            var product = globals.products[userContext.currentInventoryChoice];
            messageVariables.order_overview = formatOrderOverview(product.name, product.inventory[choiceNumber])
          };
        };

        if (currentTopic.hasOwnProperty("static_responses") && !nextTopicKey) {
          var responseTopics = currentTopic.response_topics;
          var matchedKey = helpers.fuzzySearch(Object.keys(responseTopics), currentTopic.static_responses, inMessage);

          if (matchedKey) {
            nextTopicKey = currentTopic.response_topics[matchedKey];
            nextTopic = script[nextTopicKey];
          };
        };

        if (currentTopic.hasOwnProperty("next") && !nextTopicKey) {
          nextTopicKey = currentTopic.next;
        };

        if (nextTopicKey != null) {
          var nextTopic = script[nextTopicKey];
          contextData.topic = nextTopicKey;
          
          if (nextTopic.message != null) {
            response = nextTopicMessages(userID, nextTopic, messageVariables);
          };
        } else {
          response = ["Sorry, I didn't understand that."]
        };

        context.set(userID, contextData);

        success(response);
      })
      .catch(function(err) {
        console.log(`ERROR: ${err}`);
      });
  });
};

function nextTopicMessages(userID, topic, variables) {
  var messages = topic.message;

  messages = typeof messages === "string" ? [messages] : messages;

  messages.forEach(function(message, index) {
    message = typeof message === "string"
      ? message
      : message[Math.floor(Math.random() * message.length)];
    return messages[index] = interpString(message, variables);
  });

  return messages;
};

function interpString(message, variables) {
  return replacement = message.replace(/\[([^\]]+)\]/gi, function(match, capture) {
    return variables[capture] || "MISSING_VARIABLE";
  });
};

function formatProducts(products) {
  var productsString = "";

  products.map(function(product) {
    return product.name;
  }).forEach(function(name, index) {
    productsString = productsString + `${"\n"}${index + 1}) ${name}`;
  });

  return productsString;
};

function formatInventory(inventory) {
  var inventoryString = "";

  inventory.forEach(function(item, index) {
    inventoryString = inventoryString + `${"\n"}${index + 1}) ${item.amount}oz. - $${item.price}`;
  });

  return inventoryString;
};

function formatOrderOverview(name, inventoryData) {
  return `${inventoryData.amount}oz. of ${name} for $${inventoryData.price}`;
};
