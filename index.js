var http = require('http');
var shoe = require('shoe');
var through = require('through2');
var MuxDemux = require('mux-demux');
var rpcStream = require('rpc-stream');
var signaler = require('./modules/signaler');
var ecstatic = require('ecstatic')(__dirname + '/static');

var server = http.createServer(ecstatic);
server.listen(9999, function(){
  console.log('signal server listening at port: 9999');
});

var socks = {};

var sock = shoe(function(stream) {
  stream.pipe(multiStream()).pipe(stream);
});

function multiStream(){
  var mdm = MuxDemux();
  mdm.once('connection', connectNew);
  mdm.on('connection', connectHandler);
  mdm.on('error', function(err){
    console.log(err.toString());
    mdm.destroy();
  });

  return mdm;
}

function connectNew(stream){
  var self = this;
  var id = 'peer!' + Math.random().toString(16).slice(2);
  self.peerId = id;
  socks[id] = self;
  console.log(self.peerId + ' connected.');

  stream.on('close', function(){
    delete socks[self.peerId];
    console.log(self.peerId + ' disconected.');
  });
}

function connectHandler(stream){
  var self = this;
  if (stream.meta === 'rpc') {
    var rpc = rpcStream(signaler(self, socks));
    rpc.pipe(stream).pipe(rpc);
  }
  if (stream.meta === 'notice'){
    for (var key in socks) {
      if (key != self.peerId) {
        stream.pipe(socks[key]);
      }
    }
  }
}

sock.install(server, '/peers');
