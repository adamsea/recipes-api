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
  var relation;
  if (expand) {
    try {
      relation = db.getData('/' + expand + 's');
    }
    catch(err) {
      console.log(err.message);
    }
  }

  // Obtain a possible search query
  var q = req.query.q;
  var qReg = q && new RegExp(q, 'i');

  // Filter on the search query and then optionally
  // expand recipes in the response
  res.json(_(recipes)
    .filter(function (recipe) {
      if (qReg) {
        return recipe.description.trim().match(qReg);
      }
      return true;
    })
    .map(function (recipe) {
      if (relation) {
        recipe[expand] = _(relation).find({ id: recipe[expand + 'Id'] });
        delete recipe[expand + 'Id'];
      }
      return recipe;
    })
    .value());
});

module.exports = router;
