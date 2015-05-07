# Web MIDI API Polyfill

This JS library is a prototype polyfill and shim for the [Web MIDI API](http://webaudio.github.io/web-midi-api/) (of which Chris is a co-author), using [Jazz-Soft.net's Jazz-Plugin](http://jazz-soft.net/) to enable MIDI support on Windows, OSX and Linux.
You need to have [version 1.2 or higher](http://jazz-soft.net/download/Jazz-Plugin) of the Jazz-Plugin in order for this polyfill to work properly. This polyfill and the plugin should work on Chrome, Firefox, Safari, Opera and Internet Explorer 10 and 11.

This polyfill was originally designed to test usability of the API itself, but it's also useful to enable MIDI scenarios in browsers that don't yet support Web MIDI.

This polyfill now supports multiple simultaneous inputs and outputs, and sending and receiving long messages (sysem exclusive). It also properly dispatches events. Timestamps on send and receive should be properly implemented now, although of course timing will not be very precise on either.

####Use in a browser

1. Copy the file WebMIDIAPI.js from the /lib folder into your project.
2. Optionally you can copy the source map file WebMIDIAPI.js.map as well
3. Add "&lt;script src='/your/path/to/WebMIDIAPI.js'>&lt;/script>" to your code.

You can use the Web MIDI API as captured in the specification - the polyfill will automatically check to see if the Web MIDI API is already implemented, and if not it will insert itself.

So, some sample usage:

```
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
  output.send( [ 0x80, 0x45, 0x7f ], window.performance.now() + 1000 ); // full velocity A4 note off in one second.
};

function onerrorcallback( err ) {
  console.log( "uh-oh! Something went wrong! Error code: " + err.code );
}
```

####Use as npm package

The WebMIDIAPIShim is also available as npm package, you can add it to your project like so:

- open a terminal
- cd to the root folder of your project
- run `npm install web-midi-api`
- now a folder node_modules has been created, in this folder you'll find a folder named web-midi-api

If you are new to npm and using npm modules in your project please visit the [npm site](https://docs.npmjs.com/).


####Use with Nodejs

You can use the WebMIDIAPIShim in your Nodejs projects as well. First install the npm package as described above, then add the package to your project like so:

```
var navigator = require('web-midi-api');

// and from here your code is exactly the same as a browser project
navigator.requestMIDIAccess().then(onFulFilled, onRejected);


```



####Examples

- [list_devices](http://cwilso.github.com/WebMIDIAPIShim/examples/list_devices) simple listing of all MIDI devices
- [routing_1](http://cwilso.github.com/WebMIDIAPIShim/examples/routing_1) example that lets you route MIDI inports to MIDI outports
- [routing_2](http://cwilso.github.com/WebMIDIAPIShim/examples/routing_2) same routing example with slightly different code
- [nodejs](http://cwilso.github.com/WebMIDIAPIShim/examples/nodejs) example of using the polyfill with Nodejs


####Building the polyfill

The polyfill is written in es6 so you need to transpile it before it can run in a browser. You can find the es6 files in the /src folder. If you change something in the es6 files, you need to build the polyfill again. To do this, you need to have [Node.js](http://nodejs.org/) and [npm](https://www.npmjs.org/) installed.

Then install the project dependencies using:

    npm install

This will install a.o. browserify and babelify.


During development you can start watchify which transpiles your code as soon as you save a changed file:

    npm run watch


If you're satisfied with the new code, you can transpile, build and minimize the code and create a separate sourcemap by:

    npm run build
