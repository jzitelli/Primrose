/* global Primrose, put */
var app = new Primrose.VRApplication( "My Primrose VR Application", {
  skyTexture: "/examples/images/bg.jpg",
  groundTexture: "/examples/images/deck.png"
} );

app.addEventListener( "ready", function () {
  // Perform any post-initialization setup. Once this event fires, the Primrose
  // framework is ready and will start animation as soon as this function returns.
} );

app.addEventListener( "gazecomplete", function ( evt ) {
  // You can respond to "intended stare" events here, i.e. when the user gazes
  // at a particular object for an extended period of time. Usually, about three
  // seconds.
} );

app.addEventListener( "pointerend", function ( evt ) {
  // You can respond to the user "clicking" an object here. This could be by using
  // a mouse on their desktop PC or by touching the screen while looking at an
  // object on a mobile device.
} );

app.addEventListener( "update", function ( dt ) {
  // Perform per-frame updates here, like moving objects around according to your
  // own rules.
} );