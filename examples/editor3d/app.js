/* global isOSX, Primrose, THREE, isVR, isMobile, put, exp */

var GRASS = "/examples/images/grass.png",
    ROCK = "/examples/images/rock.png",
    SAND = "/examples/images/sand.png",
    WATER = "/examples/images/water.png",
    DECK = "/examples/images/deck.png",
    isHomeScreen = window.self !== window.top,
    editor = null,
    output = null,
    documentation = null,
    modA = isOSX ? "metaKey" : "ctrlKey",
    modB = isOSX ? "altKey" : "shiftKey",
    cmdA = isOSX ? "CMD" : "CTRL",
    cmdB = isOSX ? "OPT" : "SHIFT",
    cmdPre = cmdA + "+" + cmdB,
    subScene = new THREE.Object3D(),
    scriptUpdateTimeout,
    lastScript = null,
    scriptAnimate = null,
    app = new Primrose.VRApplication( "Editor3D", {
      disableAutoFullScreen: true,
      useFog: false,
      skyTexture: "/examples/images/bg2.jpg",
      groundTexture: "/examples/images/deck.png"
    } ),
    editorSphereY = app.avatarHeight - 0.25;

app.addEventListener( "ready", function () {
  app.scene.add( subScene );

  documentation = document.createElement( "pre" );
  documentation.innerHTML = getDocumentation();
  // Primrose will read the 3D transform from your CSS
  documentation.style.transform = "rotate3d(0, 1, 0, " +
      Math.PI / 4 + "rad) translate3d(-1em, " +
      editorSphereY + "em, -0.25em)";
  documentation = app.appendChild( documentation );

  output = document.createElement( "pre" );
  output = app.appendChild( output );
  // or you can set the transforms directly on the Three.js object
  output.mesh.position.set( 1, editorSphereY, -0.25 );
  output.mesh.rotation.set( 0, -Math.PI / 4, 0 );
  output.theme = Primrose.Text.Themes.Dark;
  output.fontSize = 32;

  editor = document.createElement( "textarea" );
  editor.value = getSourceCode( isHomeScreen );
  editor.style.transform = "translate3d(0, " + editorSphereY + "em, 0)";
  editor = app.appendChild( editor );

  log( "INSTRUCTIONS:" );
  log( " - " + cmdPre + "+E to show/hide editor" );
  log( " - " + cmdPre + "+X to reload original demo code" );
  log( " - Z to reset position/sensor" );
  log();
} );

app.addEventListener( "update", function ( dt ) {
  if ( !scriptUpdateTimeout ) {
    scriptUpdateTimeout = setTimeout( updateScript, 500 );
  }

  if ( scriptAnimate ) {
    try {
      scriptAnimate.call( app, dt );
    }
    catch ( exp ) {
      console.error( exp );
      log( "ERR: " + exp.message );
      scriptAnimate = null;
    }
  }
} );

app.addEventListener( "keydown", function ( evt ) {
  if ( evt[modA] && evt[modB] ) {
    if ( evt.keyCode === Primrose.Keys.E ) {
      documentation.mesh.visible = output.mesh.visible = editor.mesh.visible = !editor.mesh.visible;
      if ( !editor.mesh.visible && app.currentEditor && app.currentEditor.focused ) {
        app.currentEditor.blur( );
        app.currentEditor = null;
      }
    }
    else if ( evt.keyCode === Primrose.Keys.X ) {
      editor.value = getSourceCode( true );
    }
  }

  if ( scriptUpdateTimeout ) {
    clearTimeout( scriptUpdateTimeout );
    scriptUpdateTimeout = null;
  }
} );

window.addEventListener( "unload", function ( ) {
  var script = editor.value;
  if ( script.length > 0 ) {
    setSetting( "code", script );
  }
} );

function updateScript ( ) {
  var newScript = editor.value,
      exp;
  if ( newScript !== lastScript ) {
    lastScript = newScript;
    if ( newScript.indexOf( "function update" ) >= 0 &&
        newScript.indexOf( "return update" ) < 0 ) {
      newScript += "\nreturn update;";
    }
    try {
      log( "----- loading new script -----" );
      var scriptUpdate = new Function( "scene", newScript );
      for ( var i = subScene.children.length - 1; i >= 0; --i ) {
        subScene.remove( subScene.children[i] );
      }
      scriptAnimate = scriptUpdate.call( app, subScene );
      log( "----- script loaded -----" );
    }
    catch ( exp ) {
      console.error( exp );
      log( "ERR: " + exp.message );
      scriptAnimate = null;
    }
  }
  scriptUpdateTimeout = null;
}

function log (  ) {
  if ( output ) {
    var msg = Array.prototype.join.call( arguments, ", " ),
        t = output;
    t.value += msg + "\n";
    t.selectionStart = t.selectionEnd = t.value.length;
    t.scrollIntoView( t.frontCursor );
  }
}
;

function clrscr () {
  if ( output ) {
    var t = output;
    t.value = "";
    t.selectionStart = t.selectionEnd = t.value.length;
    t.scrollIntoView( t.frontCursor );
  }
}
;

var cmdLabels = document.querySelectorAll( ".cmdLabel" );
for ( var i = 0; i < cmdLabels.length; ++i ) {
  cmdLabels[i].innerHTML = cmdPre;
}

app.setFullScreenButton( "goVR", "click", true );
app.setFullScreenButton( "goRegular", "click", false );
app.ctrls.viewSource.addEventListener( "click", function () {
  var path = "https://github.com/capnmidnight/Primrose/tree/master" + document.location.pathname;
  path = path.replace( "index.html", "app.js" );
  window.open( path );
}, false );

function getSourceCode ( skipReload ) {
  var defaultDemo = testDemo.toString(),
      src = skipReload && defaultDemo || getSetting( "code", defaultDemo );
  // If there was no source code stored in local storage,
  // we use the script from a saved function and assume
  // it has been formatted with 2 spaces per-line.
  if ( src === defaultDemo ) {
    var lines = src.replace( "\r\n", "\n" ).split( "\n" );
    lines.pop( );
    lines.shift( );
    for ( var i = 0; i < lines.length; ++i ) {
      lines[i] = lines[i].substring( 2 );
    }
    src = lines.join( "\n" );
  }
  return src.trim();
}

function testDemo ( scene ) {
  var WIDTH = 5,
      HEIGHT = 5,
      DEPTH = 5,
      MIDX = WIDTH / 2,
      MIDY = HEIGHT / 2, MIDZ = DEPTH / 2,
      t = 0,
      start = put( hub() )
      .on( scene )
      .at( -MIDX, 0, -DEPTH - 2 );

  put( light( 0xffffff, 1, 500 ) )
      .on( start )
      .at( MIDX + 5, 8, MIDZ + 20 );

  var balls = [ ];

  for ( var i = 0; i < 10; ++i ) {
    balls.push( put( brick( WATER ) )
        .on( start )
        .at( Primrose.Random.int( WIDTH ),
            Primrose.Random.int( HEIGHT ),
            Primrose.Random.int( DEPTH ) ) );

    balls[i].velocity = v3(
        Primrose.Random.number( 0, WIDTH ),
        Primrose.Random.number( 0, HEIGHT ),
        Primrose.Random.number( 0, DEPTH ) );
  }

  function update ( dt ) {
    t += dt;
    for ( var i = 0; i < balls.length; ++i ) {
      var ball = balls[i];
      ball.position.add( ball.velocity.clone().multiplyScalar( dt ) );
      if ( ball.position.x < 0 && ball.velocity.x < 0
          || WIDTH <= ball.position.x && ball.velocity.x > 0 ) {
        ball.velocity.x *= -1;
      }
      if ( ball.position.y < 1 && ball.velocity.y < 0
          || HEIGHT <= ball.position.y && ball.velocity.y > 0 ) {
        ball.velocity.y *= -1;
      }
      if ( ball.position.z < 0 && ball.velocity.z < 0
          || DEPTH <= ball.position.z && ball.velocity.z > 0 ) {
        ball.velocity.z *= -1;
      }
    }
  }
}

// This is a function to just push it out of the way, uncluttering
// the code above.
function getDocumentation () {
  return "functions:\n" + "  log( msg );\n" + "    print a message to the window below the editor.\n" +
      "\n" +
      "  put( objectA ).on( objectB )[.at( x, y, z )];\n" +
      "    objectA: a THREE.Object3D to be added to another,\n" +
      "    objectB: a THREE.Object3D where objectA will be added,\n" +
      "    x, y, z: a location to set for objectA relative to objectB\n" +
      "\n" +
      "  light( color [, intensity[, distance[, decay]]] );\n" +
      "    creates a THREE.PointLight with the same parameters.\n" +
      "\n" +
      "  brick( txtName );\n" +
      "    creates a textured cube with the named texture, one of:\n" +
      "      [SAND, WATER, ROCK, GRASS, DECK].\n" +
      "\n" +
      "  quad( width[, height] );\n" +
      "    creates a THREE.PlaneBufferGeometry with the same parameters.\n" +
      "    if height is undefined, height is set to width (square).\n" +
      "\n" +
      "  box( width[, height, length] );\n" +
      "    creates a THREE.BoxGeometry with the same parameters.\n" +
      "    if height is undefined, height and length are set to width (cube).\n" +
      "\n" +
      "  hub( );\n" +
      "    creates a raw THREE.Object3D. Useful for combining objects.\n" +
      "\n" +
      "  sphere( radius[, slices, rings] );\n" +
      "    creates a THREE.SphereGeometry with the same parameters.\n" +
      "\n" +
      "  shell( radius[, slices, rings[, phi, theta]] );\n" +
      "    creates a portion of the inside surface of a sphere.\n" +
      "\n" +
      "  from( start ).to( end ).exec( thunk );\n" +
      "    iterates on the range [start, end), passing the index as the parameter\n" +
      "    to thunk, accumulating an array of thunk's return value.\n" +
      "\n" +
      "  textured( geometry, txt[, unshaded[, opacity[, txtRepeatS, txtRepeatT]]] );\n" +
      "    geometry: a THREE.Geometry object\n" +
      "    txt: a material definition of some kind. It could be a:\n" +
      "      number - a solid hex color\n" +
      "      string - a path to a texture image\n" +
      "      Primrose.Text.Controls.TextBox - a text editor\n" +
      "    unshaded: set to true to use constant lighting (default false)\n" +
      "    opacity: 1 - opaque, 0 - transparent (default 1).\n" +
      "    txtRepeatS: texture repeat in S direction (default 1).\n" +
      "    txtRepeat: texture repeat in T direction (default 1)";
}


/*
 TODO:
 
 
 
 var elems = [ ctrls.leftKey, ctrls.rightKey, ctrls.forwardKey, ctrls.backKey
 ];
 setupKeyOption( ctrls.leftKey, elems, 0, "A", 65 );
 setupKeyOption( ctrls.rightKey, elems, 1, "D", 68 );
 setupKeyOption( ctrls.forwardKey, elems, 2, "W", 87 );
 setupKeyOption( ctrls.backKey, elems, 3, "S", 83 );
 */