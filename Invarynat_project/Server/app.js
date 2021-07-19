"use strict";
const debug = require("debug"),
  express = require("express"),
  path = require("path"),
  favicon = require("serve-favicon"),
  logger = require("morgan"),
  cookieParser = require("cookie-parser");

const routes = require("./routes/index"),
  users = require("./routes/users");

const app = express();

app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded());
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
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
const server = app.listen(app.get("port"), "localhost", function () {
  console.log(" server started with details ", server.address());
  debug("Express server listening on port " + server.address().port);
});
