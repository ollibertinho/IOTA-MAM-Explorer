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
app.use(subdomain('mam', router));

var httpServer = http.createServer(app);
var httpsServer = https.createServer(options, app);

var io = new ioServer();
io.attach(httpServer);
io.attach(httpsServer);

httpServer.listen(8081);
httpsServer.listen(8443);


router.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

router.get('/about_mam', function(req, res){
  res.sendFile(__dirname + '/about_mam.html');
});

router.get('/about_iota', function(req, res){
  res.sendFile(__dirname + '/about_iota.html');
});

router.get('/about', function(req, res){
  res.sendFile(__dirname + '/about.html');
});

function deleteFromArray(my_array, element) {
  position = my_array.indexOf(element);
  my_array.splice(position, 1);
}

io.on('connection', function(socket)
{
	try 
	{
		clients.push(socket.id);
		console.log('client conntected: ' + socket.id);	
		socket.on('fetch', fetchData);	
		
		socket.on('disconnect', function()
		{		
			console.log('client disconnected:'+socket.id);
			socket.removeListener('fetch', fetchData);
			deleteFromArray(clients, socket.id);
		});
		
		function fetchData(root)
		{		
			try 
			{
				Mam.fetch(root, 'public', null, data => 
				{
					try 
					{
						io.to(socket.id).emit('fetch', JSON.parse(iota.utils.fromTrytes(data)));			
					}catch(e) 
					{
						console.log('exception:'+e);
						io.to(socket.id).emit('error', e);
					}
				});
			}catch(e) 
			{
				console.log('exception:'+e);
				io.to(socket.id).emit('error', e);
			}
		}

	}catch(e) 
	{
		console.log('exception:'+e);
		io.to(socket.id).emit('error', e);
	}
})
