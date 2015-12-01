var express = require('express');
var router = express.Router();
var JsonDB = require('node-json-db');
var _ = require('lodash');

// Tags listing
router.get('/', function (req, res, next) {
  var db = new JsonDB('db', false, false);

  // Get the total number of tags used in recipes
  var recipetags = db.getData('/recipetags');
  var totals = _(recipetags)
    .countBy(function(tag) {
      return _(tag).values().first();
    })
    .value();

  // Map tags to their totals
  var tags = db.getData('/tags');
  res.json(_(tags).map(function(tag) {
    tag.total = totals[tag.id] || 0;
    return tag;
  }).value());
});

module.exports = router;
