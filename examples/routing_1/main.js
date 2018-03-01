window.onload = function () {
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
                midiAccess.onstatechange = function (e) {
                    var port = e.port;
                    var div = port.type === 'input' ? divInputs : divOutputs;
                    var listener = port.type === 'input' ? checkboxMIDIInOnChange : checkboxMIDIOutOnChange;
                    var activePorts = port.type === 'input' ? activeInputs : activeOutputs;
                    var checkbox = document.getElementById(port.type + port.id);
                    var label;

                    // device disconnected
                    if (port.state === 'disconnected') {
                        port.close();
                        label = checkbox.parentNode;
                        checkbox.nextSibling.nodeValue = port.name + ' (' + port.state + ', ' + port.connection + ')';
                        checkbox.disabled = true;
                        checkbox.checked = false;
                        delete activePorts[port.type + port.id];

                        // new device connected
                    } else if (checkbox === null) {
                        label = document.createElement('label');
                        checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = port.type + port.id;
                        checkbox.addEventListener('change', listener, false);
                        label.appendChild(checkbox);
                        label.appendChild(document.createTextNode(port.name + ' (' + port.state + ', ' + port.connection + ')'));
                        div.appendChild(label);
                        div.appendChild(document.createElement('br'));

                        // device opened or closed
                    } else if (checkbox !== null) {
                        label = checkbox.parentNode;
                        checkbox.disabled = false;
                        checkbox.nextSibling.nodeValue = port.name + ' (' + port.state + ', ' + port.connection + ')';
                    }
                };
            },

            function onRejected(e) {
                divInputs.innerHTML = e.message;
                divOutputs.innerHTML = '';
            }
        );
    }

    // browsers without WebMIDI API or Jazz plugin
    else {
        divInputs.innerHTML = 'No access to MIDI devices: browser does not support WebMIDI API, please use the WebMIDIAPIShim together with the Jazz plugin';
        divOutputs.innerHTML = '';
    }


    function showMIDIPorts() {
        var
            html,
            checkbox,
            checkboxes,
            inputs,
            outputs,
            i,
            maxi;

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
        var port,
            portId,
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
        if (this.checked === true) {
            activeInputs[id] = port;
            // implicitly open port by adding an onmidimessage listener
            port.onmidimessage = inputListener;
        } else {
            delete activeInputs[id];
            port.close();
        }
    };


    checkboxMIDIOutOnChange = function () {
        // port id is the same a the checkbox id
        var id = this.id;
        var port = midiAccess.outputs.get(id.replace('output', ''));
        if (this.checked === true) {
            activeOutputs[id] = port;
            port.open();
        } else {
            delete activeOutputs[id];
            port.close();
        }
    };
};
