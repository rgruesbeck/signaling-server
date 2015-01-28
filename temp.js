var http = require('http');
var shoe = require('shoe');
var through = require('through2');
var MuxDemux = require('mux-demux');
var rpcStream = require('rpc-stream');
var signaler = require('./modules/signaler');
var ecstatic = require('ecstatic')(__dirname + '/static');

var level = require('level');
var db = level('./db');

var server = http.createServer(ecstatic);
server.listen(9999, function(){
  console.log('signal server listening at port: 9999');
});

var socks = [];

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
    if (!sock.peers) {
      sock.peers = [];
    }

    db.put(peer.id, JSON.stringify(peer), function(err){
      if (err) return console.log(err);
      sock.peers.push(peer);
      console.log(peer.id + ' connected.');
    });

    stream.on('close', function(){
      db.del(peer.id, function(err){
        if (err) return console.log(err);
        var tmp = null;
        for (i=0; i<sock.peers.length; ++i) {
          if (sock.peers[i] === peer.socketId) {
            tmp = i;
            break;
          }
        }
        sock.peers.splice(tmp, 1);
        console.log(peer.id + ' disconected.');
      });
    });

  });

  function connectHandler(stream){
    if (stream.meta === 'rpc') {
      var rpc = rpcStream(signaler(peer, db));
      rpc.pipe(stream).pipe(rpc);
    }
    if (stream.meta === 'notice'){
      sock.peers.forEach(function(p){
        if (stream.id == p.socketId) {
          console.log('found self: ' + p.id);
        } else {
          console.log('other stream: ' + p.id);
        }
      });
    }
  }

  return mdm;
}

sock.install(server, '/peers');
