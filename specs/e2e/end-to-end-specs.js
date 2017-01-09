const assert = require('assert');
const request = require('supertest');
const Server = require('../../lib').Server;
const selenium = require('selenium-standalone');

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

const hubArgs = {};
hubArgs.seleniumArgs = ['-role', 'hub'];

const nodeArgs = {};
nodeArgs.seleniumArgs = ['-role', 'node', '-hub', 'http://localhost:4444/wd/hub'];
describe('grid-manager', () => {

  var hub;
  var node;

  function startHub(done) {
    selenium.start(hubArgs, (err, cp) => {
      hub = cp;
      done();
    });
  }

  before( done => {
    selenium.install({
      drivers: {
        chrome: {
          version: '2.23',
          arch: process.arch,
          baseURL: 'https://chromedriver.storage.googleapis.com'
        }
      }
    }, (err) => {
      if(err)
        done(err)
      else{
        startHub(done);
      }
    });
  });

  beforeEach( (done) => {

    selenium.start(nodeArgs, (err, cp) => {
      node = cp;

      server = new Server('http://localhost:4444');
      return server.start()
      .then( () => {
        agent = request.agent(server.app);
        done();
      });

    });
    
  })

  afterEach( done => {
    node.kill('SIGINT');
    server.close(done);
  })

  after( () => {
    hub.kill('SIGINT');
  })

  it('should start X number of sessions, and maintain that number despite setbacks', (done) => {

    const getAvailable = () => {
      agent
      .get('/get')
      .end( (err, res) => {
        setTimeout( () => checkNumberOfSessions(3, done), 500);
      })
    }

    const checkNumberOfSessions = (n, cb) => {
      agent
      .get('/sessions')
      .end( (err, res) => {
        if(err){
          assert(false)
          done(err);
        }
        else{
          console.log(res.body);
          assert.equal(res.body.sessions.length, n, 'should have ' + n +' sessions');
          cb();
        }
      })
    }

    const closeOpenedSession = () => {
      agent
      .get('/sessions')
      .end( (err, res) => {
        const sessionId = res.body.sessions[0];
        closeSession('http://localhost:4444/wd/hub', sessionId)
        .then(() => {
          setTimeout( () => checkNumberOfSessions(2, getAvailable), 500);
        });
      });
    }

    const delayCloseSession = () => {
      setTimeout(closeOpenedSession, 500);
    }

    agent
    .post('/startSessions/3')
    .expect(200)
    .end( (err, res) => {
      assert.equal(res.body.sessions.length, 3);
      delayCloseSession();
    })
  });

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
  });

  describe('when all browsers are in use', () => {

    it.only('waits 10 seconds to wait for a browser to become available', (done) => {

      const sessions = [];

      const get = (cb) => {
        agent
        .get('/get')
        .expect(200)
        .end( (err, res) => {
          sessions.push(res.body.sessionId);
        })
      };

      agent
      .post('/startSessions/5')
      .expect(200)
      .end( (err, res) => {
        get();
        get();
        get();
        get();
        get();
        setTimeout( () => assert.equal(res.body.sessions.length, 5), 500);
        setTimeout( () => agent
                          .get('/get')
                          .expect(200)
                          .end( (err, res) => {
                            console.log(err);
                            console.log(res.body);
                            assert.equal(res.body.sessionId, sessions[0]);
                            done()
                          }), 1000);
        
        setTimeout( () => agent
        .post('/release/' + sessions[0])
        .expect(200)
        .end( (err, res) => {

        }), 8500);

      });
    });
  });
});