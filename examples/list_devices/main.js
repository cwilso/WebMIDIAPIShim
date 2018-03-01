/*
  Simple test that just prints all connected MIDI devices
*/

window.onload = function () {
    let div = document.getElementById('container');
    let midiAccess;

    if (navigator.requestMIDIAccess !== undefined) {
        navigator.requestMIDIAccess().then(
            (access) => {
                midiAccess = access;
                // create a list of all connected MIDI devices
                showMIDIPorts();
                // reload list as devices get connected or disconnected
                midiAccess.onstatechange = showMIDIPorts;
            },
            (e) => {
                // something went wrong while requesting the MIDI devices
                div.innerHTML = e.message;
            },
        );
    } else {
        // browsers without WebMIDI API and Jazz plugin
        div.innerHTML = 'No access to MIDI devices: browser does not support WebMIDI API, please use the WebMIDIAPIShim together with the Jazz plugin';
    }


    function showMIDIPorts() {
        let
            divInputs = document.getElementById('inputs'),
            divOutputs = document.getElementById('outputs'),
            inputs = midiAccess.inputs,
            outputs = midiAccess.outputs,
            html;

        html = '<h4>midi inputs:</h4>';
        inputs.forEach((port) => {
            html += port.name + '<br>';
            html += '<span class="small">manufacturer: ' + port.manufacturer + '</span><br>';
            html += '<span class="small">version: ' + port.version + '</span><br>';
            html += '<span class="small">id: ' + port.id + '</span><br><br>';
        });
        divInputs.innerHTML = html;

        html = '<h4>midi outputs:</h4>';
        outputs.forEach((port) => {
            html += port.name + '<br>';
            html += '<span class="small">manufacturer: ' + port.manufacturer + '</span><br>';
            html += '<span class="small">version: ' + port.version + '</span><br>';
            html += '<span class="small">id: ' + port.id + '</span><br><br>';
        });
        divOutputs.innerHTML = html;
    }
};
