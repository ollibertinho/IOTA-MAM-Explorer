var socketIo = require('socket.io');
var Mam = require('mam.client.js');
var tools = require('./tools.js');
var io = new socketIo();

var ioServer = function(iota) {

    let mamState = Mam.init(iota);
    let clients = [];

    io.on('connection', function(socket)
    {
        try 
        {
            clients.push(socket.id);

            socket.on('fetch', fetchData);
            
            socket.on('stopFetching', function() {
                socket.removeListener('fetch', fetchData);
                socket.on('fetch', fetchData);
            });
            
            socket.on('getCurrentlyConnected', function() {
                io.to(socket.id).emit('getCurrentlyConnected', clients.length);
            });
            
            socket.on('disconnect', function(){		
                try {
                    console.log('client disconnected:'+socket.id);
                    socket.removeListener('fetch', fetchData);
                    tools.deleteFromArray(clients, socket.id);
                }catch(err) {
                    console.log(err);
                }		
            });
            
            function fetchData(mamData)
            {		
                console.log(mamData);
                try 
                {				
                    let mamType = 'public';
                    let sidekey = null;
                    if(mamData.sidekey != '') {
                        console.log(mamData.sidekey);
                        sidekey = mamData.sidekey;
                        mamType = 'restricted';
                    }				
                    console.log('root',mamData.root);
                    console.log('type',mamType);
                    console.log('sidekey',sidekey);
                    Mam.fetch(mamData.root, mamType, sidekey, data => 
                    {
                        console.log(data);
                        try 
                        {
                            let fetchedData = tools.tryParseJSON(iota.utils.fromTrytes(data));
                            let retVal = null;
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
    });
    return io;
};

module.exports = ioServer;
