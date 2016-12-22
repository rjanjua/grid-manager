const assert = require('assert');

const sinon = require('sinon');
const proxyquire = require('proxyquire');
const webdriverStub = require('./stubs/webDriverStub');
const wdHttpStub = { };
const browserStub = require('./stubs/browserStub');

const BrowserStore = proxyquire('../browser-store', {
  'selenium-webdriver': webdriverStub,
  'selenium-webdriver/http': wdHttpStub,
  './browser': browserStub
});


describe('Browser Store', () => {

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
      webdriverStub.WebDriverKlass.prototype.quit = webdriverStub.WebDriverKlass.prototype.quitResolve;
      spy = sinon.spy(webdriverStub.WebDriverKlass.prototype, 'quit');

      return bs.startSession()
      .then( b => {
          b.sessionId = 1;
      })
      .then( () => {
          return bs.startSession();
      })
      .then( b => {
          b.sessionId = 2;
      })
      .then( () => {
          return bs.closeSession(1);
      });
    });

    it('removes a browser from the browser store', () => {
      assert.equal(bs.browsers.length, 1);
    });

    it('open browsers are still in the browsers list', () => {
      assert.equal(bs.browsers[0].sessionId, 2);
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
      webdriverStub.WebDriverKlass.prototype.quit = webdriverStub.WebDriverKlass.prototype.quitReject;

      session = bs.startSession()
      .then( b => {
          b.sessionId = 1;
      })
      .then( () => {
          return bs.startSession();
      })
      .then( b => {
          b.sessionId = 2;
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

  describe('#_removeBrowserFromStore', () => {
    
    beforeEach( () => {
      bs = new BrowserStore('http://this-is-a-test-01010101.com');
      return bs.startSession()
      .then( b => {
        b.sessionId = 1;
      });
    });

    it('throws an error when the browser does not exist', () => {
      assert.throws( () => bs._removeBrowserFromStore(10), Error);
    });

    it('removes a browser', () => {
      bs._removeBrowserFromStore(1);
      assert.equal(bs.browsers.length, 0);
    });
    
  })

  describe('#getSession', () => {
    
    describe('when there is a browser available', () => {
      var session;
      var spy;

      beforeEach( () => {
        spy = sinon.spy(browserStub.prototype, 'lock');
        bs = new BrowserStore('http://this-is-a-test-01010101.com');
        session = bs.startSession()
        .then( b => {
          b.sessionId = 12345;
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
          b.sessionId = 12345;
          return b;
        });
        return session;
      });

      afterEach( () => spy.restore());

      it('unlocks the browser', () => {
        return session
        .then( () => bs.releaseSession(12345))
        .then( () => {
          const b = bs.browsers.find( b => b.sessionId == 12345);
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
          b.sessionId = 12345;
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


});
