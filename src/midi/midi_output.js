/*
  MIDIOutput is a wrapper around an output of a Jazz instance
*/
import { getDevice } from '../util/util';
import Store from '../util/store';
import { dispatchEvent, getMIDIDeviceId } from './midi_access';

export default class MIDIOutput {
    constructor(info, instance) {
        this.id = getMIDIDeviceId(info[0], 'output');
        this.name = info[0];
        this.manufacturer = info[1];
        this.version = info[2];
        this.type = 'output';
        this.state = 'connected';
        this.connection = 'pending';
        this.onmidimessage = null;
        this.onstatechange = null;

        this._listeners = new Store();
        this._inLongSysexMessage = false;
        this._sysexBuffer = new Uint8Array();

        this._jazzInstance = instance;
        this._jazzInstance.outputInUse = true;
        if (getDevice().platform === 'linux') {
            this._jazzInstance.MidiOutOpen(this.name);
        }
    }

    open() {
        if (this.connection === 'open') {
            return;
        }
        if (getDevice().platform !== 'linux') {
            this._jazzInstance.MidiOutOpen(this.name);
        }
        this.connection = 'open';
        dispatchEvent(this); // dispatch MIDIConnectionEvent via MIDIAccess
    }

    close() {
        if (this.connection === 'closed') {
            return;
        }
        if (getDevice().platform !== 'linux') {
            this._jazzInstance.MidiOutClose();
        }
        this.connection = 'closed';
        dispatchEvent(this); // dispatch MIDIConnectionEvent via MIDIAccess
        this.onstatechange = null;
        this._listeners.clear();
    }

    send(data, timestamp) {
        let delayBeforeSend = 0;

        if (data.length === 0) {
            return false;
        }

        if (timestamp) {
            delayBeforeSend = Math.floor(timestamp - performance.now());
        }

        if (timestamp && (delayBeforeSend > 1)) {
            setTimeout(() => {
                this._jazzInstance.MidiOutLong(data);
            }, delayBeforeSend);
        } else {
            this._jazzInstance.MidiOutLong(data);
        }
        return true;
    }

    clear() {
        // to be implemented
    }

    addEventListener(type, listener) {
        if (type !== 'statechange') {
            return;
        }

        if (this._listeners.has(listener) === false) {
            this._listeners.add(listener);
        }
    }

    removeEventListener(type, listener) {
        if (type !== 'statechange') {
            return;
        }

        if (this._listeners.has(listener) === true) {
            this._listeners.delete(listener);
        }
    }

    dispatchEvent(evt) {
        this._listeners.forEach((listener) => {
            listener(evt);
        });

        if (this.onstatechange !== null) {
            this.onstatechange(evt);
        }
    }
}
