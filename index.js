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

function multiStream(){
  var peer;
  var mdm = MuxDemux();
  mdm.on('connection', connectHandler);
  mdm.on('error', function(err){
    console.log(err.toString());
    mdm.destroy();
  });

  mdm.once('connection', function(stream){
    var self = this;
    self.peerid = 'peer!' + Math.random().toString(16).slice(2);
    socks.push(self);
    console.log(self.peerid + ' connected.');

    stream.on('close', function(){
      var tmp = null;
      for (i = 0; i < socks.length; ++i) {
        if (socks[i].peerid === self.peerid) {
          tmp = i;
          break;
        }
      }
      socks.splice(tmp, 1);
      console.log(self.peerid + ' disconected.');
    });

  });

  function connectHandler(stream){
    var self = this;
    if (stream.meta === 'rpc') {
      var rpc = rpcStream(signaler(peer, db));
      rpc.pipe(stream).pipe(rpc);
    }
    if (stream.meta === 'notice'){
      console.log(socks.map(function(s){
        return s.peerid;
      }));
      socks.forEach(function(p){
        if (p.peerid == self.peerid) {
          console.log('found self: ' + p.peerid);
        } else {
          console.log('other stream: ' + p.peerid);
        }
      });
    }
  }

  return mdm;
}

sock.install(server, '/peers');
