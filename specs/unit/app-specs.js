const assert = require('assert');
const request = require('supertest');
const nock = require('nock');
const Server = require('../../app.js');

function pending() {
  assert();
}

describe('browser-starter', () => {
  
  var server;
  var agent;

  beforeEach( () => {

    nock('http://localhost:4444')
    .get('/wd/hub/status')
    .times(100)
    .reply(200, {
      "status": 13,
      "value": {
        "message": "Session [(null externalkey)] not available and is not among the last 1000 terminated sessions.\nActive sessions are[ext. key ghi-789, ext. key def-456, ext. key abc-123]"
      }
    });

    server = new Server('http://localhost:4444');
    return server.start()
    .then( () => {
      agent = request.agent(server.app);
    });
  })

  afterEach( () => {
    nock.cleanAll();
    server.close();
  })

  it('should add any currently running sessions to the store', (done) => {

    agent
    .get('/sessions')
    .expect(200)
    .end( (err,res) => {
      const sessions = res.body.sessions;
      assert.equal(sessions.length, 3);
      assert(sessions.includes('abc-123'), 'does not have session abc-123');
      assert(sessions.includes('def-456'), 'does not have session def-456');
      assert(sessions.includes('ghi-789'), 'does not have session ghi-789');
      done();
    });
  });

})
