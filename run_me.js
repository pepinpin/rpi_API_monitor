"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_rest_client_1 = require("node-rest-client");
var config = require("./CONFIG.json"); // don't worry about the 'cannot find the module' error
// set this to false to avoid logs
// and run in 'production' mode
var client = new node_rest_client_1.Client();
if (config.RUN_FOREVER.ACTIVATED) {
    setInterval(_main, config.RUN_FOREVER.DELAY);
}
else {
    _main();
}
function _main() {
    var test_failed = true;
    var failed_test_counter = 0;
    var isAlertTriggered = false;
    while (test_failed) {
        if (isAPIalive()) {
            failed_test_counter = 0;
            log('..:: ONLINE ::..');
            if (isAlertTriggered) {
                resetAlerts();
            }
        }
    }
}
// check if the API is still alive
function isAPIalive() {
    var isAlive = false;
    // request and response additional configuration
    var args = {
        requestConfig: {
            timeout: 1000,
            noDelay: true,
            keepAlive: true,
            keepAliveDelay: 1000 //and optionally set the initial delay before the first keepalive probe is sent
        },
        responseConfig: {
            timeout: 1000 //response timeout
        }
    };
    var req = client.get(config.API.URL, args, function (data, response) {
        log(data);
        if (data.response = config.API.EXPECTED_RESPONSE)
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
function resetAlerts() {
}
// handle logging
function log() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (config.DEBUG_MODE) {
        console.log.apply(this, arguments);
    }
}
