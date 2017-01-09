const express = require('express');
const request = require('superagent');

const BrowserStore = require('./browser-store');

const Server = function(gridUrl) {
  this.browserStore = new BrowserStore(gridUrl);
  this.gridUrl = gridUrl;
}

Server.prototype.bootstrap = function() {
    this.app = express();

  this.app.post('/new', (req, res) => {
      console.log("creating new session")
      this.browserStore.startSession()
      .then((b) => b._sessionId)
      .then( (id) => res.status(200).json({id: id}));

  });

  this.app.post('/close/:sessionId', (req, res) => {
      const sessionId = req.params.sessionId;
      console.log("closing  session: ", sessionId);

      this.browserStore.closeSession(sessionId)
      .then( () => res.status(200).json({success: true}))
      .catch( () => res.status(404).json({success: false}));
  });

  this.app.get('/get', (req, res) => { 

    const getSession = () => {
      return this.browserStore.fillSessionPool()
      .then( () => this.browserStore.getSession())
      .then((sessionId) => {
        res.status(200).json({sessionId: sessionId});
      })
    };

    getSession().catch( (err) => {
      setTimeout( () => {
        getSession().catch( () => {
          console.log("could not find session");
          res.status(404).json({err: err});
        });
      }, 10000);
    });
  });

  this.app.post('/release/:sessionId', (req, res) => { 
    
    const sessionId = req.params.sessionId;
    console.log("release  session: ", sessionId);

    this.browserStore.releaseSession(sessionId)
    .then( () => {
      res.status(200).send();
    });
  });

  this.app.get('/sessions', (req, res) => {
    this.browserStore.removeInactiveSessions()
    .then ( () => {
      const sessions = this.browserStore.getSessionList();

      const responseBody = { sessions: sessions };

      res.status(200).json(responseBody);
    });
  });

  this.app.post('/startSessions/:numberOfSessions', (req, res) => {
    const numberOfSessions = parseInt(req.params.numberOfSessions);
    this.browserStore.setSessionPoolLimit(numberOfSessions);
    this.browserStore.fillSessionPool()
    .then( (sessions) => {
      res.status(200).json({ sessions: sessions });
    });
  });

  this.server = this.app.listen(9876, function () {
    console.log('grid-manager listening on port 9876!')
  });
}

Server.prototype.close = function(cb){
  this.server.close(cb);
}

Server.prototype.start = function() {

  activeSessions = this.browserStore.getActiveSessions();

  return this.browserStore.init()
  .then( () => this.bootstrap());
}

module.exports = Server;