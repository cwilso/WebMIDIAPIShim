/* eslint no-param-reassign: 0 */
/* eslint no-bitwise: 0 */
/* eslint no-mixed-operators: 0 */

/*
  A collection of handy util methods
*/

let scope;
let device = null;

const getScope = () => {
    if (typeof scope !== 'undefined') {
        return;
    }
    scope = null;
    if (typeof window !== 'undefined') {
        scope = window;
    } else if (typeof global !== 'undefined') {
        scope = global;
    }
    // console.log('scope', scope);
    // return scope;
};


// check on what type of device we are running, note that in this context
// a device is a computer not a MIDI device
export function getDevice() {
    getScope();
    if (device !== null) {
        return device;
    }

    let platform = 'undetected';
    let browser = 'undetected';

    if (typeof scope.navigator.nodejs !== 'undefined') {
        device = {
            platform: process.platform,
            nodejs: true,
            mobile: platform === 'ios' || platform === 'android',
        };
        return device;
    }

    const ua = scope.navigator.userAgent;

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
        platform,
        browser,
        mobile: platform === 'ios' || platform === 'android',
        nodejs: false,
    };
    return device;
}


export function polyfillPerformance() {
    getScope();
    if (typeof scope.performance === 'undefined') {
        scope.performance = {};
    }
    Date.now = Date.now || (() => new Date().getTime());

    if (typeof scope.performance.now === 'undefined') {
        let nowOffset = Date.now();
        if (
            typeof scope.performance.timing !== 'undefined' &&
            typeof scope.performance.timing.navigationStart !== 'undefined'
        ) {
            nowOffset = scope.performance.timing.navigationStart;
        }
        scope.performance.now = function now() {
            return Date.now() - nowOffset;
        };
    }
}


export function generateUUID() {
    let d = new Date().getTime();
    let uuid = new Array(64).join('x');// 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    uuid = uuid.replace(/[xy]/g, (c) => {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16).toUpperCase();
    });
    return uuid;
}


// a very simple implementation of a Promise for Internet Explorer and Nodejs
export function polyfillPromise() {
    getScope();
    if (typeof scope.Promise !== 'function') {
        scope.Promise = function promise(executor) {
            this.executor = executor;
        };

        scope.Promise.prototype.then = function then(resolve, reject) {
            if (typeof resolve !== 'function') {
                resolve = () => { };
            }
            if (typeof reject !== 'function') {
                reject = () => { };
            }
            this.executor(resolve, reject);
        };
    }
}


export function polyfill() {
    const d = getDevice();
    // console.log(device);
    if (d.browser === 'ie' || d.nodejs === true) {
        polyfillPromise();
    }
    polyfillPerformance();
}
