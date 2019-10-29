"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var vocabRoute = require("./vocabRoutes");
var phraseRoute = require("./phraseRoutes");
var app = express();
app.get("/", function (req, res) {
    res.send("Hello World");
});
app.use("/vocab", vocabRoute.default);
app.use("/phrase", phraseRoute.default);
app.listen(3000, function () {
    console.log("Listening on port 3000!");
});
