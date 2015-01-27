var http = require('http');
var shoe = require('shoe');
var through = require('through2');
var MuxDemux = require('mux-demux');
var rpcStream = require('rpc-stream');
var ecstatic = require('ecstatic')(__dirname + '/static');

var level = require('level');
var db = level('./db');

var server = http.createServer(ecstatic);
server.listen(9999, function(){
  console.log('signal server listening at port: 9999');
});

var sock = shoe(function(stream) {
  stream.pipe(multiStream(function(rpc, messages){
  })).pipe(stream);
});

function multiStream(cb){
    var mdm = MuxDemux();
    mdm.on('connection', connectHandler);
    mdm.on('error', function(err){
      console.log(err.toString());
      mdm.destroy();
    });

    function connectHandler(stream){
      console.log('client connected');
      console.log(stream.meta);
    }

    return mdm;
}

function newClient(stream){
  console.log(stream.meta);
  var peer = newPeer(stream.id);
  if (!sock.peersockets) {
    sock.peersockets = [];
  }

  db.put(peer.id, JSON.stringify(peer), function(err){
    if (err) return console.log(err);
    console.log(peer.id + ' connected');
    sock.peersockets.push(stream);
    console.log(sock.peersockets.length);
  });

  stream.on('close', function(){
    db.del(peer.id, function(err){
      if (err) return console.log(err);
      var tmp = null;
      for (i=0; i<sock.peersockets.length; ++i) {
        if (sock.peersockets[i] === peer.socketId) {
          tmp = i;
          break;
        }
      }
      sock.peersockets.splice(tmp, 1);
      console.log(peer.id + ' disconected.');
    });
  });

  //load rpc signaling functions
  var signaler = require('./modules/signaler')(peer, db);
  var rpc = rpcStream(signaler);

  //pipe through rpc stream
  rpc.pipe(stream).pipe(rpc);
}

function newPeer(sid){
  return {
    id: 'peer!' + Math.random().toString(16).slice(2),
    socketId: sid
  };
}

sock.on('connection', newClient);
sock.install(server, '/peers');