var express = require('express');
var router = express.Router();
var JsonDB = require('node-json-db');
var _ = require('lodash');
var auth = require('../../utils/auth');

// Get the tags for a recipe
function getTags(recipe, tags, recipeTags) {
  // Get the tag ids that are in our recipe
  var relTags = _(recipeTags)
    .remove(function(tag) {
      return _(tag).keys().first() == recipe.id;
    })
    .map(function(tag) {
      return _(tag).values().first();
    })
    .value();

  // Get the list of tag objects
  return _.filter(tags, function(tag) {
    return _.indexOf(relTags, tag.id) !== -1;
  });
}

// Get the ingredients for a recipe
function getIngredients(recipe, ingredients, recipeIngredients) {
  // Get the ingredient ids that are in our recipe
  var relIngredients = _(recipeIngredients)
    .remove(function(ingredient) {
      return _(ingredient).keys().first() == recipe.id;
    })
    .map(function(ingredient) {
      return _(ingredient).values().first();
    })
    .value();

  // Get the list of ingredient objects with amounts
  return _.filter(ingredients, function(ingredient) {
    var rel = _.find(relIngredients, {ingredient_id: ingredient.id});
    if (!_.isUndefined(rel)) {
      return _.assign(ingredient, _.omit(rel, 'ingredient_id'));
    }
  });
}

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
  var q = _.trim(req.query.q);
  var qReg = q && new RegExp(_.escapeRegExp(q), 'i');

  // Filter on the search query and then optionally
  // expand recipes in the response
  res.json(_(recipes)
    .filter(function (recipe) {
      if (qReg) {
        return _.trim(recipe.description).match(qReg);
      }
      return true;
    })
    .map(function (recipe) {
      if (relation) {
        recipe[expand] = _(relation).find({ id: recipe[expand + 'Id'] });
        delete recipe[expand + 'Id'];
      }
      recipe.tags = getTags(recipe, db.getData('/tags'), db.getData('/recipetags'));
      return recipe;
    })
    .value());
});

//
// Get a recipe by id
//
router.get('/:id', function (req, res, next) {
  var db = new JsonDB('db', false, false);
  var recipes = db.getData('/recipes');
  var recipe = _.find(recipes, {id: _.parseInt(req.params.id)});
  if (recipe) {
    recipe.user = _.find(db.getData('/users'), {id: recipe.userId});
    delete recipe.userId;
    recipe.tags = getTags(recipe, db.getData('/tags'), db.getData('/recipetags'));
    recipe.ingredients = getIngredients(recipe, db.getData('/ingredients'), db.getData('/recipeingredients'));
    return res.json(recipe);
  }
  next();
});

//
// Create a new recipe
//
router.post('/', auth.token, function(req, res, next) {
  var db = new JsonDB('db', false, true);
  var post = req.body;
  var title = post.title;
  var description = post.description;
  var tags = post.tags;
  var image = post.image;
  var ingredients = post.ingredients;
  var lastId;

  // Add the recipe to the datastore
  try {
    // Let's start by getting our most recent id
    var recipes = db.getData('/recipes');

    // Let's get some Lodash in here!
    lastId = _(recipes).last().id;

    // Update the datastore
    db.push('/recipes', [{
      id: ++lastId,
      title: title,
      description: description,
      image: image,
      userId: req.user.id,
      created: _.now()
    }], false);
    db.save();

    // First get a unique set of tags
    tags = _.uniqBy(tags, function (tag) {
      return tag.toLowerCase();
    });

    // Get the db tags and last index
    var dbTags = db.getData('/tags');
    var lastTagId = _(dbTags).last().id;

    // Get new tags to save
    var saveTags = _.remove(tags, function(tag) {
      return !_(dbTags).find({title: tag});
    });

    // Only save the unique tags
    db.push('/tags', _.map(saveTags, function(tag) {
      return {
        id: ++lastTagId,
        title: tag
      };
    }), false);
    db.save();

    // Save the tag relationships
    dbTags = db.getData('/tags');
    tags = _(tags).concat(saveTags).value();
    var recipeTags = _.map(tags, function(tag) {
      var rel = {};
      rel[lastId] = _.find(dbTags, {title: tag}).id;
      return rel;
    });
    db.push('/recipetags', recipeTags, false);
    db.save();

    // Get a unique set of ingredients
    ingredients = _.uniq(ingredients, function(ingredient) {
      return ingredient.title.toLowerCase();
    });

    // Get the db ingredients and last index
    var dbIngredients = db.getData('/ingredients');
    var lastIngredientId = _.last(dbIngredients).id;

    // Get the new ingredients to save
    var saveIngredients = _.remove(ingredients, function(ingredient) {
      return !_.find(dbIngredients, {title: ingredient.title});
    });

    // Only save the unique ingredients
    db.push('/ingredients', _.map(saveIngredients, function(ingredient) {
      return {
        id: ++lastIngredientId,
        title: ingredient.title
      };
    }), false);
    db.save();

    // Save the ingredient relationships
    dbIngredients = db.getData('/ingredients');
    ingredients = _(ingredients).concat(saveIngredients).value();
    var recipeIngredients = _.map(ingredients, function(ingredient) {
      var rel = {};
      var id = _.find(dbIngredients, {title: ingredient.title}).id;
      rel[lastId] = {
        ingredient_id: id,
        amount: ingredient.amount,
        unit: ingredient.unit
      };
      return rel;
    });
    db.push('/recipeingredients', recipeIngredients, false);
    db.save();
  }
  catch (err) {
    console.log(err.message);
  }

  res.json({
    id: lastId,
    title: title,
    description: description,
    image: image,
    tags: tags
  });
});

module.exports = router;
