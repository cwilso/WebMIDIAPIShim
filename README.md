# Web MIDI API Polyfill

This JS library is a prototype shim to make Daniel van der Meer's [MIDIBridge](https://github.com/abudaan/MIDIBridge) library plug in as an exact replacement for the proposed [Web MIDI API](https://dvcs.w3.org/hg/audio/raw-file/tip/midi/specification.html) (of which I am a co-author).

MIDIBridge (in its last incarnation) is already intended to look pretty much like the proposed standard, but this library is intended to work like a polyfill - that is, it can plug in when needed (e.g. on a browser that doesn't support the MIDI API), but is ignored otherwise.  To that end, it has to look PRECISELY like the API.

I'm also using this to test usability of the API itself, so I wanted the ability to change the API signatures easily.

Finally, as MIDIBridge uses the Java runtime to expose many of its objects, many of the API objects are opaque - you can't examine them to see what the object looks like and what methods it has.  That makes it challenging to understand in the debugger, and I wanted to make that a bit easier.

This has some significant limitations:
1. MIDIBridge has a HORRENDOUS start-up time.  It can take around ten seconds to start up sometimes, since it has to fire up the Java runtime.  The API is asynchronous, so this shouldn't cause problems - except that you have to wait somethings.  It's also occasionally flaky, in my experience - that is, something in the Java runtime underpinnings isn't firing up correctly, and it just errors out somewhere.
2. There is a lot of latency in the system as well, probably due to the calls through to the Java runtime as well as the multiple API layers.

There are also some limitations in the API implementation itself:
1. MIDIPorts are supposed to have connect and disconnect events.  MIDIBridge doesn't have such events, to my knowledgeso I can't fire them.
2. MIDIBridge doesn't have sysex (in or out) support - or, more properly, it doesn't support long MIDI messages (anything > 3 bytes), so this polyfill doesn't either.

There are also a couple of unimplemented things currently:

1. I don't yet correctly fire onmessage as an event dispatch; it's just a function call.
2. The long form of sending a MIDIMessage - that is, the one where you create a MIDIMessage object with a timestamp and call sendMIDIMessage - isn't yet supported.  MIDIBridge doesn't support timestamps on output, and doesn't support sysex either, so this will be only partially implemented anyway.

##Usage

1. Copy the contents of /lib/ into your project - and be sure to include it in a /lib/ directory, because the Java instantiation needs to have it there (or edit the javadir in the code).  
2. Add "&lt;script src='lib/WebMIDIAPI.js'>&lt;/script>" to your code.

Now you can use the Web MIDI API as captured in the proposal (except for the exceptions noted below) - it will automatically check to see if the MIDI API is already implemented, and if not it will insert itself.

###EXCEPT:

1. I got rid of the timestamp on sendMessage() - see [bug 18762](https://www.w3.org/Bugs/Public/show_bug.cgi?id=18762).
2. I removed the "channel" parameter on sendMessage and in MIDIMessage objects.  See [bug 18764](https://www.w3.org/Bugs/Public/show_bug.cgi?id=18764).

So, some sample usage: 

    navigator.getMIDIAccess( onsuccesscallback, onerrorcallback );
    function onsuccesscallback( m );	// m = MIDIAccess object for you to make calls on

    var inputs = m.enumerateInputs();   // inputs = array of MIDIPorts
    var outputs = m.enumerateOutputs(); // outputs = array of MIDIPorts
    var i = m.getInput( inputs[0] );    // grab first input device.  You can also getInput( fingerprint );
    i.onmessage = myMIDIMessagehandler;	// onmessage( event ), event.MIDIMessages = []MIDIMessage.
    var o = m.getOutput( outputs[0] );  // grab first output device
    o.sendMessage( 0x90, 0x45, 0xff );  // full velocity note on A4 on channel zero
    o.sendMessage( 0x80, 0x45, 0x00 );  // A4 note off

Better documentation later.  :)
