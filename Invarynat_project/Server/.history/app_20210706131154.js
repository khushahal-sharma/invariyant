"use strict";
var debug = require("debug");
var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

var routes = require("./routes/index");
var users = require("./routes/users");

var app = express();

app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded());
app.use(cookieParser());

app.use("/", routes);
app.use("/users", users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  res.json();
});

// error handlers

app.set("port", process.env.PORT || 7000);
var server = app.listen(app.get("port"), "localhost", function () {
  console.log(" server started on port   ", server.address());
  debug("Express server listening on port " + server.address().port);
});
