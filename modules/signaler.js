module.exports = function(self, socks){
  return {
    //send icecandidate to peer
    sendICE: function(opts){
      if (!opts.to && !opts.ice) return console.log('error sending offer');
      opts.from = self;
      console.log('%d sending ice to %d and return answer when accepted.', self.peerid, opts.to);
    },
    //send session description to peer
    sendSDP: function(opts){
      if (!opts.to && !opts.sdp) return console.log('error sending offer');
      opts.from = self;
      console.log('%d sending sdp to %d and return answer when accepted.', self.peerid, opts.to);
    }
  };
};
