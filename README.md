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

At the moment Chrome (win|osx|linux|android), Opera (win|osx|linux) and the Android WebView component (Android KitKat and above) support Web MIDI natively; in other browsers you need to have version 1.4.4 or higher of the Jazz plugin installed in order for the polyfill to work properly.

The polyfill supports multiple simultaneous inputs and outputs, and sending and receiving long messages (system exclusive). It also properly dispatches events. Timestamps on send and receive should be properly implemented now, although of course timing will not be very precise on either.

#### Use in a browser

1. Copy the file `WebMIDIAPI.min.js` from the `build` folder into your project.
2. Optionally you can copy the source map file WebMIDIAPI.min.js.map as well
3. Add `<script src="/your/path/to/WebMIDIAPI.min.js"></script>` to your html page before the script tag(s) of your own code.

For debugging purposes you can use the uncompressed version; you can find in the `build` folder as well.

After you have added the shim to your HTML page, you can use the Web MIDI API as captured in the specification.

So, some sample usage:

```javascript
var m = null; // m = MIDIAccess object for you to make calls on
navigator.requestMIDIAccess().then(onSuccessCallback, onErrorCallback);

function onSuccessCallback(access) {
    m = access;

    // Things you can do with the MIDIAccess object:
    var inputs = m.inputs; // inputs = MIDIInputMaps, you can retrieve the inputs with iterators
    var outputs = m.outputs; // outputs = MIDIOutputMaps, you can retrieve the outputs with iterators

    var iteratorInputs = inputs.values() // returns an iterator that loops over all inputs
    var input = iteratorInputs.next().value // get the first input

    input.onmidimessage = myMIDIMessagehandler; // onmidimessage( event ), event.data & event.receivedTime are populated

    var iteratorOutputs = outputs.values() // returns an iterator that loops over all outputs
    var output = iteratorOutputs.next().value; // grab first output device

    output.send([0x90, 0x45, 0x7f]); // full velocity note on A4 on channel zero
    output.send([0x80, 0x45, 0x7f], window.performance.now() + 1000); // full velocity A4 note off in one second.
};

function onErrorCallback(err) {
    console.log('uh-oh! Something went wrong! Error code: ' + err.code);
}
```

#### Import as module

Recommended if you are coding in es-next. Install the package from npm:

`npm i --save https://github.com/cwilso/webmidiapishim#gh-pages`

or

`yarn add https://github.com/cwilso/webmidiapishim#gh-pages`

Now in your code you can import the shim like this:

```javascript
import shim from 'web-midi-api';

shim.requestMIDIAccess()
.then(
    access => {
        // access is the MIDIAccess object
    },
    error => console.log(error)
);
```

If you are new to npm and using npm modules in your project please visit the [npm site](https://docs.npmjs.com/). If you are new to bundling dependencies of a web project consult one of these bundlers:

* [browserify documentation](https://github.com/substack/node-browserify#usage).
* webpack
* rollup


#### Use with Nodejs

You can use the WebMIDIAPIShim for a Nodejs project as well. A global `navigator` object will be added.

```javascript
require('web-midi-api');
```

If you want to use MIDI in your node project you can use the package [`web-midi-api`](https://www.npmjs.com/package/web-midi-api) which is maintained by the creator of the Jazz plugin. This package is in fact a bundling of the WebMIDIAPIShim and the npm package [jazz-midi package](https://www.npmjs.com/package/jazz-midi) which is the Nodejs version of the Jazz browser plugin.

#### Examples

- [list_devices](http://cwilso.github.com/WebMIDIAPIShim/examples/list_devices) simple listing of all MIDI devices
- [routing_1](http://cwilso.github.com/WebMIDIAPIShim/examples/routing_1) example that lets you route MIDI inports to MIDI outports
- [routing_2](http://cwilso.github.com/WebMIDIAPIShim/examples/routing_2) same routing example with slightly different code


#### Building the polyfill

The polyfill is written in es6 so you need to transpile it before it can run in a browser. You can find the es6 files in the `src` folder. If you change something in the es6 files, you need to build the polyfill again. To do this, you need to have [Node.js](http://nodejs.org/) and [npm](https://www.npmjs.org/) installed.

Then install the project dependencies using:

`npm install`

or

`yarn install`

This will install all necessary dependencies, a.o. browserify and babelify.

During development you can start watchify which transpiles your code as soon as you save a changed file:

`npm run watch`

If you're satisfied with the new code, you can transpile, build and minimize the code and create a separate sourcemap by:

`npm run update`

This compile the files in the `src` folder to es5 files and puts these in the `dist` folder. It also creates a browser bundle in the `build`
folder.
