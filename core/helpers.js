'use strict';

const fs = require('fs');
const util = require('util');
const XMLHttpRequest = require('xhr2');

function getDateTime() {
  var date = new Date();
  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;
  var min  = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;
  var sec  = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;
  var day  = date.getDate();
  day = (day < 10 ? "0" : "") + day;
  return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
};

function simpleStringify(inObject) {
  var str = util.inspect(inObject, { depth: null });

  str = str
    .replace(/<Buffer[ \w\.]+>/ig, '"buffer"')
    .replace(/\[Function]/ig, 'function(){}')
    .replace(/\[Circular]/ig, '"Circular"')
    .replace(/\{ \[Function: ([\w]+)]/ig, '{ $1: function $1 () {},')
    .replace(/\[Function: ([\w]+)]/ig, 'function $1(){}')
    .replace(/(\w+): ([\w :]+GMT\+[\w \(\)]+),/ig, '$1: new Date("$2"),')
    .replace(/(\S+): ,/ig, '$1: null,');

  return JSON.stringify(str, null, 4)
};

module.exports.log = function(direction, type, data) {
  const ACTION_TYPES = ["receive", "send", "parse"];
  const LOG_TYPES = ["success", "error"];

  if (~ACTION_TYPES.indexOf(direction) === 0) return;
  if (~LOG_TYPES.indexOf(type) === 0) return;

  let header = "\n\n---\n\n" + `${getDateTime()} ${direction} ${type}`.toUpperCase() + "\n\n";

  fs.appendFile("./development.log", header + simpleStringify(data));
};

module.exports.objMerge = function(obj1,obj2) {
  var obj3 = {};
  for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
  for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
  return obj3;
};

module.exports.joinWith = function(arr, all, last) {
  var lastItem = arr.splice(-1);          
  arr = arr.length ? [arr.join(all)] : [];
  arr.push(lastItem);                     
  return arr.join(last);                  
};

module.exports.fuzzySearch = function(searchKeys, searchIn, searchString) {
  var matchedKey = false;
  
  for (var key of searchKeys) {
    var matched = searchIn[key].some(function(searchKey) {
      return searchString.indexOf(searchKey) > -1;
    });

    if (matched) {
      matchedKey = key;
      break;
    };
  };

  return matchedKey;
};

module.exports.post = function(url, params) {
  return new Promise(function (success, fail) {
    var http = new XMLHttpRequest();
    http.open("POST", url, true);

    http.onreadystatechange = function() {
      if (http.readyState == 4 && http.status == 200) {
        success(http.responseText);
      }
    };

    http.send(params);
  });
};

module.exports.get = function(url, params) {
  return new Promise(function (success, fail) {
    var http = new XMLHttpRequest();
    http.open("GET", url, true);

    http.onreadystatechange = function() {
      if (http.readyState == 4 && http.status == 200) {
        success(JSON.parse(http.responseText));
      }
    };

    http.send(params);
  });
};
