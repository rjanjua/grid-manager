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

function getDriver(gridUrl, sessionId){
  const client = new wdClient(gridUrl);
  const executor = new wdExecutor(client);
  return WebDriver.attachToSession(executor, sessionId); 
}

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

  const driver = getDriver(this.gridUrl, sessionId);

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
  const driver = getDriver(this.gridUrl, sessionId);

  driver.getCurrentUrl().then(null, (err) => {
    this.closeSession(sessionId);
    this.startSession();
    console.log(err);
  });;

  if (browser === undefined){
      this.closeSession(sessionId);
      this.startSession();
  } else{
      browser.unlock();
  }
}

module.exports = BrowserStore;