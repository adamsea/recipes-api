var basicAuth = require('basic-auth');
var find = require('lodash/find');
var JsonDB = require('node-json-db');

//
// Basic auth middleware
// Check username & password against database
//
var basic = function(req, res, next) {
  var db = new JsonDB('db', false, false);
  var users = db.getData('/users');

  // Parse the authorization header
  var user = basicAuth(req);

  // Do we have a user that matches the auth header?
  var authUser = user && find(users, {username: user.name});
  if (authUser && authUser.password === user.pass) {
    req.user = authUser;
    next();
  }
  else {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
  }
};

//
// Check token against database
//
var token = function(req, res, next) {
  var db = new JsonDB('db', false, false);
  var users = db.getData('/users');

  // Get the token from the header
  var token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (token) {
    var authUser = find(users, {token: token});
    if (authUser) {
      req.user = authUser;
      next();
    }
    else {
      return res.sendStatus(401);
    }
  }
  else {
    return res.sendStatus(401);
  }
}

module.exports = {
  basic: basic,
  token: token
};