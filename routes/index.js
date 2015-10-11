var express = require('express');
var router = express.Router();

// Root api entry point
router.get('/', function(req, res, next) {
    res.send('Hello Recipes API!');
});

module.exports = router;
