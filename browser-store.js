const webdriver = require('selenium-webdriver');
const wdHttp = require('selenium-webdriver/http')

const wdClient = wdHttp.HttpClient;
const wdExecutor = wdHttp.Executor;
const WebDriver = webdriver.WebDriver;

const Browser = require('./browser');

const BrowserStore = function(gridUrl){
  this.browsers = [];
  this.gridUrl = gridUrl; 
};

BrowserStore.prototype.startSession = function(){
  const driver = new webdriver.Builder()
    .usingServer(this.gridUrl)
    .forBrowser('chrome')
    .build();

  return driver.then( () => {
    const browser = new Browser(driver);
    this.browsers.push(browser);
    return browser;
  });

}

BrowserStore.prototype.closeSession = function(sessionId) {
  this.browsers = this.browsers.filter( (b) => b.sessionId != sessionId);
  
  const client = new wdClient(this.gridUrl);
  const executor = new wdExecutor(client);

  const driver = WebDriver.attachToSession(executor, sessionId);

  return driver.quit().then( () => {
    return Promise.resolve();   
  }).catch(() => {
   return Promise.reject();   
  });
}

Browser.prototype.getSessionIds = function(){
  const sessionIds = browsers.map( b => {
    return b.getSessionId();
  });

  return Promise.all(sessionIds);
}

BrowserStore.prototype.getSession = function(){
  const browser =  this.browsers.find( (b) => b.locked == false);
  browser.lock();
  return browser.getSessionId();
}

BrowserStore.prototype.releaseSession = function(sessionId){
  var browser =  this.browsers.find( (b) => b.sessionId == sessionId);

  browser.unlock();
}

module.exports = BrowserStore;