var express = require('express');
var router = express.Router();
var JsonDB = require('node-json-db');
var _ = require('lodash');

// Recipes listing
router.get('/', function (req, res, next) {
  var db = new JsonDB('db', false, false);
  var recipes = db.getData('/recipes');

  // Expand requested resources if they exist
  // The resource to expand is singular, e.g.
  // to expand 'users' we provide _expand=user
  var expand = req.query._expand;
  if (expand) {
    try {
      var relation = db.getData('/' + expand + 's');
      _(recipes)
        .forEach(function (recipe) {
          recipe.user = _(relation).findWhere({ id: recipe[expand + 'Id'] });
          delete recipe[expand + 'Id'];
        })
        .value();
    }
    catch(err) {
      console.log(err);
    }
  }

  res.json(recipes);
});

module.exports = router;
