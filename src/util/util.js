let Scope;
let device = null;

// check if we are in a browser or in Nodejs
export function getScope() {
    if (typeof Scope !== 'undefined') {
        return Scope;
    }
    Scope = null;
    if (typeof window !== 'undefined') {
        Scope = window;
    } else if (typeof global !== 'undefined') {
        Scope = global;
    }
    // console.log('scope', scope);
    return Scope;
}


// check on what type of device we are running, note that in this context
// a device is a computer not a MIDI device
export function getDevice() {
    const scope = getScope();
    if (device !== null) {
        return device;
    }

    let platform = 'undetected';
    let browser = 'undetected';

    if (scope.navigator.node === true) {
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


// polyfill for window.performance.now()
const polyfillPerformance = () => {
    const scope = getScope();
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

// generates UUID for MIDI devices
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
const polyfillPromise = () => {
    const scope = getScope();
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

