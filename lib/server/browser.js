const Browser = function(session){
  this.locked = false;
  this.capabilities = session.caps_;
  this._sessionId = session.id_;
};


Browser.prototype.lock = function(){
  this.locked = true;
  return this;
};

Browser.prototype.unlock = function(){
  this.locked = false;
  return this;
};

module.exports = Browser;