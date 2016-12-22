const BrowserKlass = function(driver){
  this.driver = driver;
  this.type = 'browser-klass';
  this.locked = false;
  this.healthy = true;
};

BrowserKlass.prototype.lock = function(){};

BrowserKlass.prototype.unlock = function(){};

module.exports = BrowserKlass;