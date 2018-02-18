import { Client } from 'node-rest-client'
import * as config from './CONFIG.json'; // don't worry about the 'cannot find the module' error

// the next constant is to protect the CPU against too many parallels tries,
// that would put some heavy workload on the CPU
const MAX_PARALLEL_TRIES_WATCHDOG = 9;


const client: Client = new Client();
client.registerMethod("pingAPI", config.API.URL, "GET");


if (config.RUN_FOREVER.ACTIVATED) {
    setInterval(_main, config.RUN_FOREVER.DELAY);
} else {
    _main();
}


// todo : fix this >>
// Error: getaddrinfo ENOTFOUND apis.advizeo.io apis.advizeo.io:443
// when the address is not reachable, code works if url (on a DNS point of view) exists
function _main(){

    let isAlertTriggered: boolean = false;
    let test_failed: boolean = true;
    let failed_test_counter: number = 0;

    _checkConfigParams();

    _checkApi()
        .then(promisesResponses => {

         for(let i = 0; i < promisesResponses.length; i++){
             if(promisesResponses[i] === true)
                 failed_test_counter++;
         }

         test_failed = failed_test_counter > config.ERRORS.MAX_FAILED_BEFORE_ALERT;

         if(test_failed){
             log("__-- OFFLINE --__");
             setOffAlerts();
         } else {
             log("..:: ONLINE ::..");
             resetAlerts();
         }
     })
     .catch(err => {
         log("error :: ", err);
     });

}

async function _checkApi(){

    const promises:Promise<any>[] = [];

    for(let i = 0; i < config.PARALLEL_TRIES; i++){
        promises.push(isAPIdead());
    }
    return await Promise.all(promises);
}


// check if the API is still alive
function isAPIdead(): Promise<boolean> {


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

    return new Promise((resolve, reject) => {

/*
        client.methods.pingAPI(function (data, response) {
            // log(">>>>> data :: ", data);
            // log(">>>>> response :: ", response);

            if (data == null)
                reject();
            else if(response.statusCode === config.API.EXPECTED_STATUS_CODE ||
                    data.response === config.API.EXPECTED_RESPONSE )
                resolve(false);
            else
                resolve(true);
        });*/

        try{

            client.get(
                config.API.URL,
                args,
                (data, response) => {
                    if(data != null &&
                        data.response === config.API.EXPECTED_RESPONSE ||
                        response.statusCode === config.API.EXPECTED_STATUS_CODE )
                        resolve(false);
                    else
                        resolve(true);
                }
            );

            client.on('requestTimeout', function (req) {
                log('request has expired ');
                req.abort();
                reject();
            });

            //it's usefull to handle request errors to avoid, for example, socket hang up errors on request timeouts
            client.on('error', function (err) {
                log('request error');
                reject();
            });
        } catch(err) {
            log("in catch :: ", err);
            reject();
        }
    });
}

// set off all the alerts (console, rocketChat, GPIO...)
function setOffAlerts(){

}
// reset all the alerts (console, rocketChat, GPIO...)
function resetAlerts(){

}



function _checkConfigParams(){

    if(config.PARALLEL_TRIES > MAX_PARALLEL_TRIES_WATCHDOG){
        console.error("ERROR :: ");
        console.error("");
        console.error("Your MAX_FAILED_BEFORE_ALERT value is too big,");
        console.error("it will put too much heavy workload on your CPU.\r\n");
        console.error("It's max value should be =< ", config.PARALLEL_TRIES);
        console.error("You can change this in the CONFIG.json file.");
        return;
    }

    if(config.ERRORS.MAX_FAILED_BEFORE_ALERT > config.PARALLEL_TRIES){
        console.error("ERROR :: ");
        console.error("");
        console.error("You must set the MAX_FAILED_BEFORE_ALERT");
        console.error("lower or equal to PARALLEL_TRIES\r\n");
        console.error("The PARALLEL_TRIES set in the CONFIG.json :: ", config.PARALLEL_TRIES);
        console.error("The ERRORS.MAX_FAILED_BEFORE_ALERT set in the CONFIG.json :: ", config.ERRORS.MAX_FAILED_BEFORE_ALERT);
        return;
    }
}

// handle logging
function log(...args){
    if(config.DEBUG_MODE){
        console.log.apply(this, arguments);
    }
}