'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getDevice = getDevice;
exports.polyfillPerformance = polyfillPerformance;
exports.generateUUID = generateUUID;
exports.polyfillPromise = polyfillPromise;
exports.polyfill = polyfill;
/* eslint no-param-reassign: 0 */
/* eslint no-bitwise: 0 */
/* eslint no-mixed-operators: 0 */

/*
  A collection of handy util methods
*/

var device = null;

// check on what type of device we are running, note that in this context
// a device is a computer not a MIDI device
function getDevice() {
    if (device !== null) {
        return device;
    }

    var platform = 'undetected';
    var browser = 'undetected';

    if (typeof navigator.nodejs !== 'undefined') {
        device = {
            platform: process.platform,
            nodejs: true,
            mobile: platform === 'ios' || platform === 'android'
        };
        return device;
    }

    var ua = navigator.userAgent;

    if (ua.match(/(iPad|iPhone|iPod)/g)) {
        platform = 'ios';
    } else if (ua.indexOf('Android') !== -1) {
        platform = 'android';
    } else if (ua.indexOf('Linux') !== -1) {
        platform = 'linux';
    } else if (ua.indexOf('Macintosh') !== -1) {
        platform = 'osx';
    } else if (ua.indexOf('Windows') !== -1) {
        platform = 'windows';
    }

    if (ua.indexOf('Chrome') !== -1) {
        // chrome, chromium and canary
        browser = 'chrome';

        if (ua.indexOf('OPR') !== -1) {
            browser = 'opera';
        } else if (ua.indexOf('Chromium') !== -1) {
            browser = 'chromium';
        }
    } else if (ua.indexOf('Safari') !== -1) {
        browser = 'safari';
    } else if (ua.indexOf('Firefox') !== -1) {
        browser = 'firefox';
    } else if (ua.indexOf('Trident') !== -1) {
        browser = 'ie';
        if (ua.indexOf('MSIE 9') !== -1) {
            browser = 'ie9';
        }
    }

    if (platform === 'ios') {
        if (ua.indexOf('CriOS') !== -1) {
            browser = 'chrome';
        }
    }

    device = {
        platform: platform,
        browser: browser,
        mobile: platform === 'ios' || platform === 'android',
        nodejs: false
    };
    return device;
}

function polyfillPerformance() {
    // performance is a global variable
    if (typeof performance === 'undefined') {
        performance = {};
    }
    Date.now = Date.now || function () {
        return new Date().getTime();
    };

    if (typeof performance.now === 'undefined') {
        var nowOffset = Date.now();
        if (typeof performance.timing !== 'undefined' && typeof performance.timing.navigationStart !== 'undefined') {
            nowOffset = performance.timing.navigationStart;
        }
        performance.now = function now() {
            return Date.now() - nowOffset;
        };
    }
}

function generateUUID() {
    var d = new Date().getTime();
    var uuid = new Array(64).join('x'); // 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    uuid = uuid.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : r & 0x3 | 0x8).toString(16).toUpperCase();
    });
    return uuid;
}

// a very simple implementation of a Promise for Internet Explorer and Nodejs
function polyfillPromise(scope) {
    if (typeof scope.Promise !== 'function') {
        scope.Promise = function promise(executor) {
            this.executor = executor;
        };

        scope.Promise.prototype.then = function then(resolve, reject) {
            if (typeof resolve !== 'function') {
                resolve = function resolve() {};
            }
            if (typeof reject !== 'function') {
                reject = function reject() {};
            }
            this.executor(resolve, reject);
        };
    }
}

function polyfill() {
    var d = getDevice();
    // console.log(device);
    if (d.browser === 'ie') {
        polyfillPromise(window);
    } else if (d.nodejs === true) {
        polyfillPromise(global);
    }
    polyfillPerformance();
}