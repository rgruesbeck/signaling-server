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
  stream.pipe(multiStream()).pipe(stream);
});

function newPeer(sid){
  return {
    id: 'peer!' + Math.random().toString(16).slice(2),
    socketId: sid
  };
}

function multiStream(){
  var peer;
  var mdm = MuxDemux();
  mdm.on('connection', connectHandler);
  mdm.on('error', function(err){
    console.log(err.toString());
    mdm.destroy();
  });

  mdm.once('connection', function(stream){
    peer = newPeer(stream.id);
    if (!sock.peersockets) {
      sock.peersockets = [];
    }

    db.put(peer.id, JSON.stringify(peer), function(err){
      if (err) return console.log(err);
      sock.peersockets.push(stream);
      console.log(peer.id + ' connected.');
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

  });

  function connectHandler(stream){

    if (stream.meta === 'rpc') {
      console.log('stream is rpc');
      //var signaler = require('./modules/signaler')(peer, db);
      //var rpc = rpcStream(signaler);
      //rpc.pipe(stream).pipe(rpc);
    } else {
      console.log('stream is notice');
    }
  }

  return mdm;
}

sock.install(server, '/peers');
