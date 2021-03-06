/* global Primrose, THREE, pliny, emit */

Primrose.BaseControl = ( function () {
  "use strict";

  var ID = 1;

  pliny.class( "Primrose", {
    name: "BaseControl",
    description: "The BaseControl class is the parent class for all 3D controls.\n\
It manages a unique ID for every new control, the focus state of the control, and\n\
performs basic conversions from DOM elements to the internal Control format."
  } );

  function BaseControl () {
    pliny.property( {
      name: "controlID",
      type: "Number",
      description: "Automatically incrementing counter for controls, to make sure there is a distinct differentiator between them all."
    } );
    this.controlID = ID++;

    pliny.property( {
      name: "focused",
      type: "Boolean",
      description: "Flag indicating this control has received focus. You should theoretically only read it."
    } );
    this.focused = false;

    pliny.property( {
      name: "listeners",
      type: "Object",
      description: "A bag of arrays that hold the callback functions for each event. The child class of BaseControl may add such arrays to this object. By default, includes listeners for focus and blur events."
    } );
    this.listeners = {
      focus: [ ],
      blur: [ ]
    };
  }

  pliny.method( "Primrose.BaseControl", {
    name: "addEventListener",
    description: "Adding an event listener registers a function as being ready to receive events.",
    parameters: [
      {name: "evt", type: "String", description: "The name of the event for which we are listening."},
      {name: "thunk", type: "Function", description: "The callback to fire when the event occurs."}
    ],
    examples: [ {
        name: "Add an event listener.",
        description: "The `addEventListener()` method operates nearly identically\n\
to the method of the same name on DOM elements.\n\
\n\
    grammar(\"JavaScript\");\n\
    var txt = new Primrose.Text.Controls.TextBox();\n\
    txt.addEventListener(\"mousemove\", console.log.bind(console, \"mouse move\"));\n\
    txt.addEventListener(\"keydown\", console.log.bind(console, \"key down\"));"
      } ]
  } );
  BaseControl.prototype.addEventListener = function ( event, func ) {
    if ( this.listeners[event] ) {
      this.listeners[event].push( func );
    }
  };

  pliny.method( "Primrose.BaseControl", {
    name: "focus",
    description: "Sets the focus property of the control, does not change the focus property of any other control.",
    examples: [ {
        name: "Focus on one control, blur all the rest",
        description: "When we have a list of controls and we are trying to track\n\
focus between them all, we must coordinate calls between `focus()` and `blur()`.\n\
\n\
    grammar(\"JavaScript\");\n\
    var ctrls = [\n\
      new Primrose.Text.Controls.TextBox(),\n\
      new Primrose.Text.Controls.TextBox(),\n\
      new Primrose.Text.Button()\n\
    ];\n\
\n\
    function focusOn(id){\n\
      for(var i = 0; i < ctrls.length; ++i){\n\
        var c = ctrls[i];\n\
        if(c.controlID === id){\n\
          c.focus();\n\
        }\n\
        else{\n\
          c.blur();\n\
        }\n\
      }\n\
    }"
      } ]
  } );
  BaseControl.prototype.focus = function () {
    this.focused = true;
    emit.call( this, "focus", {target: this} );
  };

  pliny.method( "Primrose.BaseControl", {
    name: "blur",
    description: "Unsets the focus property of the control, does not change the focus property of any other control.",
    examples: [ {
        name: "Focus on one control, blur all the rest",
        description: "When we have a list of controls and we are trying to track\n\
focus between them all, we must coordinate calls between `focus()` and `blur()`.\n\
\n\
    grammar(\"JavaScript\");\n\
    var ctrls = [\n\
      new Primrose.Text.Controls.TextBox(),\n\
      new Primrose.Text.Controls.TextBox(),\n\
      new Primrose.Text.Button()\n\
    ];\n\
    \n\
    function focusOn(id){\n\
      for(var i = 0; i < ctrls.length; ++i){\n\
        var c = ctrls[i];\n\
        if(c.controlID === id){\n\
          c.focus();\n\
        }\n\
        else{\n\
          c.blur();\n\
        }\n\
      }\n\
    }"
      }
    ]
  } );
  BaseControl.prototype.blur = function () {
    this.focused = false;
    emit.call( this, "blur", {target: this} );
  };

  var NUMBER_PATTERN = "([+-]?(?:(?:\\d+(?:\\.\\d*)?)|(?:\\.\\d+)))",
      DELIM = "\\s*,\\s*",
      UNITS = "(?:em|px)",
      TRANSLATE_PATTERN = new RegExp( "translate3d\\s*\\(\\s*" +
          NUMBER_PATTERN + UNITS + DELIM +
          NUMBER_PATTERN + UNITS + DELIM +
          NUMBER_PATTERN + UNITS + "\\s*\\)", "i" ),
      ROTATE_PATTERN = new RegExp( "rotate3d\\s*\\(\\s*" +
          NUMBER_PATTERN + DELIM +
          NUMBER_PATTERN + DELIM +
          NUMBER_PATTERN + DELIM +
          NUMBER_PATTERN + "rad\\s*\\)", "i" );


  pliny.method( "Primrose.BaseControl", {
    name: "copyElement",
    description: "Copies properties from a DOM element that the control is supposed to match.",
    parameters: [
      {name: "elem", type: "Element", description: "The element--e.g. a button or textarea--to copy."}
    ],
    examples: [ {
        name: "Rough concept",
        description: "The class is not used directly. Its methods would be used in a base\n\
class that implements its functionality.\n\
\n\
The `copyElement()` method gets used when a DOM element is getting \"converted\"\n\
to a 3D element on-the-fly.\n\
\n\
    grammar(\"JavaScript\");\n\
    var myDOMButton = document.querySelector(\"button[type='button']\"),\n\
      my3DButton = new Primrose.Button();\n\
    my3DButton.copyElement(myDOMButton);"
      }
    ]
  } );
  BaseControl.prototype.copyElement = function ( elem ) {
    this.element = elem;
    if ( elem.style.transform ) {
      var match = TRANSLATE_PATTERN.exec( elem.style.transform );
      if ( match ) {
        this.position.set(
            parseFloat( match[1] ),
            parseFloat( match[2] ),
            parseFloat( match[3] ) );
      }
      match = ROTATE_PATTERN.exec( elem.style.transform );
      if ( match ) {
        this.quaternion.setFromAxisAngle(
            new THREE.Vector3().set(
            parseFloat( match[1] ),
            parseFloat( match[2] ),
            parseFloat( match[3] ) ),
            parseFloat( match[4] ) );
      }
    }
  };

  pliny.issue( "Primrose.BaseControl", {
    name: "document BaseControl",
    type: "closed",
    description: "Finish writing the documentation for the [Primrose.BaseControl](#Primrose_BaseControl) class in the  directory"
  } );

  return BaseControl;
} )();