# Web MIDI API Polyfill

![nodejs](http://jazz-soft.github.io/img/nodejs.jpg)
![chrome](http://jazz-soft.github.io/img/chrome.jpg)
![firefox](http://jazz-soft.github.io/img/firefox.jpg)
![safari](http://jazz-soft.github.io/img/safari.jpg)
![opera](http://jazz-soft.github.io/img/opera.jpg)
![msie](http://jazz-soft.github.io/img/msie.jpg)
![windows](http://jazz-soft.github.io/img/windows.jpg)
![macos](http://jazz-soft.github.io/img/macos.jpg)
![linux](http://jazz-soft.github.io/img/linux.jpg)

This javascript library is a prototype polyfill for the [Web MIDI API](http://webaudio.github.io/web-midi-api/) of which Chris is a co-author.

It was originally designed to test usability of the API itself, but it is currently mainly used as a shim for [Jazz-Soft.net's Jazz-Plugin](http://jazz-soft.net/) to enable MIDI scenarios in browsers that don't yet support Web MIDI.

The polyfill will automatically check to see if the Web MIDI API is already implemented, and if not it will insert itself.

Including this polyfill means Web MIDI should work on Chrome (win|osx|linux|android), Firefox (win|osx|linux), Opera (win|osx|linux), Safari (osx, but not ios) and Internet Explorer 9 and higher on Windows.

At the moment Chrome (win|osx|linux|android), Opera (win|osx|linux) and the Android WebView component (Android KitKat and above) support Web MIDI natively; in other browsers you need to have version 1.2 or higher of the Jazz plugin installed in order for the polyfill to work properly.

The polyfill supports multiple simultaneous inputs and outputs, and sending and receiving long messages (system exclusive). It also properly dispatches events. Timestamps on send and receive should be properly implemented now, although of course timing will not be very precise on either.

####Use in a browser

1. Copy the file WebMIDIAPI.min.js from the /lib folder into your project.
2. Optionally you can copy the source map file WebMIDIAPI.min.js.map as well
3. Add "&lt;script src='/your/path/to/WebMIDIAPI.js'>&lt;/script>" to your code.

You can use the Web MIDI API as captured in the specification.

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

The WebMIDIAPIShim is also available as npm package, you can add it to your web or Nodejs projects like so:

- open a terminal
- cd to the root folder of your project
- run `npm install web-midi-api`
- now a folder node_modules has been created, in this folder you'll find a folder named web-midi-api

If you are new to npm and using npm modules in your project please visit the [npm site](https://docs.npmjs.com/). If you are new to bundling dependencies of a web project consult the [browserify documentation](https://github.com/substack/node-browserify#usage).


####Use with Nodejs

The web-midi-api package installs the [jazz-midi package](https://www.npmjs.com/package/jazz-midi) which is the Nodejs version of the Jazz browser plugin.

Adding web-midi-api to your Nodejs project is done like so:

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
