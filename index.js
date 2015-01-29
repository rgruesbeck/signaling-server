var http = require('http');
var shoe = require('shoe');
var through = require('through2');
var MuxDemux = require('mux-demux');
var rpcStream = require('rpc-stream');
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

  mdm.broadcast = function(msg){
    for (var key in socks) {
      socks[key].createWriteStream('msg').write(msg);
    }
    console.log('broadcasting ' + msg);
  };

  return mdm;
}

function connectNew(stream){
  var self = this;
  var id = 'peer!' + Math.random().toString(16).slice(2);
  self.peerId = id;
  socks[id] = self;

  var addMsg = {
    add: id,
    peers: Object.keys(socks)
  };


  self.broadcast(JSON.stringify(addMsg));

  stream.on('close', function(){
    delete socks[id];
    var removeMsg = {
      remove: id,
      peers: Object.keys(socks)
    };
    self.broadcast(JSON.stringify(removeMsg));
  });
}

function connectHandler(stream){
  var self = this;
  if (stream.meta === 'rpc') {
    var rpc = rpcStream(signaler(self));
    rpc.pipe(stream).pipe(rpc);
  }
  if (stream.meta === 'msg'){
    console.log('msg');
  }
}

function signaler(sender){
  return {
    //send icecandidate to peer and return answer when accepted.
    sendICE: function(opts){
      if (!opts.to && !opts.ice) return console.log('error sending offer');
      //opts.from = sender;
      opts.from = sender.peerId;
      console.log(JSON.stringify(opts));
    },
    //send session description to peer and return answer when accepted.
    sendSDP: function(opts){
      if (!opts.to && !opts.sdp) return console.log('error sending offer');
      //opts.from = sender;
      opts.from = sender.peerId;
      console.log(JSON.stringify(opts));
    }
  };
}

sock.install(server, '/peers');
