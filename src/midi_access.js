/*
  Creates a MIDIAccess instance:
  - Creates MIDIInput and MIDIOutput instances for the initially connected MIDI devices.
  - Keeps track of newly connected devices and creates the necessary instances of MIDIInput and MIDIOutput.
  - Keeps track of disconnected devices and removes them from the inputs and/or outputs map.
  - Creates a unique id for every device and stores these ids by the name of the device:
    so when a device gets disconnected and reconnected again, it will still have the same id. This
    is in line with the behaviour of the native MIDIAccess object.

*/

'use strict';

import {createJazzInstance, getJazzInstance} from './jazz_instance';
import {MIDIInput} from './midi_input';
import {MIDIOutput} from './midi_output';
import {MIDIConnectionEvent} from './midiconnection_event';
import {getDevice, generateUUID} from './util';


let midiAccess;
let jazzInstance;
let midiInputs = new Map();
let midiOutputs = new Map();
let midiInputIds = new Map();
let midiOutputIds = new Map();
let listeners = new Set();


class MIDIAccess{
  constructor(midiInputs, midiOutputs){
    this.sysexEnabled = true;
    this.inputs = midiInputs;
    this.outputs = midiOutputs;
  }

  addEventListener(type, listener, useCapture){
    if(type !== 'statechange'){
      return;
    }
    if(listeners.has(listener) === false){
      listeners.add(listener);
    }
  }

  removeEventListener(type, listener, useCapture){
    if(type !== 'statechange'){
      return;
    }
    if(listeners.has(listener) === true){
      listeners.delete(listener);
    }
  }
}


export function createMIDIAccess(){

  return new Promise(function executor(resolve, reject){

    if(midiAccess !== undefined){
      resolve(midiAccess);
      return;
    }

    if(getDevice().browser === 'ie9'){
      reject({message: 'WebMIDIAPIShim supports Internet Explorer 10 and above.'})
      return;
    }

    createJazzInstance(function(instance){
      if(instance === undefined){
        reject({message: 'No access to MIDI devices: browser does not support the WebMIDI API and the Jazz plugin is not installed.'});
        return;
      }

      jazzInstance = instance;

      createMIDIPorts(function(){
        setupListeners();
        midiAccess = new MIDIAccess(midiInputs, midiOutputs);
        resolve(midiAccess);
      });
    });

  });
}


// create MIDIInput and MIDIOutput instances for all initially connected MIDI devices
function createMIDIPorts(callback){
  let inputs = jazzInstance.MidiInList();
  let outputs = jazzInstance.MidiOutList();
  let numInputs = inputs.length;
  let numOutputs = outputs.length;

  loopCreateMIDIPort(0, numInputs, 'input', inputs, function(){
    loopCreateMIDIPort(0, numOutputs, 'output', outputs, callback);
  });
}


function loopCreateMIDIPort(index, max, type, list, callback){
  if(index < max){
    let name = list[index++];
    createMIDIPort(type, name, function(){
      loopCreateMIDIPort(index, max, type, list, callback);
    });
  }else{
    callback();
  }
}


function createMIDIPort(type, name, callback){
  getJazzInstance(type, function(instance){
    let port;
    let info = [name, '', ''];
    if(type === 'input'){
      if(instance.Support('MidiInInfo')){
        info = instance.MidiInInfo(name);
      }
      port = new MIDIInput(info, instance);
      midiInputs.set(port.id, port);
    }else if(type === 'output'){
      if(instance.Support('MidiOutInfo')){
        info = instance.MidiOutInfo(name);
      }
      port = new MIDIOutput(info, instance);
      midiOutputs.set(port.id, port);
    }
    callback(port);
  });
}


// lookup function: Jazz gives us the name of the connected/disconnected MIDI devices but we have stored them by id
function getPortByName(ports, name){
  let port;
  for(port of ports.values()){
    if(port.name === name){
      break;
    }
  }
  return port;
}


// keep track of connected/disconnected MIDI devices
function setupListeners(){
  jazzInstance.OnDisconnectMidiIn(function(name){
    let port = getPortByName(midiInputs, name);
    if(port !== undefined){
      port.state = 'disconnected';
      port.close();
      port._jazzInstance.inputInUse = false;
      midiInputs.delete(port.id);
      dispatchEvent(port);
    }
  });

  jazzInstance.OnDisconnectMidiOut(function(name){
    let port = getPortByName(midiOutputs, name);
    if(port !== undefined){
      port.state = 'disconnected';
      port.close();
      port._jazzInstance.outputInUse = false;
      midiOutputs.delete(port.id);
      dispatchEvent(port);
    }
  });

  jazzInstance.OnConnectMidiIn(function(name){
    createMIDIPort('input', name, function(port){
      dispatchEvent(port);
    });
  });

  jazzInstance.OnConnectMidiOut(function(name){
    createMIDIPort('output', name, function(port){
      dispatchEvent(port);
    });
  });
}


// when a device gets connected/disconnected both the port and MIDIAccess dispatch a MIDIConnectionEvent
// therefor we call the ports dispatchEvent function here as well
export function dispatchEvent(port){
  port.dispatchEvent(new MIDIConnectionEvent(port, port));

  let evt = new MIDIConnectionEvent(midiAccess, port);

  if(typeof midiAccess.onstatechange === 'function'){
    midiAccess.onstatechange(evt);
  }
  for(let listener of listeners){
    listener(evt);
  }
}


export function closeAllMIDIInputs(){
  midiInputs.forEach(function(input){
    //input.close();
    input._jazzInstance.MidiInClose();
  });
}


// check if we have already created a unique id for this device, if so: reuse it, if not: create a new id and store it
export function getMIDIDeviceId(name, type){
  let id;
  if(type === 'input'){
    id = midiInputIds.get(name);
    if(id === undefined){
      id = generateUUID();
      midiInputIds.set(name, id);
    }
  }else if(type === 'output'){
    id = midiOutputIds.get(name);
    if(id === undefined){
      id = generateUUID();
      midiOutputIds.set(name, id);
    }
  }
  return id;
}

