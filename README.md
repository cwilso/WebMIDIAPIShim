# Web MIDI API Shim

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

It was originally designed to test usability of the API itself, but it is currently mainly used as a shim for Jazz-Soft's [Jazz-Plugin](http://jazz-soft.net/) to enable MIDI scenarios in browsers that don't yet support Web MIDI.

The library is actually a combination of a shim and a polyfill: as a polyfill it implements the WebMIDI API in browsers that don't support it natively, and as a shim it intercepts calls from and to the Jazz plugin. In this readme the terms polyfill and shim are used interchangeably.

Including this library means Web MIDI should work in all browsers that are supported by the Jazz plugin. The library also makes the Web MIDI API available in Node.js applications.

The shim will automatically check to see if the Web MIDI API is already implemented, and if not it will insert itself.

Multiple simultaneous inputs and outputs, and sending and receiving long messages (system exclusive) are supported. The shim also properly dispatches events. Timestamps on send and receive should be properly implemented now, although of course timing will not be very precise on either.

The library is very lightweight; the minified version is less than 17K in file-size.

## Supported browsers

At the moment Chrome, Opera and the Android WebView component (KitKat and above) support the Web MIDI API natively.

In other browsers you need to have version 1.4.4 or higher of the Jazz plugin installed in order for the shim to work properly.

Internet Explorer is supported from version 9 and up.

Note that Chrome and Opera for iOS do not have the Web MIDI API implemented and since there is no Jazz plugin for any iOS browser either, you cannot use Web MIDI on iOS devices.

## Support for Node.js applications

The Web MIDI API shim works with Node.js applications as well. The shim creates a global variable `navigator` that mimics the native `navigator` object in browsers. The `navigator` object has the method `requestMIDIAccess` and this means that you can share your Web MIDI API related code seamlessly across browser and Node.js projects.

Instead of the Jazz plugin, the Node.js version uses the npm module [jazz-midi](https://www.npmjs.com/package/jazz-midi) to connect to the MIDI implementation of your operating system. A reference to `jazz-midi` is added to the global `navigator` object so you can query `jazz-midi` for instance to get the version number:

```javascript
// nodejs
console.log(navigator.jazzMidi.version); // 1.5.1
```

The `jazz-midi` package can be seen as the Node.js version of the Jazz browser plugin and is maintained by [Jazz Soft](http://jazz-soft.net/) as well.

## Use the shim in your project

### 1. As a separate script (browser only)

1. Copy the file `WebMIDIAPI.min.js` from the `build` folder into your project.
2. Optionally you can copy the source map file `WebMIDIAPI.min.js.map` as well
3. Add `<script src="/your/path/to/WebMIDIAPI.min.js"></script>` to your HTML page before the script tag(s) of your own code.

For debugging purposes you can use the uncompressed version; you can find it in the `build` folder as well.

### 2. Import as a module

This method is suitable for both Node.js and browser projects, and for both commonjs and es-next code.

First install the package from npm:

`npm i --save web-midi-api`

or

`yarn add web-midi-api`

Then you can import the module into your code:

```javascript
// commonjs
require('web-midi-api');

// es-next
import 'web-midi-api';
```

## Sample usage

After you have added the shim using any of the methods described above, you can use the Web MIDI API as captured in the specification.

So, some sample usage:

```javascript
// m = MIDIAccess object for you to make calls on
var m = null;

navigator.requestMIDIAccess().then(onSuccessCallback, onErrorCallback);

function onSuccessCallback(access) {
    // If the browser supports WebMIDI, access is a native MIDIAccess
    // object. If not, it is an instance of a custom class that mimics
    // the behavior of MIDIAccess using Jazz.
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

- [list_devices](http://cwilso.github.com/WebMIDIAPIShim/examples/list_devices) simple listing of all available MIDI devices
- [routing_1](http://cwilso.github.com/WebMIDIAPIShim/examples/routing_1) example that lets you route MIDI inports to MIDI outports
- [routing_2](http://cwilso.github.com/WebMIDIAPIShim/examples/routing_2) same routing example with slightly different code
- [node](http://cwilso.github.com/WebMIDIAPIShim/examples/node) example that tests your MIDI in- and outports in Node.js


## Building the polyfill

The polyfill is written in es-next so it needs to be transpiled to es5. You can find the es-next files in the `src` folder. If you change something in the es-next files, you need to build the polyfill again. To do this, you need to have [Node.js](http://nodejs.org/) and [npm](https://www.npmjs.org/) installed.

First install the project dependencies using:

`npm install`

or

`yarn install`

This will install all necessary develop dependencies, a.o. browserify and babelify.

Optionally you can run a test script to check if everything has been installed correctly:

`npm run test`

During development you can start watchify which transpiles your code as soon as you save a changed file:

`npm run watch`

If you're satisfied with the new code, you can run a complete build:

`npm run update`

This compiles the files in the `src` folder to commonjs files and puts them in the `dist` folder. It also creates a browser bundle in es5 in the `build` folder.

## Additional documentation

If you are new to npm and using npm packages in your project please visit the [npm site](https://docs.npmjs.com/). If you are new to bundling npm packages into an es5 web-bundle that can be used in the browser, consult the documentation one of these bundlers:

* [browserify](https://github.com/substack/node-browserify#usage).
* [webpack](https://webpack.js.org/)
* [rollup](https://rollupjs.org/)

## Folder layout

* `build`: contains the transpiled and bundled version of the Web MIDI API shim, this is the script that you add as a separate script to your HTML page.
* `dist`: contains the transpiled commonjs code, this code is used if you import the Web MIDI API shim as a module.
* `examples`: some usage examples for browser and Node.js, written in es5.
* `gh-pages`: styles and scripts used by the github.io landing page, does not contain any library code.
* `node`: contains the entry point for Node.js applications; this scripts combines the Web MIDI API shim with the `jazz-midi` npm package. It also contains a Node.js test script that checks your MIDI in- and outports.
* `src`: contains the actual code of this library, written in es-next, this code is by bundlers that support es-next (rollupjs).
