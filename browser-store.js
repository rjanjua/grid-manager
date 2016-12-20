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

BrowserStore.prototype.getSessionIds = function(){
  const sessionIds = browsers.map( b => {
    return b.getSessionId();
  });

  return Promise.all(sessionIds);
}

BrowserStore.prototype.getAvailable = function(){
    return this.browsers.find( (b) => b.locked == false);
}

BrowserStore.prototype.getSession = function(){
  var browser = this.getAvailable();
  return new Promise( (resolve, reject) => {
    if (browser == undefined){
      setTimeout( () => {
        browser = this.getAvailable();
        if (browser == undefined){
          reject();
        } else{
          resolve(browser);
        }
      }, 5000)
    } else{
      resolve(browser);
    }
  })
  .then( (b) => {
    b.lock();
    return b.getSessionId();
  })


}

BrowserStore.prototype.releaseSession = function(sessionId){
  var browser =  this.browsers.find( (b) => b.sessionId == sessionId);

  browser.unlock();
}

module.exports = BrowserStore;