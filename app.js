var fs = require('fs');
var subdomain = require('express-subdomain');
var express = require('express');
var app = express();
var http = require('http');
var https = require('https');
var myio = require('./socket');
var IOTA = require('iota.lib.js');

var port = 8081;
var portSSL = 8443;
var userCounter = 0;

var iota = new IOTA({ provider: 'https://field.carriota.com:443' });

const options = {
  key: fs.readFileSync("../certs/mam.iotamixer.io/privkey.pem"),
  cert: fs.readFileSync("../certs/mam.iotamixer.io/fullchain.pem"),
  requestCert: false,
  rejectUnauthorized: false
};

var indexRouter = require('./routes/index')();
app.use('/', indexRouter);
app.use('/fetch', indexRouter);

app.use(express.static(__dirname + '/assets'));
app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/'));
app.use(subdomain('mam', indexRouter));

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

var httpServer = http.createServer(app);
var httpsServer = https.createServer(options, app);

var mamExplorerSocket = myio(iota);
mamExplorerSocket.attach(httpServer);
mamExplorerSocket.attach(httpsServer);

httpServer.listen(port);
httpsServer.listen(portSSL);
