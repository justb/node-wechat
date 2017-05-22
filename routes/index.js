var express = require('express');
var router = express.Router();
var request = require("request");


router.get('/', function (req, res, next) {
  console.log(req.body.xml);
	res.send(req);

});

module.exports = router;
