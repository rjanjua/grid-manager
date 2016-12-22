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
  return Promise.resolve( new WebDriverKlass(-1));
}

WebDriverKlass = function(sessionId){
  this.type = 'webdriver';
  this.sessionId = sessionId;
  this.driver = 'test';
}

WebDriverKlass.prototype.quitResolve = function(){
  return Promise.resolve('quit driver');
}

WebDriverKlass.prototype.quitReject = function(){
  return Promise.reject('did not quit driver');
}

WebDriverKlass.prototype.getCurrentUrl = function(){
  return Promise.resolve('http://test.com');
}

webdriverStub.WebDriver = {
  attachToSession:  (executor, sessionId) => {
    return new WebDriverKlass(sessionId);
  }
};

webdriverStub.WebDriverKlass = WebDriverKlass;
webdriverStub.Builder = BuilderKlass;

module.exports = webdriverStub;