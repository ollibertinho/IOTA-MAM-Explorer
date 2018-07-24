var express = require('express');
var router = express.Router();

var indexRouter = function() {
    router.get('/', function(req, res, next) {
        res.render('index');    
    });
    return router;
}

module.exports = indexRouter;