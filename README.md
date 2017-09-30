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

Including this polyfill means Web MIDI should work in all browsers that are supported by the Jazz MIDI plugin.

The polyfill will automatically check to see if the Web MIDI API is already implemented, and if not it will insert itself.

The polyfill supports multiple simultaneous inputs and outputs, and sending and receiving long messages (system exclusive). It also properly dispatches events. Timestamps on send and receive should be properly implemented now, although of course timing will not be very precise on either.

## Supported browsers

At the moment Chrome, Opera and the Android WebView component (KitKat and above) support Web MIDI natively.

In other browsers you need to have version 1.4.4 or higher of the Jazz plugin installed in order for the polyfill to work properly.

Internet Explorer is supported from version 9 and up.

Note that there is no way on iOS to work with the Web MIDI API; Chrome and Opera for iOS do not have the Web MIDI API implemented and there is no Jazz plugin for any iOS browser either.

## Support for Nodejs applications

The Web MIDI API shim works in Nodejs applications as well. The shim creates a global variable `navigator` that has the method `requestMIDIAccess`. This means that you can use the same code in both browser and Nodejs environments.

The Nodejs version uses the npm module [jazz-midi](https://www.npmjs.com/package/jazz-midi) to connect to the MIDI implementation of your operating system. A reference to `jazz-midi` is added to the global `navigator` object so you can query the object for instance to get the version number:

```javascript
// nodejs
console.log(navigator.jazzMidi.version); // 1.5.8
```

`jazz-midi` is the Nodejs version of the Jazz browser plugin and is maintained by [Jazz Soft](http://jazz-soft.net/) as well.

## Use the shim in your project

### 1. As a separate script (browser only)

1. Copy the file `WebMIDIAPI.min.js` from the `build` folder into your project.
2. Optionally you can copy the source map file WebMIDIAPI.min.js.map as well
3. Add `<script src="/your/path/to/WebMIDIAPI.min.js"></script>` to your html page before the script tag(s) of your own code.

For debugging purposes you can use the uncompressed version; you can find in the `build` folder as well.

### 2. Import as a module

This method is suitable for both Nodejs and browser projects, and for both es5 and ex-next code.

First install the package from npm:

`npm i --save https://github.com/cwilso/webmidiapishim#gh-pages`

or

`yarn add https://github.com/cwilso/webmidiapishim#gh-pages`

Then you can import the module into your code:

```javascript
// commonjs, es5
require('web-midi-api');

// es-next
import 'web-midi-api';
```

## Sample code

After you have added the shim using any of the methods described above , you can use the Web MIDI API as captured in the specification.

So, some sample usage:

```javascript
// m = MIDIAccess object for you to make calls on
var m = null;

navigator.requestMIDIAccess().then(onSuccessCallback, onErrorCallback);

function onSuccessCallback(access) {
    m = access;

    // Things you can do with the MIDIAccess object:

    // inputs = MIDIInputMaps, you can retrieve the inputs with iterators
    var inputs = m.inputs;
    // outputs = MIDIOutputMaps, you can retrieve the outputs with iterators
    var outputs = m.outputs;

    // returns an iterator that loops over all inputs
    var iteratorInputs = inputs.values()
    // get the first input
    var input = iteratorInputs.next().value

    // onmidimessage(event), event.data & event.receivedTime are populated
    input.onmidimessage = myMIDIMessagehandler;

    // returns an iterator that loops over all outputs
    var iteratorOutputs = outputs.values()
    // grab first output device
    var output = iteratorOutputs.next().value;

    // full velocity note on A4 on channel zero
    output.send([0x90, 0x45, 0x7f]);
    // full velocity A4 note off in one second.
    output.send([0x80, 0x45, 0x7f], window.performance.now() + 1000);
};

function onErrorCallback(err) {
    console.log('uh-oh! Something went wrong! Error code: ' + err.code);
}
```

## Examples

- [list_devices](http://cwilso.github.com/WebMIDIAPIShim/examples/list_devices) simple listing of all MIDI devices
- [routing_1](http://cwilso.github.com/WebMIDIAPIShim/examples/routing_1) example that lets you route MIDI inports to MIDI outports
- [routing_2](http://cwilso.github.com/WebMIDIAPIShim/examples/routing_2) same routing example with slightly different code


## Building the polyfill

The polyfill is written in es6 it needs to be transpiled to es5. You can find the es6 files in the `src` folder. If you change something in the es6 files, you need to build the polyfill again. To do this, you need to have [Node.js](http://nodejs.org/) and [npm](https://www.npmjs.org/) installed.

Then install the project dependencies using:

`npm install`

or

`yarn install`

This will install all necessary dependencies, a.o. browserify and babelify.

During development you can start watchify which transpiles your code as soon as you save a changed file:

`npm run watch`

If you're satisfied with the new code, you can run a complete build:

`npm run update`

This compiles the files in the `src` folder to es5 files and puts them in the `dist` folder. It also creates a browser bundle in the `build` folder.

## Additional documentation

If you are new to npm and using npm modules in your project please visit the [npm site](https://docs.npmjs.com/). If you are new to bundling dependencies of a web project consult one of these bundlers:

* [browserify](https://github.com/substack/node-browserify#usage).
* [webpack](https://webpack.js.org/)
* [rollup](https://rollupjs.org/)

## Folder layout

* `build`: contains the transpiled and bundled version of the Web MIDI API shim, this is the script that you add as a separate script to your HTML page.
* `dist`: contains the transpiled code (not bundled), this code is used if you import the Web MIDI API shim as a module.
* `examples`: some usage examples for browser and Nodejs, written in es5.
* `gh-pages`: styles and script used by the Github page and the examples, does not contain any library code
* `node`: contains the entry point for Nodejs applications; this scripts combines the Web MIDI API shim with the `jazz-midi` npm package.
* `node_modules`: contains dependencies for transpiling the Web MIDI API shim and the `jazz-midi`: package for Nodejs applications.
* `src`: contains the actual code of this library, written in es6.

