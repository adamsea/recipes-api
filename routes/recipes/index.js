var express = require('express');
var router = express.Router();
var JsonDB = require('node-json-db');

// Recipes listing
router.get('/', function (req, res, next) {
  var db = new JsonDB('db', false, false);
  var recipes = db.getData('/recipes');
  res.json(recipes);
});

module.exports = router;
