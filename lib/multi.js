function JazzInstance() {
	this.inputInUse = false;
	this.outputInUse = false;

	// load the Jazz plugin
    var o1 = document.createElement("object");
    o1.id = "_Jazz1";
    o1.classid = "CLSID:1ACE1618-1C7D-4561-AEE1-34842AA85E90";

    this.activeX = o1;

    var o2 = document.createElement("object");
    o2.id = "_Jazz2"; 
    o2.type="audio/x-jazz";
    o1.appendChild(o2);

	this.objRef = o2;

    var e = document.createElement("p");
    e.appendChild(document.createTextNode("This page requires the "));

    var a = document.createElement("a");
    a.appendChild(document.createTextNode("Jazz plugin"));
    a.href = "http://jazz-soft.net/";

    e.appendChild(a);
    e.appendChild(document.createTextNode("."));
    o2.appendChild(e);

    var insertionPoint = document.getElementById("MIDIPlugin");
    if (!insertionPoint)
        insertionPoint = document.body;
    insertionPoint.appendChild(o1);
}

MIDIAccess.prototype._createAnInputPort = function() {
	var obj = new JazzInstance();
	this.jazzInstances.push( obj );
	return obj;
}

MIDIAccess.prototype._findAnInputPort = function() {
  for (var i=0; i<this.jazzInstances.length; i++) {
  	if (!jazzInstances[i].inputInUse) {
  		jazzInstances[i].inputInUse = true;
  		return jazzInstances[i];
  	}
  }
  var obj=_createAnInputPort();
}