/*
  Creates a MIDIAccess instance:
  - Creates MIDIInput and MIDIOutput instances for the initially connected MIDI devices.
  - Keeps track of newly connected devices and creates the necessary instances of MIDIInput and MIDIOutput.
  - Keeps track of disconnected devices and removes them from the inputs and/or outputs map.
  - Creates a unique id for every device and stores these ids by the name of the device:
    so when a device gets disconnected and reconnected again, it will still have the same id. This
    is in line with the behavior of the native MIDIAccess object.

*/

import MIDIInput from './midi_input';
import MIDIOutput from './midi_output';
import MIDIConnectionEvent from './midiconnection_event';
import { createJazzInstance, getJazzInstance } from '../util/jazz_instance';
import { getDevice, generateUUID } from '../util/util';
import Store from '../util/store';

let midiAccess;
let jazzInstance;
const midiInputs = new Store();
const midiOutputs = new Store();
const midiInputIds = new Store();
const midiOutputIds = new Store();
const listeners = new Store();

class MIDIAccess {
    constructor(midiInputs, midiOutputs) {
        this.sysexEnabled = true;
        this.inputs = midiInputs;
        this.outputs = midiOutputs;
    }

    addEventListener(type, listener) {
        if (type !== 'statechange') {
            return;
        }
        if (listeners.has(listener) === false) {
            listeners.add(listener);
        }
    }

    removeEventListener(type, listener) {
        if (type !== 'statechange') {
            return;
        }
        if (listeners.has(listener) === true) {
            listeners.delete(listener);
        }
    }
}


export function createMIDIAccess() {
    return new Promise(((resolve, reject) => {
        if (typeof midiAccess !== 'undefined') {
            resolve(midiAccess);
            return;
        }

        if (getDevice().browser === 'ie9') {
            reject({ message: 'WebMIDIAPIShim supports Internet Explorer 10 and above.' });
            return;
        }

        createJazzInstance((instance) => {
            if (typeof instance === 'undefined' || instance === null) {
                reject({ message: 'No access to MIDI devices: your browser does not support the WebMIDI API and the Jazz plugin is not installed.' });
                return;
            }

            jazzInstance = instance;

            createMIDIPorts(() => {
                setupListeners();
                midiAccess = new MIDIAccess(midiInputs, midiOutputs);
                resolve(midiAccess);
            });
        });
    }));
}


// create MIDIInput and MIDIOutput instances for all initially connected MIDI devices
function createMIDIPorts(callback) {
    const inputs = jazzInstance.MidiInList();
    const outputs = jazzInstance.MidiOutList();
    const numInputs = inputs.length;
    const numOutputs = outputs.length;

    loopCreateMIDIPort(0, numInputs, 'input', inputs, () => {
        loopCreateMIDIPort(0, numOutputs, 'output', outputs, callback);
    });
}


function loopCreateMIDIPort(index, max, type, list, callback) {
    if (index < max) {
        const name = list[index++];
        createMIDIPort(type, name, () => {
            loopCreateMIDIPort(index, max, type, list, callback);
        });
    } else {
        callback();
    }
}


function createMIDIPort(type, name, callback) {
    getJazzInstance(type, (instance) => {
        let port;
        let info = [name, '', ''];
        if (type === 'input') {
            if (instance.Support('MidiInInfo')) {
                info = instance.MidiInInfo(name);
            }
            port = new MIDIInput(info, instance);
            midiInputs.set(port.id, port);
        } else if (type === 'output') {
            if (instance.Support('MidiOutInfo')) {
                info = instance.MidiOutInfo(name);
            }
            port = new MIDIOutput(info, instance);
            midiOutputs.set(port.id, port);
        }
        callback(port);
    });
}


// lookup function: Jazz gives us the name of the connected/disconnected MIDI devices but we have stored them by id
function getPortByName(ports, name) {
    let port;
    const values = ports.values();
    for (let i = 0; i < values.length; i += 1) {
        port = values[i];
        if (port.name === name) {
            break;
        }
    }
    return port;
}


// keep track of connected/disconnected MIDI devices
function setupListeners() {
    jazzInstance.OnDisconnectMidiIn((name) => {
        const port = getPortByName(midiInputs, name);
        if (port !== undefined) {
            port.state = 'disconnected';
            port.close();
            port._jazzInstance.inputInUse = false;
            midiInputs.delete(port.id);
            dispatchEvent(port);
        }
    });

    jazzInstance.OnDisconnectMidiOut((name) => {
        const port = getPortByName(midiOutputs, name);
        if (port !== undefined) {
            port.state = 'disconnected';
            port.close();
            port._jazzInstance.outputInUse = false;
            midiOutputs.delete(port.id);
            dispatchEvent(port);
        }
    });

    jazzInstance.OnConnectMidiIn((name) => {
        createMIDIPort('input', name, (port) => {
            dispatchEvent(port);
        });
    });

    jazzInstance.OnConnectMidiOut((name) => {
        createMIDIPort('output', name, (port) => {
            dispatchEvent(port);
        });
    });
}


// when a device gets connected/disconnected both the port and MIDIAccess dispatch a MIDIConnectionEvent
// therefor we call the ports dispatchEvent function here as well
export function dispatchEvent(port) {
    port.dispatchEvent(new MIDIConnectionEvent(port, port));

    const evt = new MIDIConnectionEvent(midiAccess, port);

    if (typeof midiAccess.onstatechange === 'function') {
        midiAccess.onstatechange(evt);
    }
    listeners.forEach(listener => listener(evt));
}


export function closeAllMIDIInputs() {
    midiInputs.forEach((input) => {
        // input.close();
        input._jazzInstance.MidiInClose();
    });
}


// check if we have already created a unique id for this device, if so: reuse it, if not: create a new id and store it
export function getMIDIDeviceId(name, type) {
    let id;
    if (type === 'input') {
        id = midiInputIds.get(name);
        if (id === undefined) {
            id = generateUUID();
            midiInputIds.set(name, id);
        }
    } else if (type === 'output') {
        id = midiOutputIds.get(name);
        if (id === undefined) {
            id = generateUUID();
            midiOutputIds.set(name, id);
        }
    }
    return id;
}

