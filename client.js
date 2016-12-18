const request = require('superagent');

const Client = function() {};

var startCount = 0;
var closeCount = 0;

Client.prototype.startNewSession = function(){
    return new Promise((resolve, reject) => { 
        request.post('http://localhost:9876/new')
        .end( (err, res) => {
            startCount = startCount + 1;
            resolve(true);
        });
    });
}


Client.prototype.getSession = function() {
    return new Promise((resolve, reject) => { 
        request.get('http://localhost:9876/get')
        .end( (err, res) => {
            resolve(res.body);
        });
    });
}

Client.prototype.releaseSession = function(sesh){
    return new Promise((resolve, reject) => { 
        request.post('http://localhost:9876/release/' + sesh)
        .end( (err, res) => {
            resolve();
        });
    });
}

Client.prototype.closeSession = function(sesh){
    return new Promise((resolve, reject) => {
        request.post('http://localhost:9876/close/' + sesh)
        .end( (err, res) => {
            closeCount = closeCount + 1;
            resolve({closed: true});
        });
    });
}

module.exports = Client;