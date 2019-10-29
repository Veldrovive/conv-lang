"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var vocab = require("../lib/Vocab");
var router = express.Router();
var testWord = new vocab.Word("test", "testId");
router.get("/", function (req, res) {
});
router.get("/wordByVal/:value", function (req, res) {
    var value = req.params.value;
    res.send(value);
});
router.get("wordById/:id", function (req, res) {
    var id = req.params.id;
    res.send(id);
});
exports.default = router;
