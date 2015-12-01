var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');

// CORS setup
var corsOptions = {
  origin: 'http://127.0.0.1:9000'
};

// Modules for API resource routes
var routes = require('./routes/index');
var recipes = require('./routes/recipes/index');
var tags = require('./routes/tags/index');

// Create express app instance and set middleware
var app = express();
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Mount the route modules
app.use('/', routes);
app.use('/recipes', recipes);
app.use('/tags', tags);

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
