/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// Initialize the MIDI library.
(function (global, exports, perf) {
    "use strict";
    var midiIO, debug = false, _requestMIDIAccess, _getMIDIAccess, MIDIAccess, _onReady, MIDIPort, MIDIInput, MIDIOutput, _midiProc;
    if (debug) {
        window.console.warn('Debuggin enabled');
    }
    _requestMIDIAccess = function _requestMIDIAccess(successCallback, errorCallback) {
        var temp;
        temp = new MIDIAccess(successCallback, errorCallback);
    };
    _getMIDIAccess = function _getMIDIAccess(successCallback, errorCallback) {
        var message = "getMIDIAccess has been renamed to requestMIDIAccess.  Please update your code.", temp;
        if (console.warn) {
            console.warn(message);
        } else {
            console.log(message);
        }
        temp = new MIDIAccess(successCallback, errorCallback);
    };
    //init: create plugin
    if (!window.navigator.requestMIDIAccess) {
        window.navigator.requestMIDIAccess = _requestMIDIAccess;
        if (!window.navigator.getMIDIAccess) { window.navigator.getMIDIAccess = _getMIDIAccess; }
    }
    function _JazzInstance() {
        var o1, o2, e, a, insertionPoint;
        this.inputInUse = false;
        this.outputInUse = false;
        // load the Jazz plugin
        o1 = document.createElement("object");
        o1.id = "_Jazz" + Math.random() + "ie";
        o1.classid = "CLSID:1ACE1618-1C7D-4561-AEE1-34842AA85E90";
        this.activeX = o1;
        o2 = document.createElement("object");
        o2.id = "_Jazz" + Math.random();
        o2.type = "audio/x-jazz";
        o1.appendChild(o2);
        this.objRef = o2;
        e = document.createElement("p");
        e.appendChild(document.createTextNode("This page requires the "));
        a = document.createElement("a");
        a.appendChild(document.createTextNode("Jazz plugin"));
        a.href = "http://jazz-soft.net/";
        e.appendChild(a);
        e.appendChild(document.createTextNode("."));
        o2.appendChild(e);
        insertionPoint = document.getElementById("MIDIPlugin");
        if (!insertionPoint) {
            insertionPoint = document.body;
        }
        insertionPoint.appendChild(o1);
        if (this.objRef.isJazz) {
            this._Jazz = this.objRef;
        } else if (this.activeX.isJazz) {
            this._Jazz = this.activeX;
        } else {
            this._Jazz = null;
        }
        if (this._Jazz) {
            this._Jazz._jazzTimeZero = this._Jazz.Time();
            this._Jazz._perfTimeZero = window.performance.now();
        }
    }
    // API Methods
    MIDIAccess = function MIDIAccess(successCallback, errorCallback) {
        //this._jazzInstances = new Array();
        this._jazzInstances = [];
        this._jazzInstances.push(new _JazzInstance());
        if (this._jazzInstances[0]._Jazz) {
            this._Jazz = this._jazzInstances[0]._Jazz;
            this._successCallback = successCallback;
            window.setTimeout(_onReady.bind(this), 3);
        } else {
            if (errorCallback) {
                errorCallback({ code: 1 });
            }
        }
    };
    _onReady = function _onReady() {
        if (this._successCallback) {
            this._successCallback(this);
        }
    };
    MIDIAccess.prototype.getInputs = function () {
        var list, inputs, i;
        if (!this._Jazz) {
            return null;
        }
        list = this._Jazz.MidiInList();
        //inputs = new Array(list.length);
        inputs = [];
        for (i = 0; i < list.length; i += 1) {
            inputs[i] = new MIDIPort(this, list[i], i, "input");
        }
        return inputs;
    };
    MIDIAccess.prototype.getOutputs = function () {
        var list, outputs, i;
        if (!this._Jazz) {
            return null;
        }
        list = this._Jazz.MidiOutList();
        //outputs = new Array(list.length);
        outputs = [];
        for (i = 0; i < list.length; i += 1) {
            outputs[i] = new MIDIPort(this, list[i], i, "output");
        }
        return outputs;
    };
    // TODO: remove these versions
    MIDIAccess.prototype.enumerateInputs = function () {
        var message = "MIDIAccess.enumerateInputs has been renamed to MIDIAccess.getInputs. Please update your code.";
        if (console.warn) {
            console.warn(message);
        } else {
            console.log(message);
        }
        return this.getInputs();
    };
    MIDIAccess.prototype.enumerateOutputs = function () {
        var message = "MIDIAccess.enumerateOutputs has been renamed to MIDIAccess.getOutputs. Please update your code.";
        if (console.warn) {
            console.warn(message);
        } else {
            console.log(message);
        }
        return this.getOutputs();
    };
    MIDIAccess.prototype.getInput = function (target) {
        if (target === null) {
            return null;
        }
        return new MIDIInput(this, target);
    };
    MIDIAccess.prototype.getOutput = function (target) {
        if (target === null) {
            return null;
        }
        return new MIDIOutput(this, target);
    };
    MIDIPort = function MIDIPort(midi, port, index, type) {
        var temp = '';
        this._index = index;
        this._midi = midi;
        this.type = type;
        // Can't get manu/version from Jazz
        this.name = port;
        this.manufacturer = null;
        this.version = null;
        this.fingerprint = temp + index + "." + this.name;
    };
    MIDIPort.prototype.toString = function () {
        return ("type: " + this.type + "name: '" + this.name + "' manufacturer: '" + this.manufacturer + "' version: " + this.version + " fingerprint: '" + this.fingerprint + "'");
    };
    MIDIInput = function MIDIInput(midiAccess, target) {
        var inputInstance, i, list, dot;
        this.onmessage = null;
        this._listeners = [];
        this._midiAccess = midiAccess;
        inputInstance = null;
        for (i = 0; (i < midiAccess._jazzInstances.length) && (!inputInstance); i += 1) {
            if (!midiAccess._jazzInstances[i].inputInUse) {
                inputInstance = midiAccess._jazzInstances[i];
            }
        }
        if (!inputInstance) {
            inputInstance = new _JazzInstance();
            midiAccess._jazzInstances.push(inputInstance);
        }
        inputInstance.inputInUse = true;
        this._jazzInstance = inputInstance._Jazz;
        // target can be a MIDIPort or DOMString
        if (target instanceof MIDIPort) {
            this._deviceName = target.name;
            this._index = target._index;
        } else if (typeof target === "number") { // target is numerical index
            this._index = target;
            list = this._jazzInstance.MidiInList();
            this._deviceName = list[target];
        } else if (typeof target === 'string') { // fingerprint
            dot = target.indexOf(".");
            this._index = parseInt(target.slice(0, dot), 10);
            this._deviceName = target.slice(dot + 1);
        }
        this._input = this._jazzInstance.MidiInOpen(this._index, _midiProc.bind(this));
    };
    // Introduced in DOM Level 2:
    MIDIInput.prototype.addEventListener = function (type, listener, useCapture) {
        var i;
        if (type !== "message") {
            return;
        }
        for (i = 0; i < this._listeners.length; i += 1) {
            if (this._listeners[i] === listener) {
                return;
            }
        }
        this._listeners.push(listener);
    };
    MIDIInput.prototype.removeEventListener = function (type, listener, useCapture) {
        var i;
        if (type !== "message") {
            return;
        }
        for (i = 0; i < this._listeners.length; i += 1) {
            if (this._listeners[i] === listener) {
                this._listeners.splice(i, 1);  //remove it
                return;
            }
        }
    };
    MIDIInput.prototype.preventDefault = function () {
        this._pvtDef = true;
    };
    MIDIInput.prototype.dispatchEvent = function (evt) {
        var i;
        this._pvtDef = false;
        // dispatch to listeners
        for (i = 0; i < this._listeners.length; i += 1) {
            if (this._listeners[i].handleEvent) {
                this._listeners[i].handleEvent.bind(this)(evt);
            } else {
                this._listeners[i].bind(this)(evt);
            }
        }
        if (this.onmessage) {
            this.onmessage(evt);
        }
        return this._pvtDef;
    };
    _midiProc = function _midiProc(timestamp, data) {
        var evt = new CustomEvent("message"), length = 0, i, j;
        evt.timestamp = parseFloat(timestamp.toString()) + this._jazzInstance._perfTimeZero;
        // Jazz sometimes passes us multiple messages at once, so we need to parse them out
        // and pass them one at a time.
        for (i = 0; i < data.length; i += length) {
            switch (data[i] & 0xF0) {
            case 0x80:  // note off
            case 0x90:  // note on
            case 0xA0:  // polyphonic aftertouch
            case 0xB0:  // control change
            case 0xE0:  // channel mode
                length = 3;
                break;
            case 0xC0:  // program change
            case 0xD0:  // channel aftertouch
                length = 2;
                break;
            case 0xF0:
                switch (data[i]) {
                case 0xf0:  // variable-length sysex.
                    // count the length;
                    length = -1;
                    for (j = i + 1; (j < data.length) && (data[j] !== 0xF7); j += 1)
                      ;
                    length = j - i + 1;
                    break;
                case 0xF1:  // MTC quarter frame
                case 0xF3:  // song select
                    length = 2;
                    break;
                case 0xF2:  // song position pointer
                    length = 3;
                    break;
                default:
                    length = 1;
                    break;
                }
                break;
            }
            evt.data = new Uint8Array(data.slice(i, length + i));
            this.dispatchEvent(evt);
        }
    };
    MIDIOutput = function MIDIOutput(midiAccess, target) {
        var outputInstance, i, list, dot;
        this._midiAccess = midiAccess;
        outputInstance = null;
        for (i = 0; (i < midiAccess._jazzInstances.length) && (!outputInstance); i += 1) {
            if (!midiAccess._jazzInstances[i].outputInUse) {
                outputInstance=midiAccess._jazzInstances[i];
            }
        }
        if (!outputInstance) {
            outputInstance = new _JazzInstance();
            midiAccess._jazzInstances.push(outputInstance);
        }
        outputInstance.outputInUse = true;
        this._jazzInstance = outputInstance._Jazz;
        // target can be a MIDIPort or DOMString
        if (target instanceof MIDIPort) {
            this._deviceName = target.name;
            this._index = target._index;
        } else if (typeof target === "number") { // target is numerical index
            this._index = target;
            list = this._jazzInstance.MidiOutList();
            this._deviceName = list[target];
        } else if (typeof target === 'string') { // fingerprint
            dot = target.indexOf(".");
            this._index = parseInt(target.slice(0, dot));
            this._deviceName = target.slice(dot + 1);
        }
        this._jazzInstance.MidiOutOpen(this._deviceName);
    };
    function _sendLater() {
        this.jazz.MidiOutLong( this.data );    // handle send as sysex
    }
    MIDIOutput.prototype.send = function(data, timestamp) {
        var delayBeforeSend = 0, sendObj;
        if (data.length === 0) {
            return false;
        }
        if (timestamp) {
            delayBeforeSend = Math.floor(timestamp - window.performance.now());
        }
        if (timestamp && (delayBeforeSend > 1)) {
            //sendObj = new Object;
            sendObj = {};
            sendObj.jazz = this._jazzInstance;
            sendObj.data = data;
            window.setTimeout(_sendLater.bind(sendObj), delayBeforeSend);
        } else {
            this._jazzInstance.MidiOutLong(data);
        }
        return true;
    };
}(window));
// Polyfill window.performance.now() if necessary.
(function (exports) {
    var perf = {}, props;
    function findAlt() {
        var prefix = "moz,webkit,opera,ms".split(","),
            i = prefix.length,
            //worst case, we use Date.now()
            props = {
                value: function (start) {
                    return function () {
                        return Date.now() - start;
                    }
                }(Date.now())
            };
        //seach for vendor prefixed version
        for (; i >= 0; i -= 1) {
            if ((prefix[i] + "Now") in exports.performance) {
                props.value = function (method) {
                    return function () {
                        exports.performance[method]();
                    }
                }(prefix[i] + "Now");
                return props;
            }
        }
        //otherwise, try to use connectionStart
        if (("timing" in exports.performance) && ("connectStart" in exports.performance.timing)) {
            //this pretty much approximates performance.now() to the millisecond
            props.value = (function (start) {
                return function () { Date.now() - start; }
            }(exports.performance.timing.connectStart));
        }
        return props;
    }
    //if already defined, bail
    if (("performance" in exports) && ("now" in exports.performance)) {
        return;
    }
    if (!("performance" in exports)) {
        Object.defineProperty(exports, "performance", {
            get: function () {
                return perf;
            }
        });
        //otherwise, perforance is there, but not "now()"
    }
    props = findAlt();
    Object.defineProperty(exports.performance, "now", props);
}(window));
