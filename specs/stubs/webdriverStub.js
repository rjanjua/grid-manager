const webdriverStub = {};

const BuilderKlass = function(){}

BuilderKlass.prototype.usingServer = function(server){
  this.server = server;
  return this;
}

BuilderKlass.prototype.forBrowser = function(url){
  this.gridUrl = url;
  return this;
}

BuilderKlass.prototype.build = function(){
  return new WebdriverKlass(-1);
}

WebdriverKlass = function(sessionId){
  this.type = 'webdriver';
  this.sessionId = sessionId;
  this.driver = 'test';
}

WebdriverKlass.prototype.quitResolve = function(){
  return Promise.resolve('quit driver');
}

WebdriverKlass.prototype.quitReject = function(){
  return Promise.reject('did not quit driver');
}

WebdriverKlass.prototype.getSession = function(){
  return Promise.resolve(1);
}

webdriverStub.WebDriver = {
  attachToSession:  (executor, sessionId) => {
    return new WebdriverKlass(sessionId);
  }
};

webdriverStub.WebdriverKlass = WebdriverKlass;
webdriverStub.Builder = BuilderKlass;

module.exports = webdriverStub;