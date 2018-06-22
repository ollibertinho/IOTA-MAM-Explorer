var fs = require('fs');
var subdomain = require('express-subdomain');
var express = require('express');
var app = express();
var http = require('http');
var https = require('https');
var Mam = require('mam.client.js');
var IOTA = require('iota.lib.js');
var ioServer = require('socket.io');

var port = 8081;
var portSSL = 8443;

var iota = new IOTA({ provider: 'http://localhost:14265' })
var clients = [];

const options = {
  key: fs.readFileSync("../certs/mam.iotamixer.io/privkey.pem"),
  cert: fs.readFileSync("../certs/mam.iotamixer.io/fullchain.pem"),
  requestCert: false,
  rejectUnauthorized: false
};

var router = express.Router();
var mamState = Mam.init(iota);
app.use(express.static(__dirname + '/assets'));
app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/'));
app.use(subdomain('mam', router));

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

var httpServer = http.createServer(app);
var httpsServer = https.createServer(options, app);

var io = new ioServer();
io.attach(httpServer);
io.attach(httpsServer);

httpServer.listen(port);
httpsServer.listen(portSSL);

router.get('/', function(req, res){
  res.render("index");
});

router.get('/about', function(req, res){
    res.render("about");
});

router.get('/fetch', function(req, res) {
    res.render("index");
});

function deleteFromArray(my_array, element) {
    position = my_array.indexOf(element);
    my_array.splice(position, 1);
}

function tryParseJSON (jsonString){
    try {
        var o = JSON.parse(jsonString);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object", 
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) { }

    return false;
};

io.on('connection', function(socket)
{
	try 
	{
		clients.push(socket.id);
		console.log('client connected: ' + socket.id);	

		socket.on('fetch', fetchData);	
		
		socket.on('stopFetching', function() {
			socket.removeListener('fetch', fetchData);
		});
		
		socket.on('getCurrentlyConnected', function() {
			io.to(socket.id).emit('getCurrentlyConnected', clients.length);
		});
		
		socket.on('disconnect', function(){		
			try {
				console.log('client disconnected:'+socket.id);
				socket.removeListener('fetch', fetchData);
				deleteFromArray(clients, socket.id);
			}catch(err) {
				console.log(err);
			}		
		});
		
		function fetchData(mamData)
		{		
			console.log(mamData);
			try 
			{				
				var mamType='public';
				var sidekey =null;
				if(mamData.sidekey != '') {
					sidekey = mamData.sidekey;
					mamType = 'restricted';
				}				
				console.log(mamData.root);
				console.log(mamType);
				console.log(sidekey);
				Mam.fetch(mamData.root, mamType, sidekey, data => 
				{
					console.log(data);
					try 
					{
						var fetchedData = tryParseJSON(iota.utils.fromTrytes(data));
						var retVal = null;
						if(fetchedData == false) {
							retVal = { 'type':'raw', 'data':iota.utils.fromTrytes(data) };							
						}else {
							retVal = { 'type':'json', 'data':JSON.parse(iota.utils.fromTrytes(data)) };
						}
						io.to(socket.id).emit('fetch', retVal);		

					}catch(e) 
					{
						console.log('exception:'+e);
						io.to(socket.id).emit('error', e.message);
					}
				});
			}catch(e) 
			{
				console.log('exception:'+e);
				io.to(socket.id).emit('error', e.message);
			}
		}

	}catch(e) 
	{
		console.log('exception:'+e);
		io.to(socket.id).emit('error', e.message);
	}
})
