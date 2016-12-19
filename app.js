const express = require('express');
const BrowserStore = require('./browser-store');

const Server = function(gridUrl) {
  this.browserStore = new BrowserStore(gridUrl);
}

Server.prototype.start = function() {

  const app = express();

  app.post('/new', (req, res) => {
      console.log("creating new session")
      this.browserStore.startSession()
      .then((b) => b.getSessionId())
      .then( (id) => res.status(200).json({id: id}));

  });

  app.post('/close/:sessionId', (req, res) => {
      const sessionId = req.params.sessionId;
      console.log("closing  session: ", sessionId);

      this.browserStore.closeSession(sessionId)
      .then( () => res.status(200).json({success: true}))
      .catch( () => res.status(404).json({success: false}));
  });

  app.get('/get', (req, res) => { 
    this.browserStore.getSession()
    .then((sessionId) => {
          console.log("get  session: ", sessionId);

      res.status(200).json(sessionId);
    });
  });

  app.post('/release/:sessionId', (req, res) => { 
    
    const sessionId = req.params.sessionId;
        console.log("release  session: ", sessionId);

    this.browserStore.releaseSession(sessionId);
    res.status(200).send();
  });

  app.listen(9876, function () {
    console.log('Example app listening on port 9876!')
  });
}

module.exports = Server;