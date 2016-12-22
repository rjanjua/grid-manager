const Browser = function(driver_){
  this.driver = driver_;
  this.locked = false;
  this.getSessionId();
};

Browser.prototype.getSessionId = function(){
  if(this._sessionId == undefined){ 
    return this.driver
    .getSession()
    .then( (session) => {
      this._sessionId = session.getId();
      return this._sessionId;
    });
  } else {
    return Promise.resolve(this._sessionId);
  }
}

Browser.prototype.lock = function(){
  this.locked = true;
  return this;
};

Browser.prototype.unlock = function(){
  this.locked = false;
  return this;
};

module.exports = Browser;