const winston = require('winston');
winston.add(winston.transports.File, { filename: 'somefile.log' });


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
    
    winston.log('info', 'started new session', browser.sessionId);
    
    return browser;
  });

}

BrowserStore.prototype.closeSession = function(sessionId) {
  this.browsers = this.browsers.filter( (b) => b.sessionId != sessionId);

  const driver = getDriver(this.gridUrl, sessionId);

  return driver.quit().then( () => {
    winston.log('info', 'closing browser', browser.sessionId);
    return Promise.resolve();   
  }).catch(() => {
    winston.log('warn', 'could not close browser', browser.sessionId);
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

  winston.log('verbose', 'getting available sessions');
  var browser = this.getAvailable();

  return new Promise( (resolve, reject) => {
    if (browser == undefined){
      winston.log('warn', 'could not find available session, trying again after 5 seconds');
      setTimeout( () => {
        browser = this.getAvailable();
        if (browser == undefined){
          winston.log('warn', 'no available session after 5 seconds');
          reject();
        } else{
          winston.log('info', 'returning browser ', browser.sessionId)
          resolve(browser);
        }
      }, 5000)
    } else{
      winston.log('info','returning browser ', browser.sessionId);
      resolve(browser);
    }
  })
  .then( (b) => {
    winston.log('verbose', 'locking browser ', browser.sessionId);
    b.lock();
    return b.sessionId;
  })


}

BrowserStore.prototype.resetSession = function() {
    return this.closeSession(sessionId)
    .then( () => this.startSession());
}

BrowserStore.prototype.releaseSession = function(sessionId){
  var browser =  this.browsers.find( (b) => b.sessionId == sessionId);

  winston.log('info', 'releasing session: ', {session: sessionId});

  const driver = getDriver(this.gridUrl, sessionId);

  return driver.getCurrentUrl()
  .then(null, (err) => {

    winston.log('error', 'Could not reach session', {
      session: sessionId, 
      error: err
    });
    
    if (browser != undefined){
      winston.log('warn', 'browser cannot be found', {session: sessionId.toString()})
      return this.resetSession(browser.sessionId);
    }
    
  })
  .then( () => {
    if (browser != undefined){
      winston.log('verbose', 'unlocking browser with session ', sessionId)
      Promise.resolve(browser.unlock());
    } else {
       Promise.resolve("browser session to release cannot be found");
    }
  });

}

module.exports = BrowserStore;