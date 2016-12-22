const Browser = require('../browser');
const webdriverStub = require('./stubs/webdriverStub');
const assert = require('assert');
describe('Browser', () => {
  describe('#getSessionId', () => {

    describe('getting session from webdriver', () =>{
      
      it('gets the sessionId', () => {  
        const d = new webdriverStub.WebdriverKlass()
        d.getSession = () => Promise.resolve({
          getId: () => 78910
        });
        const b = new Browser(d);
        return b.getSessionId()
        .then( sessionId => {
          assert.equal(sessionId, 78910);
        });
      });


    })

    describe('unable to get session from webdriver', () => {
      it('rejects with an error', () => {  
        const d = new webdriverStub.WebdriverKlass()
        d.getSession = () => Promise.reject('could not get session');
        const b = new Browser(d);
        return b.getSessionId()
        .then( () => {
          assert(false);
        },
        () => assert(true));
      });
    });

  });

  describe('#lock', () => {

    var b;

    before( () => {
      d = {};
      d.getSession = () => Promise.resolve();
      b = new Browser(d);
    });

    it('sets the locked property to true', () => {
      b.lock();
      assert.equal(b.locked, true);
    });
  });

  describe('#unlock', () => {

    var b;

    before( () => {
      d = {};
      d.getSession = () => Promise.resolve();
      b = new Browser(d);
    });

    it('sets the locked property to true', () => {
      b.unlock();
      assert.equal(b.locked, false);
    });
  });

});