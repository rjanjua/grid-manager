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
    this.browserStore.removeInactiveSessions()
    .then( () => this.browserStore.getSession())
    .then((sessionId) => {
      res.status(200).json({sessionId: sessionId});
    }).catch( (err) => {
      console.log("could not find session");
      res.status(404).json({err: err});
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
    const sessions = this.browserStore.getSessionList();

    const responseBody = { sessions: sessions };

    res.status(200).json(responseBody);
  });

  this.server = this.app.listen(9876, function () {
    console.log('grid-manager listening on port 9876!')
  });
}

Server.prototype.close = function(){
  this.server.close();
}

Server.prototype.start = function() {

  activeSessions = this.browserStore.getActiveSessions();

  return this.browserStore.init()
  .then( () => this.bootstrap());
}

module.exports = Server;