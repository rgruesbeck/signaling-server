var http = require('http');
var shoe = require('shoe');
var through = require('through2');
var dnode = require('dnode');
var ecstatic = require('ecstatic')(__dirname + '/static');

var level = require('level');
var db = level('./db');

var server = http.createServer(ecstatic);
server.listen(9999, function(){
  console.log('signal server listening at port: 9999');
});

var sock = shoe(function(stream) {

  //initialize peer
  var peer = {
    id: 'peer!' + Math.random().toString(16).slice(2),
    socket: stream,
    offer: null,
    icecandidate: null
  };

  //add peer to when client connects.
  db.put(peer.id, peer, function(err){
    if (err) return console.log(err);
    console.log(peer.id + ' connected.');
  });

  //remove peer when client closes connection.
  stream.on('close', function(){
    db.del(peer.id, function(err){
      if (err) return console.log(err);
      console.log(peer.id + ' disconected.');
    });
  });

  //load rpc signaling functions
  var signaler = require('./modules/signaler')(peer, db);
  var d = dnode(signaler);

  //pipe through dnode rpc stream.
  d.pipe(stream).pipe(d);
});

sock.install(server, '/peers');
