module.exports = function(peer, db){
  return {
    query: function(opts, cb){
      //list connected peers
      console.log('querying for peers.');
      var peers = [];
      db.createReadStream()
        .on('data', function(data){
          if (data) {
            peers.push(data.key);
          }
        })
        .on('end', function(){
          cb(peers);
        });
    },
    send: {
      ice_candidate: function(peerid, cb){
        //send icecandidate to peer
        console.log('sending icecandidate.');
        var res = 'sending icecandidate';
        cb(res);
      },
      session_description: function(peerid, cb){
        //send session description to peer
        console.log('sending session descrition.');
        var res = 'sending session description';
        cb(res);
      }
    }
  };
};
