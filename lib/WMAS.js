
var Jazz;

//init: create plugin
window.addEventListener('load', function() {

  if (!window.navigator.getMIDIAccess)
    window.navigator.getMIDIAccess = _getMIDIAccess;
});

function _getMIDIAccess( successCallback, errorCallback ) {
  new MIDIAccess( successCallback, errorCallback );
  return;
}

function MIDIAccess( successCallback, errorCallback ) {
  this._debug = false;
  if (window.midiBridge) {
    this._successCallback = successCallback;
    window.midiBridge.init( _onReady.bind(this), errorCallback );
  } else {
    if (errorCallback)
      errorCallback();
  }
  return this;
}

function _onReady( methods ) {
    this._enumerateInputs = methods.enumerateInputs;
    this._enumerateOutputs = methods.enumerateOutputs;
    this._getInput = methods.getInput;
    this._getOutput = methods.getOutput;
//    this.closeInputs = methods.closeInputs;
//    this.closeOutputs = methods.closeOutputs;
    this._createMIDIMessage = methods.createMIDIMessage;
/*
        createMIDIMessage : function(command,channel,data1,data2,timeStamp){
            timeStamp = timeStamp || -1;
            //var MIDIMessage = java.lang.Thread.currentThread().getContextClassLoader().loadClass("net.abumarkub.midi.MIDIMessage"); 
            return MIDIAccess.createMIDIMessage(command,channel,data1,data2,timeStamp);
        }
*/ 
  if (this._successCallback)
    this._successCallback( this );
}


MIDIAccess.prototype.enumerateInputs = function(  ) {
  var list=this._enumerateInputs();
  var inputs = new Array( list.length );
  
  for ( var i=0; i<list.length; i++ ) {
      inputs[i] = new MIDIPort( this, list[i], i, "input" );
  }

  return inputs;
}

MIDIAccess.prototype.enumerateOutputs = function(  ) {
  var list=this._enumerateOutputs();
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
  return new MIDIOutput( this, target );
}

MIDIAccess.prototype.createMIDIMessage = function( status, channel, timestamp, data ) {
  var message = new MIDIMessage();
  message.status = status;
  message.channel = channel;
  message.timestamp = timestamp;
  message.data = new Uint8Array(data);
}


function MIDIPort( midi, port, index, type ) {
  this._port = port;
  this._index = index;
  this._midi = midi;
  this.type = type;

  // MIDIBridge problem - need to open/close each one to get the name/manu/version
  var pObj = (type=="input") ? midi._getInput( port ) : midi._getOutput( port );

  this.name = pObj.deviceName;
  this.manufacturer = pObj.deviceManufacturer;
  this.version = "<version not supported>";
  pObj.close();
  this.fingerprint = "" + index + "." + this.name;
}

MIDIPort.prototype.toString = function() {
  return ("type: "+ this.type + "name: '" + this.name + "' manufacturer: '" + 
  this.manufacturer + "' version: " + this.version + " fingerprint: '" + this.fingerprint + "'" );
}

// LIMITATION: no version number
// LIMITATION: MIDIPorts are supposed to have connect and disconnect events.
// LIMITATION: Jazz can only support one input and one output device at a time.
// LIMITATION: Jazz doesn't have sysex (in or out) support.



function MIDIInput( midiAccess, target ) {
  // target can be a MIDIPort or DOMString 
  if ( target instanceof MIDIPort ) {
    this._deviceName = target.name;
    this._index = target._index;
  } else {
    var dot = target.indexOf(".");
    this._index = parseInt( target.slice( 0, dot ) );
    this._deviceName = target.slice( dot + 1 );
  }

  this.onmessage = null;
  this._midiAccess = midiAccess;

  // MIDIBridge can't take a device name for its getInput, so I have to re-enumerate the inputs
  // in order to grab the correct MIDIBridge object from MIDIBridge's enumerateInputs list.
  var inputs = midiAccess._enumerateInputs();
  this._input = midiAccess._getInput( inputs[this._index] );
  this._input.addEventListener( "midimessage", _midiProc.bind(this) );
}

// this is the biggest change in the spec - how MIDI messages are returned to the callback-
// from what MIDIBridge currently sends (which is more short-message-like).
function _midiProc( m ) {
  var status = m.command | m.channel;
  if (this._midiAccess._debug) console.log( "MIDI data received (hex): " + status.toString(16) + " " + m.data1.toString(16) + " " + m.data2.toString(16) );

  var message = new MIDIMessage();
  message.timestamp = parseFloat( m.timeStamp.toString())
  message.data = new Uint8Array(3);
  message.data[0] = m.command | m.channel;
  message.data[1] = m.data1;
  message.data[2] = m.data2;

  var messages = new Array( message );

  if (this.onmessage)
    this.onmessage( messages );
  // TODO: need to correctly fire onmessage as an event dispatch

}

function MIDIOutput( midiAccess, target ) {
  // target can be a MIDIPort or DOMString 
  if ( target instanceof MIDIPort ) {
    this._deviceName = target.name;
    this._index = target._index;
  } else {
    var dot = target.indexOf(".");
    this._index = parseInt( target.slice( 0, dot ) );
    this._deviceName = target.slice( dot + 1 );
  }

  this._midiAccess = midiAccess;

  // MIDIBridge can't take a device name for its getOuput, so I have to re-enumerate the outputs
  // in order to grab the correct MIDIBridge object from MIDIBridge's enumerateOuputs list.
  var outputs = midiAccess._enumerateOutputs();
  this._output = midiAccess._getOutput( outputs[this._index] );
}

MIDIOutput.prototype.sendMessage = function( status, data0, data1 ) {
  var message = this._midiAccess._createMIDIMessage( status & 0xf0, status & 0x0f, /* 0, ?? MIDIBridge doesn't have timestamps either? */ data0, data1 );
  this._output.sendMIDIMessage( message );
  return true;
}

function MIDIMessage() {
  this.timestamp = null;
//  this.status = null;
//  this.channel = null;
  this.data = null;
}




// from this point on, not done.
MIDIOutput.prototype.sendMIDIMessage = function( message ) {
  // TODO: send a MIDIMessage.  Can't do this with MIDIBridge if it's sysex.
  return false;
}





// ISSUE: MIDIOutput - "returns a boolean signifying whether the operation was successful" is untenable
// ISSUE: MIDIOutput - need a send with no timestamp.  Suggest getting rid of timestamp on simple send.
// ISSUE: not even all short messages have channel (e.g. realtime messages).  Should recombine to status(+channel),data,data
// ISSUE: Long messages may not have channel either - MIDIMessage create should not have status byte separate, either.



