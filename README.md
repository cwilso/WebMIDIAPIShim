# Web MIDI API Polyfill

This JS library is a prototype polyfill and shim for the [Web MIDI API](https://dvcs.w3.org/hg/audio/raw-file/tip/midi/specification.html) (of which I am a co-author), using [Jazz-Soft.net's Jazz-Plugin](http://jazz-soft.net/) to enable MIDI support on Windows and OSX.  You need to have at least [version 1.2](http://jazz-soft.net/download/Jazz-Plugin/1.2) of the Jazz-Plugin in order for this polyfill to work properly.  This polyfill and the plugin should work on Chrome, Firefox, Safari, Opera and IE.

I'm currently using this polyfill to test usability of the API itself, but it's also useful to enable MIDI scenarios.

This polyfill now supports multiple simultaneous inputs and outputs, and sending and receiving long messages (sysem exclusive).  It also properly dispatches events.  Timestamps on send and receive should be properly implemented now, although of course timing will not be very precise on send.

Jazz doesn't expose the version number or manufacturer, so these are always "&lt;not supported&gt;".

##Usage

1. Copy the WebMIDIAPI.js file from /lib/ into your project.  
2. Add "&lt;script src='lib/WebMIDIAPI.js'>&lt;/script>" to your code.

Now you can use the Web MIDI API as captured in the specification (except for the exceptions noted above) - it will automatically check to see if the Web MIDI API is already implemented, and if not it will insert itself.

So, some sample usage: 

	var m = null;   // m = MIDIAccess object for you to make calls on
    navigator.requestMIDIAccess( onsuccesscallback, onerrorcallback );
    
    function onsuccesscallback( access ) { 
    	m = access;

    	// Things you can do with the MIDIAccess object:
	    var inputs = m.enumerateInputs();   // inputs = array of MIDIPorts
	    var outputs = m.enumerateOutputs(); // outputs = array of MIDIPorts
	    var i = m.getInput( inputs[0] );    // grab first input device.  You can also just call getInput( index );
	    i.onmessage = myMIDIMessagehandler;	// onmessage( event ), event.data & event.timestamp are populated
	    var o = m.getOutput( 0 );           // grab first output device
	    o.send( [ 0x90, 0x45, 0x7f ] );     // full velocity note on A4 on channel zero
	    o.send( [ 0x80, 0x45, 0x7f ], window.performance.now() + 1000 );  // full velocity A4 note off in one second.
	};

	function onerrorcallback( err ) {
		console.log("uh-oh! Something went wrong!  Error code: " + err.code );
	}

You can also take a look at [index.html](http://cwilso.github.com/WebMIDIAPIShim/tests/index.html) for a basic test, or [multi.html](http://cwilso.github.com/WebMIDIAPIShim/tests/multi.html) for a multiple-simultaneous-input test.  Better documentation later.  :)
