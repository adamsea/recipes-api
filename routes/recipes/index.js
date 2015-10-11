var express = require('express');
var router = express.Router();
var JsonDB = require('node-json-db');
var _ = require('lodash');

// Recipes listing
router.get('/', function (req, res, next) {
  var db = new JsonDB('db', false, false);
  var recipes = db.getData('/recipes');

  // Expand requested resources if they exist
  // Users and ingredients for the recipes are loaded
  if (!_.isUndefined(req.query._expand)) {
    var users = db.getData('/users');
    _(recipes)
      .forEach(function (recipe) {
        recipe.user = _(users).findWhere({ id: recipe.userId });
        delete recipe.userId;
      })
      .value();
  }

  res.json(recipes);
});

module.exports = router;
