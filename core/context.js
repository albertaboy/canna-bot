const helpers = require('./helpers');
const storage = require('node-persist');

module.exports.retrieve = function(userID) {
  return new Promise(function (success, fail) {
    storage.init()
      .then(function() {
        storage.getItem(userID).then(function(contextValue) {
          success(contextValue);
        });
      })
      .catch(function(err) {
        console.log(`ERROR: ${err}`);
      });
  });
};

module.exports.set = function(userID, newData) {
  return new Promise(function (success, fail) {
    module.exports.retrieve(userID)
      .then(function(contextValue) {
        var updatedData = helpers.objMerge(contextValue, newData);
        storage.setItem(userID, updatedData)
        success()
      })
      .catch(function(err) {
        console.log(`ERROR: ${err}`);
      });
  });
};
