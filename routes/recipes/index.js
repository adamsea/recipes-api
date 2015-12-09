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

//
// Create a new recipe
//
router.post('/', function(req, res, next) {
  var db = new JsonDB('db', false, true);
  var post = req.body;
  var title = post.title;
  var description = post.description;
  var tags = post.tags;
  var lastId;

  // Add the recipe to the datastore
  try {
    // Let's start by getting our most recent id
    var recipes = db.getData('/recipes');

    // Let's get some Lodash in here!
    lastId = recipes[recipes.length - 1].id;

    // First get a unique set of tags
    tags = _(tags)
      .uniqBy(function (tag) {
        return tag.toLowerCase();
      })
      .value();

    // Update the datastore
    db.push('/recipes', [{
      id: ++lastId,
      title: title,
      description: description,
      userId: 1,
      tags: tags
    }], false);
    db.save();
  }
  catch (err) {
    console.log(err.message);
  }

  res.json({
    id: lastId,
    title: title,
    description: description,
    tags: tags
  });
});

module.exports = router;
