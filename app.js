const express = require('express');
const BrowserStore = require('./browser-store');
const app = express();

const browserStore = new BrowserStore();

app.post('/new', (req, res) => {

    browserStore.startSession()
    .then((b) => b.getSessionId())
    .then( (id) => res.status(200).send());

});

app.post('/close/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    browserStore.closeSession(sessionId)
    .then( () => res.status(200).json({success: true}))
    .catch( () => res.status(404).json({success: false}));
});

app.get('/get', (req, res) => { 
  browserStore.getSession()
  .then((sessionId) => {
    res.status(200).json(sessionId);
  });
});

app.post('/release/:sessionId', (req, res) => { 
  const sessionId = req.params.sessionId;
  browserStore.releaseSession(sessionId);
  res.status(200).send();
});


app.listen(9876, function () {
  console.log('Example app listening on port 9876!')
});