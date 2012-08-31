
var Jazz;

//init: create plugin
window.addEventListener('load', function() {
  Jazz = document.createElement("object");
  Jazz.style.position="absolute";
  Jazz.style.visibility="hidden";

  if (navigator.appName=='Microsoft Internet Explorer') {
    Jazz.classid = "CLSID:1ACE1618-1C7D-4561-AEE1-34842AA85E90";
  } else {
    Jazz.type="audio/x-jazz";
  }

  var fallback = document.createElement("a");
  fallback.style.visibility="visible";
  fallback.style.background="white";
  fallback.style.font="20px Arial,sans-serif";
  fallback.style.padding="20px";
  fallback.style.position="relative";
  fallback.style.top="20px";
  fallback.style.zIndex="100";
  fallback.style.border="2px solid red";
  fallback.style.borderRadius="5px";
  fallback.appendChild(document.createTextNode("The Web MIDI API Shim requires the Jazz MIDI Plugin to be installed."));
  fallback.href = "http://jazz-soft.net/";
  Jazz.appendChild(fallback);
  document.body.insertBefore(Jazz,document.body.firstChild);

  if (!window.navigator.getMIDIAccess)
    window.navigator.getMIDIAccess = _getMIDIAccess;
});

function _getMIDIAccess( successCallback, errorCallback ) {
  return new MIDIAccess( successCallback, errorCallback );
}

function MIDIAccess( successCallback, errorCallback ) {
  if (Jazz.isJazz) {
    if (successCallback)
      successCallback();
  } else {
    if (errorCallback)
      errorCallback();
  }
  return this;
}

MIDIAccess.prototype.enumerateInputs = function(  ) {
  var list=Jazz.MidiInList();
  var inputs = new Array( list.length );
  
  for ( var i=0; i<list.length; i++ ) {
      inputs[i] = new MIDIPort( "input", i, list[i] );
  }

  return inputs;
}

MIDIAccess.prototype.enumerateOutputs = function(  ) {
  var list=Jazz.MidiOutList();
  var outputs = new Array( list.length );
  
  for ( var i=0; i<list.length; i++ ) {
      outputs[i] = new MIDIPort( "output", i, list[i] );
  }

  return outputs;
}

MIDIAccess.prototype.getInput = function( target ) {
  return new MIDIInput( target );
}

MIDIAccess.prototype.getOutput = function( target ) {
  return new MIDIOutput( target );
}

MIDIAccess.prototype.createMIDIMessage = function( status, channel, timestamp, data ) {
  var message = new MIDIMessage();
  message.status = status;
  message.channel = channel;
  message.timestamp = timestamp;
  message.data = new Uint8Array(data);
}

function MIDIPort( type, index, name ) {
  this.type = type;
  this.name = name;
  this.manufacturer = "";
  this.version = "";
  this.fingerprint = "" + index + "." + name;
}

// LIMITATION: MIDIPorts are supposed to have connect and disconnect events.
// LIMITATION: Jazz can only support one input and one output device at a time.
// LIMITATION: Jazz doesn't have sysex (in or out) support.

function MIDIInput( target ) {
  // target can be a MIDIPort or DOMString 
  if ( target instanceof MIDIPort )
    this._deviceName = target.name;
  else
    this._deviceName = target.slice( target.indexOf(".")+1);

  this.onmessage = null;
  Jazz.MidiInOpen( this._deviceName, _midiProc.bind(this) );
}

function _midiProc(t,a,b,c) {
    var message = new MIDIMessage();
    message.timestamp = t;  // TODO: actually, not the appropriate timestamp.  Need to call Jazz.Time() on input init, and then subtract that and add to DOMHRTS.
    message.data = new Uint8Array([a,b,c]);
/*    message.data = new Uint8Array(3);
    message.data[0] = a;
    message.data[1] = a;
    message.data[2] = a;
*/
  if (this.onmessage)
    this.onmessage( new Array(message) );
  // TODO: need to correctly fire onmessage as an event dispatch

}

function MIDIOutput( target ) {
  // target can be a MIDIPort or DOMString
  if (target.prototype.isPrototypeOf(MIDIPort) )
    this._deviceName = target.name;
  else
    this._deviceName = target.slice( target.indexOf(".")+1);
  // Note that due to Jazz' limitations, we don't actually open the output here.
}

MIDIOutput.prototype.sendMIDIMessage = function( message ) {
  // TODO: send a MIDIMessage.  Can't do this with Jazz if it's sysex.
  return false;
}

MIDIOutput.prototype.sendMessage = function( status, data0, data1 ) {
  Jazz.MidiOutOpen(this._deviceName);
  Jazz.MidiOut( status, data0, data1);
  // TODO: explicitly check # of bytes to send, via arguments.length.
  return true;
}

function MIDIMessage() {
  this.timestamp = null;
  this.status = null;
  this.data = null;
  this.channel = null;
}





// ISSUE: MIDIOutput - "returns a boolean signifying whether the operation was successful" is untenable
// ISSUE: MIDIOutput - need a send with no timestamp.  Suggest getting rid of timestamp on simple send.
// ISSUE: not even all short messages have channel (e.g. realtime messages).  Should recombine to status(+channel),data,data
// ISSUE: Long messages may not have channel either - MIDIMessage create should not have status byte separate, either.



