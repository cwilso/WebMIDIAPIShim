require('../node/index.js');

let ins;
let outs;

function onMIDIFailure(msg) {
    console.log(`Failed to get MIDI access - ${msg}`);
}

function onMIDISuccess(midiAccess) {
    midi = midiAccess;
    ins = midi.inputs;
    outs = midi.outputs;
    // setTimeout(testOutputs, 200);
    setTimeout(testInputs, 200);
}

function testOutputs() {
    console.log('Testing MIDI-Out ports...');
    for (const i in outs) {
        const x = outs[i];
        console.log(x);
        console.log('id:', x.id, 'manufacturer:', x.manufacturer, 'name:', x.name, 'version:', x.version);
        x.send([0x90, 60, 0x7f]);
    }
    setTimeout(stopOutputs, 1000);
}

function stopOutputs() {
    for (const i in outs) {
        outs[i].send([0x80, 60, 0]);
    }
    testInputs();
}

function onMidiIn(ev) {
    const arr = [];
    for (let i = 0; i < ev.data.length; i++) arr.push((ev.data[i] < 16 ? '0' : '') + ev.data[i].toString(16));
    console.log('MIDI:', arr.join(' '));
}

function testInputs() {
    console.log('Testing MIDI-In ports...');
    for (const i in ins) {
        const x = ins[i];
        console.log('id:', x.id, 'manufacturer:', x.manufacturer, 'name:', x.name, 'version:', x.version);
        x.onmidimessage = onMidiIn;
    }
    setTimeout(stopInputs, 5000);
}

function stopInputs() {
    console.log('Thank you!');
    navigator.close(); // This will close MIDI inputs, otherwise Node.js will wait for MIDI input forever.
}

navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

