const expect = require('unexpected');

function pending() {
    expect('test', 'to be', 'pending');
}

describe('browser-starter', () => {
    
    it('should start a browser in the grid', () => {
        pending();
    })

    it('should start multiple browsers in the grid', () => {
        pending();
    })

    it('should shut down all browsers that it started',  () =>{
        pending();
    })

})

describe('browser-retriever', () => {
    it('returns and locks a browser');
    it('releases and unlocks a browser');
})

/*
start browser from client

get, lock browser
run tests 
release browser

close browser
 */