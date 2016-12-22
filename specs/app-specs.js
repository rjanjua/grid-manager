const expect = require('unexpected');

const app = require('../index.js');
const Client = app.Client;

//new app.Server("http://localhost:4444/wd/hub").start();


function pending() {
    expect('test', 'to be', 'pending');
}

describe.skip('browser-starter', () => {
    
    it('should start a browser in the grid', () => {
        const gm = new Client("http://localhost:9876");
        const startAndClose = () => {
            var session = null;
            return gm.startNewSession()
            .then( () => {
                return gm.getSession();
            }).then( () => {
                return gm.getSession();
            })
            .then( (sesh) => {
                console.log(sesh.toString());
                session = sesh;
                return gm.releaseSession(sesh)
            })
            .then( () => {
                console.log(session)
                return gm.closeSession(session)
            });
        }

        return startAndClose();
        
    })

    it('should start and release a browser', () => {
        const gm = new Client("http://localhost:9876");
        const startAndClose = () => {
            var session = null;
            return gm.startNewSession()
            .then( () => {
                return gm.getSession();
            })
            .then( (sesh) => {
                console.log(sesh.toString());
                session = sesh;
                return gm.releaseSession(sesh)
            })
            .then( () => {
                console.log(session)
                return gm.closeSession(session)
            });
        }

        return startAndClose();

    })

    it('should shut down all browsers that it started',  () =>{
        pending();
    })

})
