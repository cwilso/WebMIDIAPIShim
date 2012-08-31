
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
    window.navigator.getMIDIAccess = MIDIAccess;
});

function MIDIAccess( successCallback, errorCallback ) {
  if (Jazz.isJazz)
    successCallback();
  else
    errorCallback();
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
  this.fingerprint = "" + index + ". " + name;
}

// TODO: MIDIPorts are supposed to have connect and disconnect events.

function MIDIInput( target ) {
  // target can be a MIDIPort or DOMString 
  this.onmessage = null;
  // TODO: look up input, create Jazz input, hook up to a message handler.
}

MIDIInput.prototype._midiProc = function(t,a,b,c) {
}

function MIDIOutput( target ) {
  // target can be a MIDIPort or DOMString 
  // TODO: look up output, create Jazz output, hook up to a message handler.
}

MIDIOutput.prototype.sendMIDIMessage = function( message ) {
  // TODO: send a MIDIMessage.
  return true;
}

MIDIOutput.prototype.sendMessage = function( status, channel, data0, data1, timestamp ) {
  // TODO: send message.
  return true;
}

function MIDIMessage() {
  this.timestamp = null;
  this.status = null;
  this.data = null;
  this.channel = null;
}





// ISSUE: MIDIOutput - "returns a boolean signifying whether the operation was successful" is untenable
// ISSUE: MIDIOutput - need a send with no timestamp.  Suggest interpreting MIDI statuses.
// ISSUE: MIDIMessage - do all long messages have status or channel?? - would change createMIDIMessage too


