# Web MIDI API Shim

This JS library is a prototype shim to make the [Jazz NPAPI/ActiveX plugin](http://jazz-soft.net/) look like the proposed [Web MIDI API](https://dvcs.w3.org/hg/audio/raw-file/tip/midi/specification.html).

This has some significant limitations:

1. MIDIPorts are supposed to have connect and disconnect events.  Jazz doesn't have such events, so I can't fire them.
2. Jazz is really designed to support one input and one output device at a time.  For output, I get around this by setting the output device before every send; however, I don't think multiple input devices will work in Jazz.
3. Jazz doesn't have sysex (in or out) support - or, more properly, Jazz doesn't support long MIDI messages (anything > 3 bytes), so this shim doesn't either.

There are also a couple of unimplemented things currently:

1. I don't yet correctly fire onmessage as an event dispatch; it's just a function call.
2. The long form of sending a MIDIMessage - that is, the one where you create a MIDIMessage object with a timestamp and call sendMIDIMessage - isn't yet supported.  Jazz doesn't support timestamps on output, and doesn't support sysex either, so this will be only partially implemented anyway.

##Usage

Include WMAS.js in your project, and use the Web MIDI API as captured in the proposal.  EXCEPT:

1. I got rid of the timestamp on sendMessage() - see [bug 18762](https://www.w3.org/Bugs/Public/show_bug.cgi?id=18762).
2. I removed the "channel" parameter on sendMessage and in MIDIMessage objects.  See [bug 18764](https://www.w3.org/Bugs/Public/show_bug.cgi?id=18764).

So: 

    var m = navigator.getMIDIAccess( onsuccesscallback, onerrorcallback );
    var inputs = m.enumerateInputs();   // inputs = array of MIDIPorts
    var outputs = m.enumerateOutputs(); // outputs = array of MIDIPorts
    var i = m.getInput( inputs[0] );    // grab first input device
    i.onmessage = myMIDIMessagehandler;	// onmessage( event ), event.MIDIMessages = []MIDIMessage.
    var o = m.getOutput( outputs[0] );  // grab first output device
    o.sendMessage( 0x90, 0x45, 0xff );  // full velocity note on A4 on channel zero
    o.sendMessage( 0x80, 0x45, 0x00 );  // A4 note off

Better documentation later.  :)
