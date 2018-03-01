'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       Creates a MIDIAccess instance:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - Creates MIDIInput and MIDIOutput instances for the initially connected MIDI devices.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - Keeps track of newly connected devices and creates the necessary instances of MIDIInput and MIDIOutput.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - Keeps track of disconnected devices and removes them from the inputs and/or outputs map.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       - Creates a unique id for every device and stores these ids by the name of the device:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         so when a device gets disconnected and reconnected again, it will still have the same id. This
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         is in line with the behavior of the native MIDIAccess object.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     */

exports.createMIDIAccess = createMIDIAccess;
exports.dispatchEvent = dispatchEvent;
exports.closeAllMIDIInputs = closeAllMIDIInputs;
exports.getMIDIDeviceId = getMIDIDeviceId;

var _midi_input = require('./midi_input');

var _midi_input2 = _interopRequireDefault(_midi_input);

var _midi_output = require('./midi_output');

var _midi_output2 = _interopRequireDefault(_midi_output);

var _midiconnection_event = require('./midiconnection_event');

var _midiconnection_event2 = _interopRequireDefault(_midiconnection_event);

var _jazz_instance = require('../util/jazz_instance');

var _util = require('../util/util');

var _store = require('../util/store');

var _store2 = _interopRequireDefault(_store);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var midiAccess = void 0;
var jazzInstance = void 0;
var midiInputs = new _store2.default();
var midiOutputs = new _store2.default();
var midiInputIds = new _store2.default();
var midiOutputIds = new _store2.default();
var listeners = new _store2.default();

var MIDIAccess = function () {
    function MIDIAccess(midiInputs, midiOutputs) {
        _classCallCheck(this, MIDIAccess);

        this.sysexEnabled = true;
        this.inputs = midiInputs;
        this.outputs = midiOutputs;
    }

    _createClass(MIDIAccess, [{
        key: 'addEventListener',
        value: function addEventListener(type, listener) {
            if (type !== 'statechange') {
                return;
            }
            if (listeners.has(listener) === false) {
                listeners.add(listener);
            }
        }
    }, {
        key: 'removeEventListener',
        value: function removeEventListener(type, listener) {
            if (type !== 'statechange') {
                return;
            }
            if (listeners.has(listener) === true) {
                listeners.delete(listener);
            }
        }
    }]);

    return MIDIAccess;
}();

function createMIDIAccess() {
    return new Promise(function (resolve, reject) {
        if (typeof midiAccess !== 'undefined') {
            resolve(midiAccess);
            return;
        }

        if ((0, _util.getDevice)().browser === 'ie9') {
            reject({ message: 'WebMIDIAPIShim supports Internet Explorer 10 and above.' });
            return;
        }

        (0, _jazz_instance.createJazzInstance)(function (instance) {
            if (typeof instance === 'undefined' || instance === null) {
                reject({ message: 'No access to MIDI devices: your browser does not support the WebMIDI API and the Jazz plugin is not installed.' });
                return;
            }

            jazzInstance = instance;

            createMIDIPorts(function () {
                setupListeners();
                midiAccess = new MIDIAccess(midiInputs, midiOutputs);
                resolve(midiAccess);
            });
        });
    });
}

// create MIDIInput and MIDIOutput instances for all initially connected MIDI devices
function createMIDIPorts(callback) {
    var inputs = jazzInstance.MidiInList();
    var outputs = jazzInstance.MidiOutList();
    var numInputs = inputs.length;
    var numOutputs = outputs.length;

    loopCreateMIDIPort(0, numInputs, 'input', inputs, function () {
        loopCreateMIDIPort(0, numOutputs, 'output', outputs, callback);
    });
}

function loopCreateMIDIPort(index, max, type, list, callback) {
    if (index < max) {
        var name = list[index++];
        createMIDIPort(type, name, function () {
            loopCreateMIDIPort(index, max, type, list, callback);
        });
    } else {
        callback();
    }
}

function createMIDIPort(type, name, callback) {
    (0, _jazz_instance.getJazzInstance)(type, function (instance) {
        var port = void 0;
        var info = [name, '', ''];
        if (type === 'input') {
            if (instance.Support('MidiInInfo')) {
                info = instance.MidiInInfo(name);
            }
            port = new _midi_input2.default(info, instance);
            midiInputs.set(port.id, port);
        } else if (type === 'output') {
            if (instance.Support('MidiOutInfo')) {
                info = instance.MidiOutInfo(name);
            }
            port = new _midi_output2.default(info, instance);
            midiOutputs.set(port.id, port);
        }
        callback(port);
    });
}

// lookup function: Jazz gives us the name of the connected/disconnected MIDI devices but we have stored them by id
function getPortByName(ports, name) {
    var port = void 0;
    var values = ports.values();
    for (var i = 0; i < values.length; i += 1) {
        port = values[i];
        if (port.name === name) {
            break;
        }
    }
    return port;
}

// keep track of connected/disconnected MIDI devices
function setupListeners() {
    jazzInstance.OnDisconnectMidiIn(function (name) {
        var port = getPortByName(midiInputs, name);
        if (port !== undefined) {
            port.state = 'disconnected';
            port.close();
            port._jazzInstance.inputInUse = false;
            midiInputs.delete(port.id);
            dispatchEvent(port);
        }
    });

    jazzInstance.OnDisconnectMidiOut(function (name) {
        var port = getPortByName(midiOutputs, name);
        if (port !== undefined) {
            port.state = 'disconnected';
            port.close();
            port._jazzInstance.outputInUse = false;
            midiOutputs.delete(port.id);
            dispatchEvent(port);
        }
    });

    jazzInstance.OnConnectMidiIn(function (name) {
        createMIDIPort('input', name, function (port) {
            dispatchEvent(port);
        });
    });

    jazzInstance.OnConnectMidiOut(function (name) {
        createMIDIPort('output', name, function (port) {
            dispatchEvent(port);
        });
    });
}

// when a device gets connected/disconnected both the port and MIDIAccess dispatch a MIDIConnectionEvent
// therefor we call the ports dispatchEvent function here as well
function dispatchEvent(port) {
    port.dispatchEvent(new _midiconnection_event2.default(port, port));

    var evt = new _midiconnection_event2.default(midiAccess, port);

    if (typeof midiAccess.onstatechange === 'function') {
        midiAccess.onstatechange(evt);
    }
    listeners.forEach(function (listener) {
        return listener(evt);
    });
}

function closeAllMIDIInputs() {
    midiInputs.forEach(function (input) {
        // input.close();
        input._jazzInstance.MidiInClose();
    });
}

// check if we have already created a unique id for this device, if so: reuse it, if not: create a new id and store it
function getMIDIDeviceId(name, type) {
    var id = void 0;
    if (type === 'input') {
        id = midiInputIds.get(name);
        if (id === undefined) {
            id = (0, _util.generateUUID)();
            midiInputIds.set(name, id);
        }
    } else if (type === 'output') {
        id = midiOutputIds.get(name);
        if (id === undefined) {
            id = (0, _util.generateUUID)();
            midiOutputIds.set(name, id);
        }
    }
    return id;
}
//# sourceMappingURL=midi_access.js.map