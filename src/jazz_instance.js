/*
  Creates instances of the Jazz plugin if necessary. Initially the MIDIAccess creates one main Jazz instance that is used
  to query all initially connected devices, and to track the devices that are being connected or disconnected at runtime.

  For every MIDIInput and MIDIOutput that is created, MIDIAccess queries the getJazzInstance() method for a Jazz instance
  that still have an available input or output. Because Jazz only allows one input and one output per instance, we
  need to create new instances if more than one MIDI input or output device gets connected.

  Note that an existing Jazz instance doesn't get deleted when both its input and output device are disconnected; instead it
  will be reused if a new device gets connected.
*/


'use strict';

/*
  The require statements are only needed for Internet Explorer. They have to be put here;
  if you put them at the top entry point (shim.js) it doesn't work (weird quirck in IE?).

  Note that you can remove the require statements if you don't need (or want) to support Internet Explorer:
  that will shrink the filesize of the WebMIDIAPIShim to about 50%.

  If you are building for Nodejs platform you can comment these lines, then run the buildscript like so:
  'npm run build-nodejs' -> the build file (approx. 15K) will be saved in the web-midi-api folder
*/
require('babelify/node_modules/babel-core/node_modules/core-js/es6/map');
require('babelify/node_modules/babel-core/node_modules/core-js/es6/set');
require('babelify/node_modules/babel-core/node_modules/core-js/es6/symbol');

import {getDevice} from './util';

const jazzPluginInitTime = 100; // milliseconds

let jazzInstanceNumber = 0;
let jazzInstances = new Map();

export function createJazzInstance(callback){

  let id = 'jazz_' + jazzInstanceNumber++ + '' + Date.now();
  let instance;
  let objRef, activeX;


  if(getDevice().nodejs === true){
    objRef = new jazzMidi.MIDI();
  }else{
    let o1 = document.createElement('object');
    o1.id = id + 'ie';
    o1.classid = 'CLSID:1ACE1618-1C7D-4561-AEE1-34842AA85E90';
    activeX = o1;

    let o2 = document.createElement('object');
    o2.id = id;
    o2.type = 'audio/x-jazz';
    o1.appendChild(o2);
    objRef = o2;

    let e = document.createElement('p');
    e.appendChild(document.createTextNode('This page requires the '));

    let a = document.createElement('a');
    a.appendChild(document.createTextNode('Jazz plugin'));
    a.href = 'http://jazz-soft.net/';

    e.appendChild(a);
    e.appendChild(document.createTextNode('.'));
    o2.appendChild(e);

    let insertionPoint = document.getElementById('MIDIPlugin');
    if(!insertionPoint) {
      // Create hidden element
      insertionPoint = document.createElement('div');
      insertionPoint.id = 'MIDIPlugin';
      insertionPoint.style.position = 'absolute';
      insertionPoint.style.visibility = 'hidden';
      insertionPoint.style.left = '-9999px';
      insertionPoint.style.top = '-9999px';
      document.body.appendChild(insertionPoint);
    }
    insertionPoint.appendChild(o1);
  }


  setTimeout(function(){
    if(objRef.isJazz === true){
      instance = objRef;
    }else if(activeX.isJazz === true){
      instance = activeX;
    }
    if(instance !== undefined){
      instance._perfTimeZero = performance.now();
      jazzInstances.set(id, instance);
    }
    callback(instance);
  }, jazzPluginInitTime);
}


export function getJazzInstance(type, callback){
  let instance = null;
  let key = type === 'input' ? 'inputInUse' : 'outputInUse';

  for(let inst of jazzInstances.values()){
    if(inst[key] !== true){
        instance = inst;
        break;
    }
  }

  if(instance === null){
    createJazzInstance(callback);
  }else{
    callback(instance);
  }
}
