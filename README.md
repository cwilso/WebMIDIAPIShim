# Web MIDI API Polyfill

This JS library is a prototype polyfill and shim for the [Web MIDI API](http://webaudio.github.io/web-midi-api/) (of which Chris is a co-author), using [Jazz-Soft.net's Jazz-Plugin](http://jazz-soft.net/) to enable MIDI support on Windows, OSX and Linux.
You need to have [version 1.2 or higher](http://jazz-soft.net/download/Jazz-Plugin) of the Jazz-Plugin in order for this polyfill to work properly. This polyfill and the plugin should work on Chrome, Firefox, Safari, Opera and IE.

This polyfill was originally designed to test usability of the API itself, but it's also useful to enable MIDI scenarios in browsers that don't yet support Web MIDI.

This polyfill now supports multiple simultaneous inputs and outputs, and sending and receiving long messages (sysem exclusive). It also properly dispatches events. Timestamps on send and receive should be properly implemented now, although of course timing will not be very precise on either.

##Usage

1. Copy the WebMIDIAPI.js file from /lib/ into your project.
2. Add "&lt;script src='lib/WebMIDIAPI.js'>&lt;/script>" to your code.

You can use the Web MIDI API as captured in the specification - the polyfill will automatically check to see if the Web MIDI API is already implemented, and if not it will insert itself.

So, some sample usage:

	var m = null; // m = MIDIAccess object for you to make calls on
    navigator.requestMIDIAccess().then( onsuccesscallback, onerrorcallback );

    function onsuccesscallback( access ) {
    	m = access;

    	// Things you can do with the MIDIAccess object:
	    var inputs = m.inputs; // inputs = MIDIInputMaps, you can retrieve the inputs with iterators
	    var outputs = m.outputs; // outputs = MIDIOutputMaps, you can retrieve the outputs with iterators

      var iteratorInputs = inputs.values() // returns an iterator that loops over all inputs
      var input = iteratorInputs.next().value // get the first input

      input.onmidimessage = myMIDIMessagehandler; // onmidimessage( event ), event.data & event.receivedTime are populated

      var iteratorOutputs = outputs.values() // returns an iterator that loops over all outputs
      var output = iteratorOutputs.next().value; // grab first output device

      output.send( [ 0x90, 0x45, 0x7f ] ); // full velocity note on A4 on channel zero
	    output.send( [ 0x80, 0x45, 0x7f ], window.performance.now() + 1000 );  // full velocity A4 note off in one second.
	};

	function onerrorcallback( err ) {
		console.log( "uh-oh! Something went wrong!  Error code: " + err.code );
	}

You can also take a look at [index.html](http://cwilso.github.com/WebMIDIAPIShim/tests/index.html) for a basic test, or [multi.html](http://cwilso.github.com/WebMIDIAPIShim/tests/multi.html) or [routing.html](http://cwilso.github.com/WebMIDIAPIShim/tests/routing.html) for a multiple-simultaneous-input test.  Better documentation later.  :)

##Node.js install and test

  Make a new directory, copy the file test.js to this directory. Then move into the newly created directory via the command line and enter this command:

    npm install web-midi-api

  Now you should have a folder node_modules/web-midi-api. Type this command to run the test:

    node test.js

  Or if you are on Linux:

    nodejs test.js

##Node.js example (test.js)

    var navigator = require('../web-midi-api');

    var midi;
    var inputs;
    var outputs;

    function onMIDIFailure(msg){
      console.log('Failed to get MIDI access - ' + msg);
    }

    function onMIDISuccess(midiAccess){
      midi = midiAccess;
      inputs = midi.inputs;
      outputs = midi.outputs;
      setTimeout(testOutputs, 500);
    }

    function testOutputs(){
      console.log('Testing MIDI-Out ports...');
      outputs.forEach(function(key, value){
        var x = value;
        console.log('id:', x.id, 'manufacturer:', x.manufacturer, 'name:', x.name, 'version:', x.version);
        x.send([0x90, 60, 0x7f]);
      });
      setTimeout(stopOutputs, 1000);
    }

    function stopOutputs(){
      outputs.forEach(function(key, value){
        value.send([0x80, 60, 0]);
      });
      testInputs();
    }

    function onMidiIn(ev){
      var arr = [];
      for(var i=0; i<ev.data.length; i++) arr.push((ev.data[i]<16 ? '0' : '') + ev.data[i].toString(16));
      console.log('MIDI:', arr.join(' '));
    }

    function testInputs(){
      console.log('Testing MIDI-In ports...');
      inputs.forEach(function(key, value){
        var x = value;
        console.log('id:', x.id, 'manufacturer:', x.manufacturer, 'name:', x.name, 'version:', x.version);
        x.onmidimessage = onMidiIn;
      });
      setTimeout(stopInputs, 5000);
    }

    function stopInputs(){
      console.log('Thank you!');
      navigator.close(); // This will close MIDI inputs, otherwise Node.js will wait for MIDI input forever.
    }

    navigator.requestMIDIAccess().then(onMIDISuccess,onMIDIFailure);