const winston_ = require('winston');
const request = require('superagent');
const _ = require('lodash');

const winston = new (winston_.Logger)({
  transports: [
    new (winston_.transports.File)({ filename: 'somefile.log' })
  ]
});


const webdriver = require('selenium-webdriver');
const wdHttp = require('selenium-webdriver/http')

const wdClient = wdHttp.HttpClient;
const wdExecutor = wdHttp.Executor;
const WebDriver = webdriver.WebDriver;

const Browser = require('./browser');

const BrowserStore = function(gridUrl){
  this.browsers = [];
  this.gridUrl = gridUrl + "/wd/hub"; 
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
  
  var session;

  return driver.getSession().then(s => {
    const browser = this._addBrowserToStore(s);
    return browser;
  }); 
}

BrowserStore.prototype._addBrowserToStore = function(session){
    const browser = new Browser(session);
    this.browsers.push(browser);
    winston.log('info', 'started new session', browser._sessionId);
    return browser;
}

BrowserStore.prototype._removeBrowserFromStore = function(sessionId){
  const browser = this.findSession(sessionId)
  if (browser == undefined){
    throw Error('could not find browser to remove with sessionId: ' + sessionId);
  }

  const removableIndex = this.browsers.map( b => b._sessionId).indexOf(sessionId);
  this.browsers.splice(removableIndex, 1);  
}



BrowserStore.prototype.closeSession = function(sessionId) {
  const driver = getDriver(this.gridUrl, sessionId);

  return driver.quit().then( () => {
    winston.log('info', 'closing browser', sessionId);
    this._removeBrowserFromStore(sessionId); 
  })
}

BrowserStore.prototype.getAvailable = function(){
    return this.browsers.find( (b) => b.locked == false);
}

BrowserStore.prototype.getSession = function(){
  winston.log('verbose', 'getting available sessions');
  var browser = this.getAvailable();

  return new Promise( (resolve, reject) => {
    if (browser == undefined){
      winston.log('warn', 'could not find available session', this.browsers);
      reject('no browser available');
    } else{
      winston.log('info','returning browser ', browser._sessionId);
      browser.lock();
      resolve(browser._sessionId);
    }
  });
}

BrowserStore.prototype.getSessionList = function() {
  return this.browsers.map( b => b._sessionId);
}

BrowserStore.prototype.resetSession = function(sessionId) {
    return this.closeSession(sessionId)
    .then( () => this.startSession(), 
          (err) => this.startSession());
}

BrowserStore.prototype.findSession = function(sessionId){
  return this.browsers.find( b => b._sessionId == sessionId);
}

BrowserStore.prototype.releaseSession = function(sessionId){
  winston.log('info', 'releasing session: ', {session: sessionId});
  
  const browser =  this.findSession(sessionId);

  if(browser == undefined){
    winston.log('info', "browser session to release cannot be found", sessionId);
    return Promise.reject("browser with session[" + sessionId + "] does not exist"); 
  } else {      
    winston.log('info', 'unlocking browser with session ', browser._sessionId);
    browser.unlock();
    return Promise.resolve(browser._sessionId)
  }
}

BrowserStore.prototype.init = function(){
  activeSessions = this.getActiveSessions(this.gridUrl);

  return activeSessions.then( (sessions) => {
    sessions.forEach( s => {
      if(s != null && s != undefined){
        this._addBrowserToStore(s);
      }
    });
  });
}

BrowserStore.prototype.removeInactiveSessions = function(){
  return this.getActiveSessions()
  .then( sessions => {
    
    const currentSessions = this.browsers.map( b => b._sessionId);
    const activeSessions = sessions.map( s => s.id_ );

    const inactiveSessions = _.difference(currentSessions, activeSessions);

    inactiveSessions.forEach(s => {
      this._removeBrowserFromStore(s);
    });
  });
}

BrowserStore.prototype.getActiveSessions = function(){
  var messageFromGrid;

  return new Promise( (resolve, reject) => {
    request
    .get(this.gridUrl + "/status")
    .end( (err, res) => {
      messageFromGrid = res.body.value.message;
      const sessions = parseSessions(messageFromGrid);
      resolve(sessions);
    });
  })
}

function parseSessions(message) {
  const startSessionsIndex = message.lastIndexOf('[');
  const endSessionsIndex = message.lastIndexOf(']');

  const sessionsString = message.substring(startSessionsIndex + 1, endSessionsIndex);
  const sessionsDataArray = sessionsString.split(',');
  const sessionsArray = sessionsDataArray.map( data => {
    const sessionId = data.trim().split(' ')[2];
    
    return sessionId != undefined ? {id_ : sessionId} : undefined;
  });
  return sessionsArray.filter(s => s != undefined);
}


module.exports = BrowserStore;