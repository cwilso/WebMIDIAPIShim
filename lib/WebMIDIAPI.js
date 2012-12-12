//init: create plugin
window.addEventListener('load', function() {
    if (window.navigator.getMIDIAccess)
      return; // Must already support Web MIDI API.

    // Make sure we support the performance timing api.
    window.performance = window.performance || window.mozPerformance || window.msPerformance || window.webkitPerformance || {};
    
    window.navigator.getMIDIAccess = _getMIDIAccess;
});

function _JazzInstance( instanceNumber ) {
  this.inputInUse = false;
  this.outputInUse = false;

  // load the Jazz plugin
  var o1 = document.createElement("object");
  o1.id = "_Jazz" + instanceNumber + "ie";
  o1.classid = "CLSID:1ACE1618-1C7D-4561-AEE1-34842AA85E90";

  this.activeX = o1;

  var o2 = document.createElement("object");
  o2.id = "_Jazz" + instanceNumber; 
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
  if (!insertionPoint)
      insertionPoint = document.body;
  insertionPoint.appendChild(o1);

  if (this.objRef.isJazz)
    this._Jazz = this.objRef;
  else if (this.activeX.isJazz)
    this._Jazz = this.activeX;
  else
    this._Jazz = null;
  if (this._Jazz) {
    this._Jazz._jazzTimeZero = this._Jazz.Time();
    this._Jazz._perfTimeZero = window.performance.now();
  }
}

function _getMIDIAccess( successCallback, errorCallback ) {
    new MIDIAccess( successCallback, errorCallback );
    return;
}


// API Methods

function MIDIAccess( successCallback, errorCallback ) {
    this._jazzInstances = new Array();
    this._jazzInstances.push( new _JazzInstance() );

    if (this._jazzInstances[0]._Jazz) {
      this._Jazz = this._jazzInstances[0]._Jazz;
      this._successCallback = successCallback;
      window.setTimeout( _onReady.bind(this), 3 );
    } else {
        if (errorCallback)
          errorCallback( { code: 1 } );
    }
}

function _onReady() {
    if (this._successCallback)
        this._successCallback( this );
}

MIDIAccess.prototype.enumerateInputs = function(  ) {
    if (!this._Jazz)
        return null;
    var list=this._Jazz.MidiInList();
    var inputs = new Array( list.length );
  
    for ( var i=0; i<list.length; i++ ) {
        inputs[i] = new MIDIPort( this, list[i], i, "input" );
    }
    return inputs;
}

MIDIAccess.prototype.enumerateOutputs = function(  ) {
    if (!this._Jazz)
        return null;
    var list=this._Jazz.MidiOutList();
    var outputs = new Array( list.length );
  
    for ( var i=0; i<list.length; i++ ) {
        outputs[i] = new MIDIPort( this, list[i], i, "output" );
    }
    return outputs;
}

MIDIAccess.prototype.getInput = function( target ) {
    if (target==null)
        return null;
    return new MIDIInput( this, target );
}

MIDIAccess.prototype.getOutput = function( target ) {
    if (target==null)
        return null;
    return new MIDIOutput( this, target );
}

function MIDIPort( midi, port, index, type ) {
    this._index = index;
    this._midi = midi;
    this.type = type;

    // Can't get manu/version from Jazz
    this.name = port;
    this.manufacturer = "<manufacturer unknown>";
    this.version = "<version not supported>";
    this.fingerprint = "" + index + "." + this.name;
}

MIDIPort.prototype.toString = function() {
    return ("type: "+ this.type + "name: '" + this.name + "' manufacturer: '" + 
    this.manufacturer + "' version: " + this.version + " fingerprint: '" + this.fingerprint + "'" );
}

function MIDIInput( midiAccess, target ) {
  // target can be a MIDIPort or DOMString 
  if ( target instanceof MIDIPort ) {
    this._deviceName = target.name;
    this._index = target._index;
  } else if ( target.isString() ) { // fingerprint 
    var dot = target.indexOf(".");
    this._index = parseInt( target.slice( 0, dot ) );
    this._deviceName = target.slice( dot + 1 );
  } else { // target is numerical index
    this._index = target;
    var list=this.Jazz.MidiInList();
    this._deviceName = list[target];
  }

  this.onmessage = null;
  this._listeners = [];
  this._midiAccess = midiAccess;

  var inputInstance = null;
  for (var i=0; (i<midiAccess._jazzInstances.length)&&(!inputInstance); i++) {
    if (!midiAccess._jazzInstances[i].inputInUse)
      inputInstance=midiAccess._jazzInstances[i];
  }
  if (!inputInstance) {
    inputInstance = new _JazzInstance();
    midiAccess._jazzInstances.push( inputInstance );
  }
  inputInstance.inputInUse = true;

  this._jazzInstance = inputInstance._Jazz;
  this._input = this._jazzInstance.MidiInOpen( this._index, _midiProc.bind(this) );
}

// Introduced in DOM Level 2:
MIDIInput.prototype.addEventListener = function (type, listener, useCapture ) {
  if (type != "message")
    return;
  for (var i=0; i<this._listeners.length; i++)
    if (this._listeners[i] == listener)
      return;
  this._listeners.push( listener );
}

MIDIInput.prototype.removeEventListener = function (type, listener, useCapture ) {
  if (type != "message")
    return;
  for (var i=0; i<this._listeners.length; i++)
    if (this._listeners[i] == listener) {
      this._listeners.splice( i, 1 );  //remove it
      return;
    }
}

MIDIInput.prototype.preventDefault = function() {
  this._pvtDef = true;
}

MIDIInput.prototype.dispatchEvent = function (evt) {
  this._pvtDef = false;

  // dispatch to listeners
  for (var i=0; i<this._listeners.length; i++)
    if (this._listeners[i].handleEvent)
      this._listeners[i].handleEvent( evt );
    else
      this._listeners[i]( evt );

  if (this.onmessage)
    this.onmessage( evt );

  return this._pvtDef;
}


function _midiProc( timestamp, data ) {
  var evt = new CustomEvent( "message" );
  var t = timestamp - this._jazzInstance._jazzTimeZero;
  evt.timestamp = parseFloat( timestamp.toString()) + this._jazzInstance._perfTimeZero;
  evt.data = new Uint8Array(data);

  this.dispatchEvent( evt );

}

function MIDIOutput( midiAccess, target ) {
  // target can be a MIDIPort or DOMString 
  if ( target instanceof MIDIPort ) {
    this._deviceName = target.name;
    this._index = target._index;
  } else if ( target.isString() ) { // fingerprint 
    var dot = target.indexOf(".");
    this._index = parseInt( target.slice( 0, dot ) );
    this._deviceName = target.slice( dot + 1 );
  } else { // target is numerical index
    this._index = target;
    var list=this.Jazz.MidiOutList();
    this._deviceName = list[target];
  }

  this._midiAccess = midiAccess;


  var outputInstance = null;
  for (var i=0; (i<midiAccess._jazzInstances.length)&&(!outputInstance); i++) {
    if (!midiAccess._jazzInstances[i].outputInUse)
      outputInstance=midiAccess._jazzInstances[i];
  }
  if (!outputInstance) {
    outputInstance = new _JazzInstance();
    midiAccess._jazzInstances.push( outputInstance );
  }
  outputInstance.outputInUse = true;

  this._jazzInstance = outputInstance._Jazz;
  this._jazzInstance.MidiOutOpen(this._deviceName);
}

function _sendLater() {
    this.jazz.MidiOutLong( this.data );    // handle send as sysex
}

MIDIOutput.prototype.send = function( data, timestamp ) {
  var delayBeforeSend = 0;
  if (data.length==0)
    return false;

  if (timestamp)
    delayBeforeSend = Math.floor( timestamp - window.performance.now() );

  if (timestamp && (delayBeforeSend>1)) {
    var sendObj = new Object;
    sendObj.jazz = this._jazzInstance;
    sendObj.data = data;

    window.setTimeout( _sendLater.bind(sendObj), delayBeforeSend );
  } else {
    this._jazzInstance.MidiOutLong( data );
  }
  return true;
}


