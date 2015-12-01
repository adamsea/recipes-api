var express = require('express');
var router = express.Router();
var JsonDB = require('node-json-db');

// Tags listing
router.get('/', function (req, res, next) {
  var db = new JsonDB('db', false, false);
  var tags = db.getData('/tags');
  res.json(tags);
});

module.exports = router;
