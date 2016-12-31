const Browser = require('../browser');
const webdriverStub = require('./stubs/webdriverStub');
const assert = require('assert');
describe('Browser', () => {

  describe('#lock', () => {

    var b;


    before( () => {
      d = {};
      s = {
        id_: 'an id',
        caps_: 'some caps_'
      }
      b = new Browser(d, s);
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
      s = {
        id_: 'an id',
        caps_: 'some caps_'
      }
      b = new Browser(d, s);
    });

    it('sets the locked property to true', () => {
      b.unlock();
      assert.equal(b.locked, false);
    });
  });

});