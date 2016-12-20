const request = require('superagent');

const Client = function(gridManagerUrl) {
    this.gridManagerUrl = gridManagerUrl;
};

var startCount = 0;
var closeCount = 0;

Client.prototype.startNewSession = function(){
    return new Promise((resolve, reject) => { 
        request.post(this.gridManagerUrl + '/new')
        .end( (err, res) => {
            startCount = startCount + 1;
            resolve(res.body);
        });
    });
}


Client.prototype.getSession = function() {
    return new Promise((resolve, reject) => { 
        request.get(this.gridManagerUrl +  '/get')
        .end( (err, res) => {
            resolve(res.body);
        });
    });
}

Client.prototype.releaseSession = function(sesh){
    return new Promise((resolve, reject) => { 
        request.post(this.gridManagerUrl + '/release/' + sesh)
        .end( (err, res) => {
            resolve();
        });
    });
}

Client.prototype.closeSession = function(sesh){
    return new Promise((resolve, reject) => {
        request.post(this.gridManagerUrl + '/close/' + sesh.id)
        .end( (err, res) => {
            closeCount = closeCount + 1;
            resolve({closed: true});
        });
    });
}

module.exports = Client;