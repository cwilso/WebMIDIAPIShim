/* eslint no-underscore-dangle: 0 */

/*
  Creates instances of the Jazz plugin if necessary. Initially the MIDIAccess creates one main Jazz instance that is used
  to query all initially connected devices, and to track the devices that are being connected or disconnected at runtime.

  For every MIDIInput and MIDIOutput that is created, MIDIAccess queries the getJazzInstance() method for a Jazz instance
  that still have an available input or output. Because Jazz only allows one input and one output per instance, we
  need to create new instances if more than one MIDI input or output device gets connected.

  Note that an existing Jazz instance doesn't get deleted when both its input and output device are disconnected; instead it
  will be reused if a new device gets connected.
*/

import Store from './store';
import { getDevice } from './util';

const jazzPluginInitTime = getDevice().browser === 'firefox' ? 200 : 100; // 200 ms timeout for Firefox v.55

let jazzInstanceNumber = 0;
const jazzInstances = new Store();


export function createJazzInstance(callback) {
    const id = `jazz_${jazzInstanceNumber}_${Date.now()}`;
    jazzInstanceNumber += 1;
    let objRef;
    let activeX;

    if (getDevice().nodejs === true) {
        // jazzMidi is added to the global variable navigator in the node environment
        objRef = new navigator.jazzMidi.MIDI();
    } else {
        /*
            generate this html:

            <object id="Jazz1" classid="CLSID:1ACE1618-1C7D-4561-AEE1-34842AA85E90" class="hidden">
                <object id="Jazz2" type="audio/x-jazz" class="hidden">
                    <p style="visibility:visible;">This page requires <a href=http://jazz-soft.net>Jazz-Plugin</a> ...</p>
                </object>
            </object>
        */

        activeX = document.createElement('object');
        activeX.id = `${id}ie`;
        activeX.classid = 'CLSID:1ACE1618-1C7D-4561-AEE1-34842AA85E90';

        objRef = document.createElement('object');
        objRef.id = id;
        objRef.type = 'audio/x-jazz';

        activeX.appendChild(objRef);

        const p = document.createElement('p');
        p.appendChild(document.createTextNode('This page requires the '));

        const a = document.createElement('a');
        a.appendChild(document.createTextNode('Jazz plugin'));
        a.href = 'http://jazz-soft.net/';

        p.appendChild(a);
        p.appendChild(document.createTextNode('.'));

        objRef.appendChild(p);

        let insertionPoint = document.getElementById('MIDIPlugin');
        if (!insertionPoint) {
            // Create hidden element
            insertionPoint = document.createElement('div');
            insertionPoint.id = 'MIDIPlugin';
            insertionPoint.style.position = 'absolute';
            insertionPoint.style.visibility = 'hidden';
            insertionPoint.style.left = '-9999px';
            insertionPoint.style.top = '-9999px';
            document.body.appendChild(insertionPoint);
        }
        insertionPoint.appendChild(activeX);
    }


    setTimeout(() => {
        let instance = null;
        if (objRef.isJazz === true) {
            instance = objRef;
        } else if (activeX.isJazz === true) {
            instance = activeX;
        }
        if (instance !== null) {
            instance._perfTimeZero = performance.now();
            jazzInstances.set(jazzInstanceNumber, instance);
        }
        callback(instance);
    }, jazzPluginInitTime);
}


export function getJazzInstance(type, callback) {
    const key = type === 'input' ? 'inputInUse' : 'outputInUse';
    let instance = null;

    const values = jazzInstances.values();
    for (let i = 0; i < values.length; i += 1) {
        const inst = values[i];
        if (inst[key] !== true) {
            instance = inst;
            break;
        }
    }

    if (instance === null) {
        createJazzInstance(callback);
    } else {
        callback(instance);
    }
}
