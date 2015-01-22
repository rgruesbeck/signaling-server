module.exports = function(peer, db){
  return {
    getPeers: function(cb){
      //list connected peers
      var peers = [];
      db.createReadStream()
        .on('data', function(data){
          if (data) {
            peers.push(data.key);
          }
        })
        .on('end', function(){
          console.log(peers.length + ' peers connected...');
          cb(peers);
        });
    },
    sendICE: function(peerid, cb){
      //send icecandidate to peer
      var res = peer.id + ' sending icecandidate to ' + peerid;
      console.log(res);
      cb(res);
    },
    sendSDP: function(peerid, cb){
      //send session description to peer
      var res = peer.id + ' sending session descrition to ' + peerid;
      console.log(res);
      cb(res);
    }
  };
};
