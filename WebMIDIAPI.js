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
(function (global) {
    'use strict';
    var midiIO, _delayedInit, MIDIAccess, _createJazzInstance, _onReady, _onNotReady, _createMIDIPortMap, MIDIPort, MIDIInput, MIDIOutput, _midiProc;
    var inNodeJs = ( typeof __dirname !== 'undefined' && window.jazzMidi );
    var allMidiIns = [];

    function Iterator(items) {
        this._items = items;
        this._index = 0;
        this._maxIndex = items.length;
    }

    Iterator.prototype.next = function(){
        if(this._index === this._maxIndex){
            return {value: undefined, done: true};
        }
        return {value: this._items[this._index++], done: false};
    };

    Iterator.prototype.reset = function(){
        this._index = 0;
    };


    function Promise() {

    }

    Promise.prototype.then = function(accept, reject) {
        this.accept = accept;
        this.reject = reject;
    };

    Promise.prototype.succeed = function(access) {
        if (this.accept)
            this.accept(access);
    };

    Promise.prototype.fail = function(error) {
        if (this.reject)
            this.reject(error);
    };

    function _JazzInstance() {
        this.inputInUse = false;
        this.outputInUse = false;

        // if running in Node.js
        if (inNodeJs) {
            this.objRef = new window.jazzMidi.MIDI();
            return;
        }

        // load the Jazz plugin
        var o1 = document.createElement("object");
        o1.id = "_Jazz" + Math.random() + "ie";
        o1.classid = "CLSID:1ACE1618-1C7D-4561-AEE1-34842AA85E90";

        this.activeX = o1;

        var o2 = document.createElement("object");
        o2.id = "_Jazz" + Math.random();
        o2.type="audio/x-jazz";
        o1.appendChild(o2);

        this.objRef = o2;

        var e = document.createElement("p");
        e.appendChild(document.createTextNode("This page requires the "));

        var a = document.createElement("a");
        a.appendChild(document.createTextNode("Jazz plugin"));
        a.href = "http://jazz-soft.net/";

        e.appendChild(a);
        e.appendChild(document.createTextNode("."));
        o2.appendChild(e);

        var insertionPoint = document.getElementById("MIDIPlugin");
        if (!insertionPoint) {
            // Create hidden element
            insertionPoint = document.createElement("div");
            insertionPoint.id = "MIDIPlugin";
            insertionPoint.style.position = "absolute";
            insertionPoint.style.visibility = "hidden";
            insertionPoint.style.left = "-9999px";
            insertionPoint.style.top = "-9999px";
            document.body.appendChild(insertionPoint);
        }
        insertionPoint.appendChild(o1);
    }

    _JazzInstance.prototype._init = function() {
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
    };

    _JazzInstance.prototype._delayedInit = function(then) {
        var that = this;
        setTimeout(function() {
            that._init();
            then();
        }, 100);
    };


    // API Methods

    MIDIAccess = function() {
        var numInputs,
            numOutputs,
            numInstances,
            instance;

        this._jazzInstances = new Array();
        instance = new _JazzInstance();
        this._jazzInstances.push( instance );
        this._promise = new Promise;

        instance._delayedInit(function() {
            if (instance._Jazz) {
                this._Jazz = instance._Jazz;
                numInputs = this._Jazz.MidiInList().length;
                numOutputs = this._Jazz.MidiOutList().length;
                /*
                    Get the number of _JazzInstances that is needed, because 1 input
                    and 1 output can share a _JazzInstance, we check how much inputs
                    and outputs are available and the largest number is the number
                    of _JazzInstances that we need. Then we deduct one because we have
                    already created a _JazzInstance.
                */
                numInstances = Math.max(numInputs, numOutputs) - 1;
                if (numInstances > 0) {
                    _createJazzInstance.bind(this)(0, numInstances);
                } else {
                    // no need to create additional instances
                    window.setTimeout(_onReady.bind(this), 3);
                }
            } else {
                window.setTimeout(_onNotReady.bind(this), 3);
            }
        }.bind(this));
    };

    _createJazzInstance = function(i, max){
        var instance = new _JazzInstance();
        this._jazzInstances.push(instance);

        instance._delayedInit(function() {
            i++;
            if (i < max) {
                _createJazzInstance.bind(this)(i, max);
            } else {
                /*
                    All necessary _JazzInstances have been created and
                    initialized, now call _onReady
                */
                window.setTimeout(_onReady.bind(this), 3);
            }
        }.bind(this));
    };

    _onReady = function() {
        if (this._promise){
            this.inputs = _createMIDIPortMap.call(this, this._Jazz.MidiInList(), MIDIInput);
            this.outputs = _createMIDIPortMap.call(this, this._Jazz.MidiOutList(), MIDIOutput);
            this._promise.succeed(this);
        }
    };

    _onNotReady = function() {
        if (this._promise)
            this._promise.fail( { code: 1 } );
    };


    _createMIDIPortMap = function(list, PortClass) {
        var size = list.length,
            values = [],
            keys = [],
            entries = [],
            portsById = {},
            port, i;

        for(i = 0; i < size; i++) {
            if(PortClass !== undefined){ // Jazz plugin
                port = new PortClass(this, list[i], i);
            }else{ // older WebMIDI implementations
                port = list[i];
            }
            entries.push([port.id, port]);
            values.push(port);
            keys.push(port.id);
            portsById[port.id] = port;
        }

        keys = new Iterator(keys);
        values = new Iterator(values);
        entries = new Iterator(entries);

        return {
            size: size,
            forEach: function(cb){
                var i, entry;
                for(i = 0; i < size; i++){
                    entry = entries[i];
                    cb(entry[0], entry[1]);
                }
            },
            keys: function(){
                keys.reset();
                return keys;
            },
            values: function(){
                values.reset();
                return values;
            },
            entries: function(){
                entries.reset();
                return entries;
            },
            get: function(id){
                return portsById[id];
            },
            has: function(id){
                return portsById[id] !== undefined;
            }
        };
    };


    MIDIInput = function MIDIInput( midiAccess, name, index ) {
        this._listeners = [];
        this._midiAccess = midiAccess;
        this._index = index;
        this._inLongSysexMessage = false;
        this._sysexBuffer = new Uint8Array();
        this.id = "" + index + "." + name;
        this.manufacturer = "";
        this.name = name;
        this.type = "input";
        this.version = "";
        this.onmidimessage = null;
        if (midiAccess._Jazz.Support("MidiInInfo")) {
            var info = midiAccess._Jazz.MidiInInfo(name);
            this.manufacturer = info[1];
            this.version = info[2];
        }
        var inputInstance = null;
        var then = function() {
            this._jazzInstance = inputInstance._Jazz;
            this._input = this._jazzInstance.MidiInOpen( this._index, _midiProc.bind(this) );
            if (inNodeJs) allMidiIns.push(this._jazzInstance);
        };
        for (var i=0; (i<midiAccess._jazzInstances.length)&&(!inputInstance); i++) {
            if (!midiAccess._jazzInstances[i].inputInUse)
                inputInstance=midiAccess._jazzInstances[i];
        }
        if (!inputInstance) {
            inputInstance = new _JazzInstance();
            midiAccess._jazzInstances.push( inputInstance );
            inputInstance.inputInUse = true;
            inputInstance._delayedInit(then.bind(this));
        } else {
            inputInstance.inputInUse = true;
            //inputInstance._delayedInit(then.bind(this));
            // no need for delay, the instance has already been initialized
            then.call(this);
        }
    };

    // Introduced in DOM Level 2:
    MIDIInput.prototype.addEventListener = function (type, listener, useCapture ) {
        if (type !== "midimessage")
            return;
        for (var i=0; i<this._listeners.length; i++)
            if (this._listeners[i] == listener)
                return;
        this._listeners.push( listener );
    };

    MIDIInput.prototype.removeEventListener = function (type, listener, useCapture ) {
        if (type !== "midimessage")
            return;
        for (var i=0; i<this._listeners.length; i++)
            if (this._listeners[i] == listener) {
                this._listeners.splice( i, 1 );  //remove it
                return;
            }
    };

    MIDIInput.prototype.preventDefault = function() {
        this._pvtDef = true;
    };

    MIDIInput.prototype.dispatchEvent = function (evt) {
        this._pvtDef = false;

        // dispatch to listeners
        for (var i=0; i<this._listeners.length; i++)
            if (this._listeners[i].handleEvent)
                this._listeners[i].handleEvent.bind(this)( evt );
            else
                this._listeners[i].bind(this)( evt );

        if (this.onmidimessage)
            this.onmidimessage( evt );

        return this._pvtDef;
    };

    MIDIInput.prototype.appendToSysexBuffer = function ( data ) {
        var oldLength = this._sysexBuffer.length;
        var tmpBuffer = new Uint8Array( oldLength + data.length );
        tmpBuffer.set( this._sysexBuffer );
        tmpBuffer.set( data, oldLength );
        this._sysexBuffer = tmpBuffer;
    };

    MIDIInput.prototype.bufferLongSysex = function ( data, initialOffset ) {
        var j = initialOffset;
        while (j<data.length) {
            if (data[j] == 0xF7) {
                // end of sysex!
                j++;
                this.appendToSysexBuffer( data.slice(initialOffset, j) );
                return j;
            }
            j++;
        }
        // didn't reach the end; just tack it on.
        this.appendToSysexBuffer( data.slice(initialOffset, j) );
        this._inLongSysexMessage = true;
        return j;
    };

    _midiProc = function _midiProc( timestamp, data ) {
        // Have to use createEvent/initEvent because IE10 fails on new CustomEvent.  Thanks, IE!
        var length = 0;
        var i,j;
        var isSysexMessage = false;

        // Jazz sometimes passes us multiple messages at once, so we need to parse them out
        // and pass them one at a time.

        for (i=0; i<data.length; i+=length) {
            var isValidMessage = true;
            if (this._inLongSysexMessage) {
                i = this.bufferLongSysex(data,i);
                if ( data[i-1] != 0xf7 ) {
                    // ran off the end without hitting the end of the sysex message
                    return;
                }
                isSysexMessage = true;
            } else {
                isSysexMessage = false;
                switch (data[i] & 0xF0) {
                    case 0x00:  // Chew up spurious 0x00 bytes.  Fixes a Windows problem.
                        length=1;
                        isValidMessage = false;
                        break;

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
                                i = this.bufferLongSysex(data,i);
                                if ( data[i-1] != 0xf7 ) {
                                    // ran off the end without hitting the end of the sysex message
                                    return;
                                }
                                isSysexMessage = true;
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
            }
            if (!isValidMessage)
                continue;
            var evt = {};
            if (!inNodeJs) {
                evt = document.createEvent( "Event" );
                evt.initEvent( "midimessage", false, false );
            }
            evt.receivedTime = parseFloat( timestamp.toString()) + this._jazzInstance._perfTimeZero;
            if (isSysexMessage || this._inLongSysexMessage) {
                evt.data = new Uint8Array( this._sysexBuffer );
                this._sysexBuffer = new Uint8Array(0);
                this._inLongSysexMessage = false;
            } else
                evt.data = new Uint8Array(data.slice(i, length+i));

            if (inNodeJs) {
                if (this.onmidimessage) this.onmidimessage( evt );
            }
            else this.dispatchEvent( evt );
        }
    };

    MIDIOutput = function MIDIOutput( midiAccess, name, index ) {
        this._listeners = [];
        this._midiAccess = midiAccess;
        this._index = index;
        this.id = "" + index + "." + name;
        this.manufacturer = "";
        this.name = name;
        this.type = "output";
        this.version = "";
        if (midiAccess._Jazz.Support("MidiOutInfo")) {
            var info = midiAccess._Jazz.MidiOutInfo(name);
            this.manufacturer = info[1];
            this.version = info[2];
        }
        var outputInstance = null;
        var then = function() {
            this._jazzInstance = outputInstance._Jazz;
            this._jazzInstance.MidiOutOpen(this.name);
        };
        for (var i=0; (i<midiAccess._jazzInstances.length)&&(!outputInstance); i++) {
            if (!midiAccess._jazzInstances[i].outputInUse)
                outputInstance=midiAccess._jazzInstances[i];
        }
        if (!outputInstance) {
            outputInstance = new _JazzInstance();
            midiAccess._jazzInstances.push( outputInstance );
            outputInstance.outputInUse = true;
            outputInstance._delayedInit(then.bind(this));
        } else {
            outputInstance.outputInUse = true;
            //outputInstance._delayedInit(then.bind(this));
            // no need for delay, the instance has already been initialized
            then.call(this);
        }
    };

    function _sendLater() {
        this.jazz.MidiOutLong( this.data );    // handle send as sysex
    }

    MIDIOutput.prototype.send = function( data, timestamp ) {
        var delayBeforeSend = 0;
        if (data.length === 0)
            return false;

        if (timestamp)
            delayBeforeSend = Math.floor( timestamp - window.performance.now() );

        if (timestamp && (delayBeforeSend>1)) {
            var sendObj = new Object();
            sendObj.jazz = this._jazzInstance;
            sendObj.data = data;

            window.setTimeout( _sendLater.bind(sendObj), delayBeforeSend );
        } else {
            this._jazzInstance.MidiOutLong( data );
        }
        return true;
    };


    // wrapper for older WebMIDI implementation, i.e. Chromium's WebMIDI implementation

    function MIDIAccessWrapper(request){
        this._promise = new Promise();
        this._request = request;
    };

    MIDIAccessWrapper.prototype.init = function() {
        var scope = this;

        this._request.bind(window.navigator)().then(

            function onSuccess(access){
                if(typeof access.inputs === 'function'){
                    // add MIDIInputMap and MIDIOutputMap to MIDIAccess object
                    access.inputs = _createMIDIPortMap.call(null, access.inputs());
                    access.outputs = _createMIDIPortMap.call(null, access.outputs());
                }
                if(scope._promise){
                    scope._promise.succeed(access);
                }
            },

            function onError(e){
                if(scope._promise){
                    scope._promise.fail({code:1});
                }
            }
        );
    };

    //init: create plugin or wrap native MIDIAccess object
    (function init(){
        var access;
        if(!window.navigator.requestMIDIAccess){
            window.navigator.requestMIDIAccess = function(){
                access = new MIDIAccess();
                return access._promise;
            };
            if(typeof __dirname !== 'undefined' && window.jazzMidi) {
                window.navigator.close = function() {
                    for(var i in allMidiIns) allMidiIns[i].MidiInClose();
                    // Need to close MIDI input ports, otherwise Node.js will wait for MIDI input forever.
                };
            }
        }else{
            access = new MIDIAccessWrapper(window.navigator.requestMIDIAccess);
            window.navigator.requestMIDIAccess = function(){
                access.init();
                return access._promise;
            }
        }
    }());

}(window));

// Polyfill window.performance.now() if necessary.
(function (exports) {
    var perf = {}, props;

    function findAlt() {
        var prefix = ['moz', 'webkit', 'o', 'ms'],
        i = prefix.length,
            //worst case, we use Date.now()
            props = {
                value: (function (start) {
                    return function () {
                        return Date.now() - start;
                    };
                }(Date.now()))
            };

        //seach for vendor prefixed version
        for (; i >= 0; i--) {
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
        if ("timing" in exports.performance && "connectStart" in exports.performance.timing) {
            //this pretty much approximates performance.now() to the millisecond
            props.value = (function (start) {
                return function() {
                    Date.now() - start;
                };
            }(exports.performance.timing.connectStart));
        }
        return props;
    }

    //if already defined, bail
    if (("performance" in exports) && ("now" in exports.performance))
        return;
    if (!("performance" in exports))
        Object.defineProperty(exports, "performance", {
            get: function () {
                return perf;
            }});
        //otherwise, performance is there, but not "now()"

    props = findAlt();
    Object.defineProperty(exports.performance, "now", props);
}(window));
