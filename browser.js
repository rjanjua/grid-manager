const Browser = function(driver_){
  this.driver = driver_;
  this.locked = false;
  this.getSessionId();
};

Browser.prototype.getSessionId = function(){
  return this.driver
  .getSession()
  .then( (session) => {
    this.sessionId = session.getId();
    return this.sessionId;
  });
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