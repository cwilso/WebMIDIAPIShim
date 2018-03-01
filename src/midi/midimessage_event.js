export default class MIDIMessageEvent {
    constructor(port, data, receivedTime) {
        this.bubbles = false;
        this.cancelBubble = false;
        this.cancelable = false;
        this.currentTarget = port;
        this.data = data;
        this.defaultPrevented = false;
        this.eventPhase = 0;
        this.path = [];
        this.receivedTime = receivedTime;
        this.returnValue = true;
        this.srcElement = port;
        this.target = port;
        this.timeStamp = Date.now();
        this.type = 'midimessage';
    }
}
