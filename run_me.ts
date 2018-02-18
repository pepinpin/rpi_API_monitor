import { Client } from 'node-rest-client'
import * as config from "./CONFIG.json"; // don't worry about the 'cannot find the module' error

// set this to false to avoid logs
// and run in 'production' mode
const client: Client = new Client();

if (config.RUN_FOREVER.ACTIVATED) {
    setInterval(_main, config.RUN_FOREVER.DELAY);
} else {
    _main();
}

function _main(){

    let test_failed: boolean = true;
    let failed_test_counter: number = 0;
    let isAlertTriggered: boolean = false;

    while( test_failed ){
        if( isAPIalive() ){
            failed_test_counter = 0;
            log('..:: ONLINE ::..');

            if(isAlertTriggered){
                resetAlerts();
            }
        }
    }
}


// check if the API is still alive
function isAPIalive(): boolean {

    let isAlive: boolean = false;

    // request and response additional configuration
    const args = {
        requestConfig: {
            timeout: 1000, //request timeout in milliseconds
            noDelay: true, //Enable/disable the Nagle algorithm
            keepAlive: true, //Enable/disable keep-alive functionalityidle socket.
            keepAliveDelay: 1000 //and optionally set the initial delay before the first keepalive probe is sent
        },
        responseConfig: {
            timeout: 1000 //response timeout
        }
    };

    const req = client.get(
        config.API.URL,
        args,
        (data, response) => {
            log(data);
            if(data.response = config.API.EXPECTED_RESPONSE)
            isAlive = true;
        });

    req.on('requestTimeout', function (req) {
        log('request has expired ');
        req.abort();
        isAlive = false;
    });

    req.on('responseTimeout', function (res) {
        log('response has expired');
        isAlive = false;
    });

    //it's usefull to handle request errors to avoid, for example, socket hang up errors on request timeouts
    req.on('error', function (err) {
        log('request error');
        isAlive = false;
    });

    return isAlive;
}

// reset all the alerts (console, rocketChat, GPIO...)
function resetAlerts(){

}

// handle logging
function log(...args){

    if(config.DEBUG_MODE){
        console.log.apply(this, arguments);
    }
}