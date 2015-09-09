/*
  Simple test that just prints all connected MIDI devices
*/

window.onload = function(){

  'use strict';

  var div = document.getElementById('container');
  var midiAccess;

  if(navigator.requestMIDIAccess !== undefined){
    navigator.requestMIDIAccess().then(
      function onFulfilled(access){
        midiAccess = access;
        // create a list of all connected MIDI devices
        showMIDIPorts();
        // reload list as devices get connected or disconnected
        midiAccess.onstatechange = showMIDIPorts;
      },
      function onRejected(e){
        // something went wrong while requesting the MIDI devices
        div.innerHTML = e.message;
      }
    );
  }else{
    // browsers without WebMIDI API and Jazz plugin
    div.innerHTML = 'No access to MIDI devices: browser does not support WebMIDI API, please use the WebMIDIAPIShim together with the Jazz plugin';
  }


  function showMIDIPorts(){
    var
      divInputs = document.getElementById('inputs'),
      divOutputs = document.getElementById('outputs'),
      inputs = midiAccess.inputs,
      outputs = midiAccess.outputs,
      html;

    html = '<h4>midi inputs:</h4>';
    inputs.forEach(function(port){
      html += port.name + '<br>';
      html += '<span class="small">manufacturer: ' + port.manufacturer + '</span><br>';
      html += '<span class="small">version: ' + port.version + '</span><br>';
      html += '<span class="small">id: ' + port.id + '</span><br><br>';
    });
    divInputs.innerHTML = html;

    html = '<h4>midi outputs:</h4>';
    outputs.forEach(function(port){
      html += port.name + '<br>';
      html += '<span class="small">manufacturer: ' + port.manufacturer + '</span><br>';
      html += '<span class="small">version: ' + port.version + '</span><br>';
      html += '<span class="small">id: ' + port.id + '</span><br><br>';
    });
    divOutputs.innerHTML = html;
  }
};