/* NOTES
  -stream here is a duplex stream (both readble and writable).
  -findout about stream in the node stream docs file:///home/ron/Docs/Node/all.html#all_stream
  -ex. stream.pipe(stream) is an echo server.
  
  -*(on close solved this) to make sure clients are connected, checkout heartbeat.
  -for public offers db, can use symetric cypher and your friends just have a password to use your offer.
*/

var shoe = require('shoe');
var http = require('http');
var through = require('through2');

var level = require('level');
var db = level('./db');

var ecstatic = require('ecstatic')(__dirname + '/static');

var server = http.createServer(ecstatic);
server.listen(9999, function(){
  console.log('signal server listening at port: 9999');
});

var sock = shoe(function(stream) {

  //on connect
  //check if there are open offers
  //if so, answer offer
  //

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

  //duplex stream: kindof like request_stream.pipe(DOSTUFF).pipe(response_stream)
  stream.pipe(Signal(peer)).pipe(stream);
  //stream.pipe(Signal(peer)).pipe(process.stdout);
});

function Signal(peer){
  return through.obj(function(msg, enc, next){
    var stream = this;
    msg = JSON.parse(msg);

    if (!msg) return next();
    if (msg.type === 'LIST.PEERS') {
      //list connected peers
      var peers = [];
      db.createReadStream()
        .on('data', function(data){
          if (data) {
            peers.push(data.key);
          }
        })
        .on('end', function(){
          stream.push(JSON.stringify(peers));
          next();
        });
    }
    else if (msg.type === 'ICECANDIDATE') {
      //set icecandidate
      peer.icecandidate = msg.body;
      db.put(peer.id, peer, function(err){
        if (err) return console.log(err);
        console.log(peer.id + ': set icecandidate');
        console.log(msg.body);
        stream.push(JSON.stringify({
          msg: 'SUCCESS',
          body: 'set icecanditate'
        }));
        next();
      });
    }
    else if (msg.type === 'OFFER') {
      //set webRTC offer for peer
      peer.offer = msg.body;
      db.put(peer.id, peer, function(err){
        if (err) return console.log(err);
        console.log(peer.id + ': setting/updating webRTC offer');
        stream.push(JSON.stringify({
          msg: 'SUCCESS',
          body: 'set/updated webRTC offer'
        }));
        next();
      });
    }
    else if (msg.type === 'ANSWER') {
      //send answer to other peer
      console.log(peer.id + ': sending webRTC answer');
      console.log(msg.body);
    }
    else next();
  });
}

sock.install(server, '/peers');
