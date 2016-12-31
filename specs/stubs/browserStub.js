const BrowserKlass = function(sessionId){
  this.type = 'browser-klass';
  this.locked = false;
  this._sessionId = sessionId;
};

BrowserKlass.prototype.lock = function(){};

BrowserKlass.prototype.unlock = function(){};

module.exports = BrowserKlass;