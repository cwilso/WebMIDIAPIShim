window.onload = function () {
    'use strict';

    var
        divLog = document.getElementById('log'),
        divInputs = document.getElementById('inputs'),
        divOutputs = document.getElementById('outputs'),
        midiAccess,
        checkboxMIDIInOnChange,
        checkboxMIDIOutOnChange,
        activeInputs = {},
        activeOutputs = {};


    if (navigator.requestMIDIAccess !== undefined) {
        navigator.requestMIDIAccess().then(

            function onFulfilled(access) {
                midiAccess = access;

                // create list of all currently connected MIDI devices
                showMIDIPorts();

                // update the device list when devices get connected, disconnected, opened or closed
                midiAccess.addEventListener('statechange', function (e) {
                    var port = e.port;
                    var div = port.type === 'input' ? divInputs : divOutputs;
                    var listener = port.type === 'input' ? checkboxMIDIInOnChange : checkboxMIDIOutOnChange;
                    var activePorts = port.type === 'input' ? activeInputs : activeOutputs;
                    var checkbox = document.getElementById(port.type + port.id);
                    var label;

                    // device disconnected
                    if (port.state === 'disconnected' && checkbox !== null) {
                        div.removeChild(checkbox.parentNode.nextSibling); // remove the <br> after the checkbox
                        div.removeChild(checkbox.parentNode); // remove the label and the checkbox
                        port.close();
                        delete activePorts[port.type + port.id];

                        // new device connected
                    } else if (port.state === 'connected' && checkbox === null) {
                        label = document.createElement('label');
                        checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = port.type + port.id;
                        checkbox.addEventListener('change', listener, false);
                        label.appendChild(checkbox);
                        label.appendChild(document.createTextNode(port.name + ' (' + port.state + ', ' + port.connection + ')'));
                        div.appendChild(label);
                        div.appendChild(document.createElement('br'));
                    }
                }, false);
            },

            function onRejected(e) {
                divInputs.innerHTML = e.message;
                divOutputs.innerHTML = '';
            }
        );
    }

    // browsers without WebMIDI API and WebMIDIAPIShim not present
    else {
        divInputs.innerHTML = 'No access to MIDI devices: browser does not support WebMIDI API, please use the WebMIDIAPIShim together with the Jazz plugin';
        divOutputs.innerHTML = '';
    }


    function showMIDIPorts() {
        var
            html,
            checkbox,
            checkboxes,
            inputs, outputs,
            i, maxi;

        inputs = midiAccess.inputs;
        html = '<h4>midi inputs:</h4>';
        inputs.forEach(function (port) {
            html += '<label><input type="checkbox" id="' + port.type + port.id + '">' + port.name + ' (' + port.state + ', ' + port.connection + ')</label><br>';
        });
        divInputs.innerHTML = html;

        outputs = midiAccess.outputs;
        html = '<h4>midi outputs:</h4>';
        outputs.forEach(function (port) {
            html += '<label><input type="checkbox" id="' + port.type + port.id + '">' + port.name + ' (' + port.state + ', ' + port.connection + ')</label><br>';
        });
        divOutputs.innerHTML = html;

        checkboxes = document.querySelectorAll('#inputs input[type="checkbox"]');
        for (i = 0, maxi = checkboxes.length; i < maxi; i++) {
            checkbox = checkboxes[i];
            checkbox.addEventListener('change', checkboxMIDIInOnChange, false);
        }

        checkboxes = document.querySelectorAll('#outputs input[type="checkbox"]');
        for (i = 0, maxi = checkboxes.length; i < maxi; i++) {
            checkbox = checkboxes[i];
            checkbox.addEventListener('change', checkboxMIDIOutOnChange, false);
        }
    }


    // handle incoming MIDI messages
    function inputListener(midimessageEvent) {
        var port, portId,
            data = midimessageEvent.data,
            type = data[0],
            data1 = data[1],
            data2 = data[2];

        // do something graphical with the incoming midi data
        divLog.innerHTML = type + ' ' + data1 + ' ' + data2 + '<br>' + divLog.innerHTML;

        for (portId in activeOutputs) {
            if (activeOutputs.hasOwnProperty(portId)) {
                port = activeOutputs[portId];
                port.send(data);
            }
        }
    }


    checkboxMIDIInOnChange = function () {
        // port id is the same a the checkbox id
        var id = this.id;
        var port = midiAccess.inputs.get(id.replace('input', ''));
        var cb = this;
        if (this.checked === true) {
            activeInputs[id] = port;
            port.addEventListener('midimessage', inputListener, false);
            port.addEventListener('statechange', function () {
                cb.nextSibling.nodeValue = port.name + ' (' + port.state + ', ' + port.connection + ')';
            }, false);
            // we have to open the port explicitly because we don't use port.onmidimessage this time
            port.open();
        } else {
            delete activeInputs[id];
            // port.close() will also remove all eventlisteners
            port.close();
        }
    };


    checkboxMIDIOutOnChange = function () {
        // port id is the same a the checkbox id
        var id = this.id;
        var port = midiAccess.outputs.get(id.replace('output', ''));
        var cb = this;
        if (this.checked === true) {
            activeOutputs[id] = port;
            port.addEventListener('statechange', function () {
                cb.nextSibling.nodeValue = port.name + ' (' + port.state + ', ' + port.connection + ')';
            }, false);
            port.open();
        } else {
            delete activeOutputs[id];
            port.close();
        }
    };
};
