var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Modules for API resource routes
var routes = require('./routes/index');
var recipes = require('./routes/recipes/index');

// Create express app instance and set middleware
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Mount the route modules
app.use('/', routes);
app.use('/recipes', recipes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
app.use(function (err, req, res, next) {
  var status = err.status || 500;
  if (status === 404) {
    res.status(status).json({ message: 'We were unable to locate that resource' });
  }
  else {
    res.status(status).json({ message: 'There was an error on the server' });
  }
});

module.exports = app;
