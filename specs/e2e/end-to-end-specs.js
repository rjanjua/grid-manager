const assert = require('assert');
const request = require('supertest');
const Server = require('../../app.js');


function hasSessionIdKey(res) {
  if (!('sessionId' in res.body)) throw new Error("missing sessionId key");
}


const webdriver = require('selenium-webdriver');
const wdHttp = require('selenium-webdriver/http');
const wdClient = wdHttp.HttpClient;
const wdExecutor = wdHttp.Executor;
const WebDriver = webdriver.WebDriver;

function getDriver(gridUrl, sessionId){
  const client = new wdClient(gridUrl);
  const executor = new wdExecutor(client);

  return WebDriver.attachToSession(executor, sessionId); 
}

function closeSession(url, sessionId){
  const driver = getDriver(url, sessionId);
  return driver.quit();
}


describe('grid-manager', () => {
  
  beforeEach( () => {

    server = new Server('http://localhost:4444');
    return server.start()
    .then( () => {
      agent = request.agent(server.app);
    });
    
  })

  afterEach( () => {
    server.close();
  })


  it('should start, get, release, and close a browser', (done) => { 
    var sessionId;

    const get = () => { 
      agent
      .get('/get')
      .expect( (res) => {
        sessionId = res.body.sessionId;
        console.log(sessionId);
      })
      .expect(hasSessionIdKey)
      .expect(200, release);
    };
    
    const release = () => { 
      setTimeout( () => {
        agent
        .post('/release/' + sessionId)
        .expect(200, close)
      }, 1000);
    };

    const close = () => {
      agent
      .post('/close/' + sessionId)
      .expect(200, done);
    };

    agent.post('/new')
         .expect(200, get);

  })

  describe('when some external problem causes a browser to become unresponsive', () => {
    // so far, the only time this has been an issue is when there is some alert that needs closing
    // it could also include instances when the browser has crashed
  });

  describe('when some external problem causes a browser to become closed', () => {
    // have only seen this when selenium decides to close a browser due to a timeout
    // or when selenium closes a browser for some other reason

    it('removes the closed browser from the browser-store', (done) => {
      var sessionId;

      const get = () => { 
        agent
        .get('/get')
        .expect(404)
        .end( (err, res) => {
          assert.equal(res.body.err, 'no browser available');
          done();
        });
      };
      
      const closeOpenedSession = () => {
        agent
        .get('/sessions')
        .end( (err, res) => {
          const sessionId = res.body.sessions[0];
          closeSession('http://localhost:4444/wd/hub', sessionId)
          .then(get);
        });
      }

      const delayCloseSession = () => {
        setTimeout(closeOpenedSession, 500);
      }

      agent
      .post('/new')
      .expect(200, delayCloseSession);
    })

    it('does not try to get the closed browser', () => {

    })
  });

});