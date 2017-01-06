const assert = require('assert');
const nock = require('nock');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const webdriverStub = require('../stubs/webDriverStub');
const wdHttpStub = { };
const browserStub = require('../stubs/browserStub');

browserStub.prototype.getSessionId = function(){
    return this._sessionId;
}

const BrowserStore = proxyquire('../../lib/server/browser-store', {
  'selenium-webdriver': webdriverStub,
  'selenium-webdriver/http': wdHttpStub,
  './browser': browserStub
});

  const nockHubStatusWithMessage = (msg) => {
    nock('http://this-is-a-test-01010101.com')
    .get('/wd/hub/status')
    .times(100)
    .reply(200, {
      "status": 13,
      "value": {
        "message": msg
      }
    });
  }

describe('Browser Store', () => {

  describe('#_removeBrowserFromStore', () => {
    
    var bs;

    beforeEach( () => {
      bs = new BrowserStore('http://this-is-a-test-01010101.com');
      return bs.startSession()
      .then( b => {
        b._sessionId = 1;
      });
    });

    it('throws an error when the browser does not exist', () => {
      assert.throws( () => bs._removeBrowserFromStore(10), Error);
    });

    it('removes a browser', () => {
      bs._removeBrowserFromStore(1);
      assert.equal(bs.browsers.length, 0);
    });

    it('allows only one remove to the browsers list at a time', () => {
      const newSession =  (sId) =>  new browserStub(sId);

      for (var i = 2; i <= 10; i++){
        bs.browsers.push(newSession(i));
      }

      for (var i = 1; i <= 10; i++){
        bs._removeBrowserFromStore(i)
      }

      assert.equal(bs.browsers.length, 0);
      
    });

  })

  describe('#_addBrowserToStore', () => {
       
    var bs;

    beforeEach( () => {
      bs = new BrowserStore('http://this-is-a-test-01010101.com');
      return bs.startSession()
      .then( b => {
        b._sessionId = 1;
      });
    });

    it('allows only one write to the browsers list at a time', () => {
      const addPromise = (sId) => bs._addBrowserToStore(sId);
      const newSession =  (sId) =>  new browserStub(sId);
      const addAll = [];
      for (var i = 2; i < 1001; i++){
       addAll.push(addPromise(newSession(i)));
      }
      return Promise.all(addAll)
      .then( (browsers) => {
        assert.equal(bs.browsers.length, 1000)
      });
    });

    it('allows only one add or remove at a time', () => {
      const remove = (sId) => bs._removeBrowserFromStore(sId);
      const add = (sId) => bs._addBrowserToStore(sId);
      const newSession =  (sId) =>  new browserStub(sId);


      // add ten promises
      for (var i = 1; i <= 10; i++){
        add("first " + i);
      }

      // remove the first ten and add a second ten
      for (var i = 1; i <= 10; i++){
        add("second " + i);
        remove("first " + i);
      }

      // make sure first ten removed and second ten are the present browsers
      const sessions = bs.browsers.map( (b) => b._sessionId).slice(1);
      const hasFirst = sessions.filter( (s) => s.includes("first"));
      const hasSecond = sessions.filter( (s) => s.includes("second"));

      assert.equal(hasFirst.length, 0, 'all first browsers should be removed');
      assert.equal(hasSecond.length, 10, 'all second browsers should be added');

    });
    
  })

  describe('#startSession',  () => {
    
    var bs;
    var startSessionPromise;
    var buildSpy;

    before( () => {
      bs = new BrowserStore('http://this-is-a-test-01010101.com');
      buildSpy = sinon.spy(webdriverStub.Builder.prototype, 'build');
      startSessionPromise = bs.startSession();
      return startSessionPromise;
    });

    it('adds a browser to the browser store', () => {
      assert.equal(bs.browsers.length, 1);        
    });

    it('returns a browser instance', () => {
      return startSessionPromise.then( (b) => {
        assert.equal(b.type, 'browser-klass')
      });
    });

    it('starts one new session', () => {
      assert(buildSpy.calledOnce, 
            'webdriver.Builder.build() should be called once');
    });

    after( () => {
        buildSpy.restore();
    });

  });

  describe('#closeSession where driver.quit is successful', () => {
    var bs;
    var spy;
    before( () => {
      bs = new BrowserStore('http://this-is-a-test-01010101.com');
      webdriverStub.WebdriverKlass.prototype.quit = webdriverStub.WebdriverKlass.prototype.quitResolve;
      spy = sinon.spy(webdriverStub.WebdriverKlass.prototype, 'quit');

      return bs.startSession()
      .then( b => {
          b._sessionId = 1;
      })
      .then( () => {
          return bs.startSession();
      })
      .then( b => {
          b._sessionId = 2;
      })
      .then( () => {
          return bs.closeSession(1);
      });
    });

    it('removes a browser from the browser store', () => {
      assert.equal(bs.browsers.length, 1);
    });

    it('open browsers are still in the browsers list', () => {
      assert.equal(bs.browsers[0]._sessionId, 2);
    });

    it('closes the browser', () => {
      assert(spy.calledOnce);
    });

  });

  describe('#closeSession where driver.quit is unsuccessful', () => {
    var bs;
    var session;

    before( () => {
      bs = new BrowserStore('http://this-is-a-test-01010101.com');
      webdriverStub.WebdriverKlass.prototype.quit = webdriverStub.WebdriverKlass.prototype.quitReject;

      session = bs.startSession()
      .then( b => {
          b._sessionId = 1;
      })
      .then( () => {
          return bs.startSession();
      })
      .then( b => {
          b._sessionId = 2;
      });

      return session;
    });

    it('rejects with an error', () => {
      return session.then( () => {
        return bs.closeSession(1);
      })
      .then( () => {
        assert(false, 'should reject');
      })
      .catch( err => {
        assert(true, 'should reject');
      })
    });

  });

  describe('#getSession', () => {
    
    describe('when there is a browser available', () => {
      var session;
      var spy;

      beforeEach( () => {
        spy = sinon.spy(browserStub.prototype, 'lock');
        bs = new BrowserStore('http://this-is-a-test-01010101.com');
        session = bs.startSession()
        .then( b => {
          b._sessionId = 12345;
        })
        .then(() => bs.getSession());
        return session;
      });
        
      afterEach( () => spy.restore());
 
      it('should get an available session', () => {
        return session
        .then( (s) => {
            assert.equal(s, 12345);
         });
      });

      it('locks the session it just got', () => {
        return session.then( (s) => {
          assert(spy.calledOnce);
        });
      });

    })

    describe('when there is no browser available', () => {
      
      var bs;

      beforeEach( () => {
        bs = new BrowserStore('http://this-is-a-test-01010101.com');
      });

      it('rejects with an error when no browsers stored', () => {
        return bs.getSession()
        .then( 
        () => {
          assert(false);
        },
        () => {
          assert(true);
        });
      });

      it('rejects with an error when all browsers are locked', () => {
        bs.startSession()
        .then( b => {
          b.locked = true;
        })
        .then( () => bs.getSession())
        .then( s => {
          assert(false);
        }, 
        () => assert(true));
      });

    })

  });

  describe('#releaseSession', () => {
    
    describe('specified browser exists', () => {
      
      var session;
      var bs;
      var spy;

      beforeEach( () => {
        spy = sinon.spy(browserStub.prototype, 'unlock');
        bs = new BrowserStore('http://this-is-a-test-01010101.com');
        session = bs
        .startSession()
        .then( (b) => {
          b._sessionId = 12345;
          return b;
        });
        return session;
      });

      afterEach( () => spy.restore());

      it('unlocks the browser', () => {
        return session
        .then( () => bs.releaseSession(12345))
        .then( () => {
          const b = bs.browsers.find( b => b._sessionId == 12345);
          assert(spy.calledOnce);
        })
      });
      
      it('resolves the sessionId of the session it unlocked', () => {
        return session
        .then( () => bs.releaseSession(12345))
        .then( sessionId => {
          assert.equal(sessionId, 12345);
        })
      });

    });

    describe('specified browser does not exist', () => {
      
      var session;
      var bs;

      beforeEach( () => {
        bs = new BrowserStore('http://this-is-a-test-01010101.com');
        session = bs
        .startSession()
        .then( (b) => {
          b._sessionId = 12345;
          return b;
        });
        return session;
      });

      it('rejects with an error', () => {
        return session
        .then( () => bs.releaseSession(9999))
        .then( 
          () => assert(false),
          (err) => assert(true)
        );
      })

    });

  });

  describe('#getActiveSessions', () => {

    beforeEach( () => {
      bs = new BrowserStore('http://this-is-a-test-01010101.com');
    })

    afterEach( () => {
      nock.cleanAll();
    });

    it('returns all the active sessions', () => {
      nockHubStatusWithMessage("Session [(null externalkey)] not available and is not among the last 1000 terminated sessions.\nActive sessions are[ext. key ghi-789, ext. key def-456, ext. key abc-123]")
      return bs.getActiveSessions()
        .then(sessions => {
          assert.equal(sessions.length, 3);
          const hasNull = sessions.includes(null);
          assert(!hasNull, 'should not contain null');
        });
    });

    describe('when there are no active sessions', () => {

      it('does not add any active sessions', () => {

        nockHubStatusWithMessage("Session [(null externalkey)] not available and is not among the last 1000 terminated sessions.\nActive sessions are[]");
        return bs.getActiveSessions()
        .then(sessions => {
          assert.equal(sessions.length, 0);
        });

      });

    });

  });

  describe('#removeInactiveSessions', () => {

    beforeEach( () => {
      bs = new BrowserStore('http://this-is-a-test-01010101.com');
    })

    afterEach( () => {
      nock.cleanAll();
    });

    it('should remove sessions that exist in the browser list, but not active session list', () => {
      nockHubStatusWithMessage('abc abc [a a abc-123, b b bbb-222]');
      
      bs._addBrowserToStore('abc-123');
      bs._addBrowserToStore('bbb-222');
      bs._addBrowserToStore('ccc-333');

      bs.removeInactiveSessions()
      .then( () => {
        assert.equal(bs.browsers.length, 2)
      });
    });
  })

});
