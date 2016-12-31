const assert = require('assert');
const request = require('supertest');
const Server = require('../app.js');
const server = new Server('http://localhost:4444/wd/hub');

server.start();

const agent = request.agent(server.app);

function pending() {
  assert();
}

 function hasSessionIdKey(res) {
    if (!('sessionId' in res.body)) throw new Error("missing sessionId key");
  }

describe('browser-starter', () => {
    
  it('should start and release a browser', (done) => { 
    var sessionId;

    const get = () => { 
      agent
      .get('/get')
      .expect( (res) => {
        sessionId = res.body.sessionId;
      })
      .expect(hasSessionIdKey)
      .expect(200, release);
    };
    
    const release = () => { 
      setTimeout( () => {
        agent
        .post('/release/' + sessionId)
        .expect(200, close)
      }, 500);
    };

    const close = () => {
      agent
      .post('/close/' + sessionId)
      .expect(200, done);
    };

    agent.post('/new')
         .expect(200, get);

  })


})
