"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_rest_client_1 = require("node-rest-client");
var config = require("./CONFIG.json"); // don't worry about the 'cannot find the module' error
// the next constant is to protect the CPU against too many parallels tries,
// that would put some heavy workload on the CPU
var MAX_PARALLEL_TRIES_WATCHDOG = 9;
var client = new node_rest_client_1.Client();
client.registerMethod("pingAPI", config.API.URL, "GET");
if (config.RUN_FOREVER.ACTIVATED) {
    setInterval(_main, config.RUN_FOREVER.DELAY);
}
else {
    _main();
}
// todo : fix this >>
// Error: getaddrinfo ENOTFOUND apis.advizeo.io apis.advizeo.io:443
// when the address is not reachable, code works if url (on a DNS point of view) exists
function _main() {
    var isAlertTriggered = false;
    var test_failed = true;
    var failed_test_counter = 0;
    _checkConfigParams();
    _checkApi()
        .then(function (promisesResponses) {
        for (var i = 0; i < promisesResponses.length; i++) {
            if (promisesResponses[i] === true)
                failed_test_counter++;
        }
        test_failed = failed_test_counter > config.ERRORS.MAX_FAILED_BEFORE_ALERT;
        if (test_failed) {
            log("__-- OFFLINE --__");
            setOffAlerts();
        }
        else {
            log("..:: ONLINE ::..");
            resetAlerts();
        }
    })
        .catch(function (err) {
        log("error :: ", err);
    });
}
function _checkApi() {
    return __awaiter(this, void 0, void 0, function () {
        var promises, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = [];
                    for (i = 0; i < config.PARALLEL_TRIES; i++) {
                        promises.push(isAPIdead());
                    }
                    return [4 /*yield*/, Promise.all(promises)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
// check if the API is still alive
function isAPIdead() {
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
    return new Promise(function (resolve, reject) {
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
        try {
            client.get(config.API.URL, args, function (data, response) {
                if (data != null &&
                    data.response === config.API.EXPECTED_RESPONSE ||
                    response.statusCode === config.API.EXPECTED_STATUS_CODE)
                    resolve(false);
                else
                    resolve(true);
            });
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
        }
        catch (err) {
            log("in catch :: ", err);
            reject();
        }
    });
}
// set off all the alerts (console, rocketChat, GPIO...)
function setOffAlerts() {
}
// reset all the alerts (console, rocketChat, GPIO...)
function resetAlerts() {
}
function _checkConfigParams() {
    if (config.PARALLEL_TRIES > MAX_PARALLEL_TRIES_WATCHDOG) {
        console.error("ERROR :: ");
        console.error("");
        console.error("Your MAX_FAILED_BEFORE_ALERT value is too big,");
        console.error("it will put too much heavy workload on your CPU.\r\n");
        console.error("It's max value should be =< ", config.PARALLEL_TRIES);
        console.error("You can change this in the CONFIG.json file.");
        return;
    }
    if (config.ERRORS.MAX_FAILED_BEFORE_ALERT > config.PARALLEL_TRIES) {
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
function log() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (config.DEBUG_MODE) {
        console.log.apply(this, arguments);
    }
}
