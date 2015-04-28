'use strict';

let device;

export function getDevice(){

  if(device !== undefined){
    return device;
  }

  let
    platform = 'undetected',
    browser = 'undetected',
    nodejs = false;

  nodejs = (typeof __dirname !== 'undefined') && (window.jazzMidi !== undefined);

  if(nodejs === true){
    platform = process.platform;
    device = {
      platform: platform,
      nodejs: nodejs,
      mobile: platform === 'ios' || platform === 'android'
    };
    return device;
  }

  let ua = navigator.userAgent;

  if(ua.match(/(iPad|iPhone|iPod)/g)){
    platform = 'ios';
  }else if(ua.indexOf('Android') !== -1){
    platform = 'android';
  }else if(ua.indexOf('Linux') !== -1){
    platform = 'linux';
  }else if(ua.indexOf('Macintosh') !== -1){
    platform = 'osx';
  }else if(ua.indexOf('Windows') !== -1){
    platform = 'windows';
  }

  if(ua.indexOf('Chrome') !== -1){
    // chrome, chromium and canary
    browser = 'chrome';

    if(ua.indexOf('OPR') !== -1){
      browser = 'opera';
    }else if(ua.indexOf('Chromium') !== -1){
      browser = 'chromium';
    }
  }else if(ua.indexOf('Safari') !== -1){
    browser = 'safari';
  }else if(ua.indexOf('Firefox') !== -1){
    browser = 'firefox';
  }else if(ua.indexOf('Trident') !== -1){
    browser = 'ie';
    if(ua.indexOf('MSIE 9') !== -1){
      browser = 'ie9';
    }
  }

  if(platform === 'ios'){
    if(ua.indexOf('CriOS') !== -1){
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


export function polyfillPerformance(){
  if(window.performance === undefined){
    window.performance = {};
  }
  Date.now = (Date.now || function(){
    return new Date().getTime();
  });

  if(window.performance.now === undefined){
    let nowOffset = Date.now();
    if(window.performance.timing !== undefined && window.performance.timing.navigationStart !== undefined){
      nowOffset = window.performance.timing.navigationStart;
    }
    window.performance.now = function now(){
      return Date.now() - nowOffset;
    }
  }
}


export function generateUUID(){
  let d = new Date().getTime();
  let uuid = new Array(64).join('x');;//'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  uuid = uuid.replace(/[xy]/g, function(c) {
    var r = (d + Math.random()*16)%16 | 0;
    d = Math.floor(d/16);
    return (c=='x' ? r : (r&0x3|0x8)).toString(16).toUpperCase();
  });
  return uuid;
}


export function polyfillPromise(scope){
  if(typeof scope.Promise !== 'function'){

    scope.Promise = function(executor) {
      this.executor = executor;
    };

    scope.Promise.prototype.then = function(accept, reject) {
      if(typeof accept !== 'function'){
        accept = function(){};
      }
      if(typeof reject !== 'function'){
        reject = function(){};
      }
      this.executor(accept, reject);
    };
  }
}


export function polyfill(){
  let device = getDevice();
  if(device.browser === 'ie'){
    polyfillPromise(window);
  }else if(device.nodejs === true){
    polyfillPromise(global);
  }
  polyfillPerformance();
}