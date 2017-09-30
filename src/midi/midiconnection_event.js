export default class MIDIConnectionEvent {
    constructor(midiAccess, port) {
        this.bubbles = false;
        this.cancelBubble = false;
        this.cancelable = false;
        this.currentTarget = midiAccess;
        this.defaultPrevented = false;
        this.eventPhase = 0;
        this.path = [];
        this.port = port;
        this.returnValue = true;
        this.srcElement = midiAccess;
        this.target = midiAccess;
        this.timeStamp = Date.now();
        this.type = 'statechange';
    }
}
