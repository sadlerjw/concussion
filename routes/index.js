var express = require('express');
var hljs = require('highlight.js');
var router = express.Router();


/* GET home page. */

router.get('/', function(req, res) {
  res.render('index', { title: 'Express', code: hljs.highlightAuto("//hello world").value });
});

module.exports = router;
