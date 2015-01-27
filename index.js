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

function multiStream(){
  console.log('multistream function fired');
  var mdm = MuxDemux();
  mdm.on('connection', connectHandler);
  mdm.on('error', function(err){
    console.log(err.toString());
    mdm.destroy();
  });

  function connectHandler(stream){
    console.log('connect handler fired');
    console.log(stream.meta);
  }

  return mdm;
}

sock.install(server, '/peers');
