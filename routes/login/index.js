var express = require('express');
var router = express.Router();
var auth = require('../../utils/auth');
var _ = require('lodash');
var JsonDB = require('node-json-db');
var crypto = require('crypto');

// Login a user with basic auth
router.post('/', auth.basic, function (req, res, next) {
  var db = new JsonDB('db', false, true);
  var users = db.getData('/users');

  function sendError() {
    res.status(500).json({
      success: false,
      message: 'Unable to authenticate user.'
    });
  }

  // Find the auth user to update last login
  var i = _.findIndex(users, {username: req.user.username});
  crypto.randomBytes(16, function(err, buf) {
    if (!err) {
      var ret = _.attempt(db.push.bind(db), '/users['+i+']', {
        last_login: _.now(),
        token: buf.toString('hex')
      }, false);

      if (!_.isError(ret)) {
        res.json({
          success: true,
          message: 'Successfully authenticated user.',
          token: buf.toString('hex')
        });
      }
      else {
        sendError();
      }
    }
    else {
      sendError();
    }
  });
});

module.exports = router;
