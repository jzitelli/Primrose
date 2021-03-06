/* global pliny, Primrose, devicePixelRatio */
function scroller ( id ) {
  document.getElementById( id ).scrollIntoView( {
    block: "top",
    behavior: "smooth"
  } );
}

( function () {
  "use strict";

  var docSearch = document.getElementById( "docSearch" ),
      nav = document.querySelector( "#contents nav > ul" ),
      doc = document.querySelector( "#documentation" ),
      main = document.querySelector( "main" ),
      docoCache = {
        "": doc.innerHTML,
        "#Global": pliny.formats.html.format( pliny.database )
      };

  var groupings = {
    pages: [ ],
    tutorials: [ ],
    examples: [ ],
    namespaces: [ pliny.database ],
    classes: [ ],
    methods: [ ],
    events: [ ],
    functions: [ ],
    enumerations: [ ],
    records: [ ],
    issues: [ ]
  };

  function search () {
    var lists = document.querySelectorAll( "#contents li ul" );
    for ( var i = 0; i < lists.length; ++i ) {
      var list = lists[i];
      var elems = list.querySelectorAll( "li" ),
          search = this.value.toLocaleLowerCase(),
          visibleCount = 0;
      for ( var j = 0; j < elems.length; ++j ) {
        var e = elems[j];
        if ( e && e.dataset && e.dataset.name ) {
          var b = e.dataset.name.toLocaleLowerCase(),
              visible = ( search.length === 0 || b.indexOf( search ) > -1 );
          if ( visible ) {
            ++visibleCount;
            e.style.display = "";
          }
          else {
            e.style.display = "none";
          }
        }
      }
      if ( visibleCount === 0 ) {
        list.parentElement.style.display = "none";
      }
      else {
        list.parentElement.style.display = "";
      }
    }
  }

  var editors = [ ];

  function editorFocused ( evt ) {
    for ( var i = 0; i < editors.length; ++i ) {
      if ( editors[i] !== evt.target ) {
        editors[i].blur();
      }
    }
  }

  var GRAMMAR_TEST = /^grammar\("(\w+)"\);\n/;
  function replacePreBlocks () {
    var codeBlocks = doc.querySelectorAll( "pre" );
    while ( editors.length < codeBlocks.length ) {
      editors.push( new Primrose.Text.Controls.TextBox( "editor" + editors.length, {
        autoBindEvents: true,
        keyEventSource: window,
        readOnly: true,
        tokenizer: Primrose.Text.Grammars.PlainText
      } ) );
      editors[editors.length - 1].addEventListener( "focus", editorFocused );
    }
    for ( var i = 0; i < codeBlocks.length; ++i ) {
      var ed = editors[i],
          b = codeBlocks[i],
          fs = parseFloat( document.defaultView.getComputedStyle( b, null ).getPropertyValue( "font-size" ) ),
          txt = b.textContent || b.innerText,
          grammarSpec = txt.match( GRAMMAR_TEST ),
          tokenizer = Primrose.Text.Grammars.PlainText;
      if ( grammarSpec ) {
        var grammarName = grammarSpec[1];
        tokenizer = Primrose.Text.Grammars[grammarName] || tokenizer;
        txt = txt.replace( GRAMMAR_TEST, "" );
      }
      ed.tokenizer = tokenizer;
      ed.setSize( b.clientWidth, Math.min( b.clientHeight * ( 1.25 + devicePixelRatio * 0.05 ), 400 ) );
      ed.targetSize = fs;
      setFontSize( ed );
      ed.value = txt;
      ed.DOMElement.style.display = "block";
      ed.DOMElement.style.maxWidth = "100%";
      b.parentElement.replaceChild( ed.DOMElement, b );
    }
    for ( var i = codeBlocks.length; i < editors.length; ++i ) {
      var ed = editors[i];
      ed.DOMElement.style.display = "none";
    }
  }
  function setFontSize ( ed ) {
    ed.fontSize = ed.targetSize * devicePixelRatio;
  }
  window.addEventListener( "resize", function () {
    editors.forEach( setFontSize );
  } );

  function fixLinks () {
    var links = doc.querySelectorAll( "a" );
    for ( var i = 0; i < links.length; ++i ) {
      var link = links[i],
          url = new URL( link.href );
      if ( url.host !== document.location.host || url.pathname !== document.location.pathname ) {
        link.target = "_blank";
      }
    }
    links = nav.querySelectorAll( "a" );
    for ( var i = 0; i < links.length; ++i ) {
      var link = links[i],
          url = new URL( link.href );
      if ( url.host === document.location.host && url.pathname === document.location.pathname ) {
        if ( url.hash === document.location.hash && !link.classList.contains( "selected" ) ) {
          link.classList.add( "selected" );
        }
        else if ( url.hash !== document.location.hash && link.classList.contains( "selected" ) ) {
          link.classList.remove( "selected" );
        }
      }
    }
  }

  function createShortcuts () {
    var headers = doc.querySelectorAll( "h1, h2, h3, h4, h5, h6" );

    // We want 3 or more headers because A) the first header is the page title,
    // and B) we don't want to handle the trivial situation of only one section.
    if ( headers.length > 2 ) {
      var curLevel = 0,
          lists = [ ],
          root = document.createElement( "nav" ),
          elem = root;

      // Start at 1 to skip the page title.
      for ( var i = 1; i < headers.length; ++i ) {
        var h = headers[i],
            level = parseFloat( h.tagName.match( /\d/ )[0] ) - 1,
            txt = h.innerText || h.textContent;

        if ( level > curLevel ) {
          var list = document.createElement( "ul" );
          elem.appendChild( list );
          lists.push( list );
          ++curLevel;
          list.isIssue = elem.innerHTML.indexOf( "Issues" ) >= 0;
        }
        else if ( level < curLevel ) {
          lists.pop();
          --curLevel;
        }

        var curList = lists[lists.length - 1];
        if ( !curList.isIssue ) {
          var link = document.createElement( "a" ),
              elem = document.createElement( "li" );
          link.appendChild( document.createTextNode( txt ) );
          link.href = "javascript:scroller(\"header" + i + "\")";
          h.id = "header" + i;
          elem.appendChild( link );
          curList.appendChild( elem );
        }
      }

      headers[1].parentElement.insertBefore( root, headers[1] );
    }
  }

  function showHash ( evt ) {
    doc.innerHTML = docoCache[document.location.hash] || ( "Not found: " + document.location.hash );
    replacePreBlocks();
    fixLinks();
    createShortcuts();
    if ( evt ) {
      scroller( "documentation" );
    }
  }

  function paint () {
    requestAnimationFrame( paint );
    for ( var i = 0; i < editors.length; ++i ) {
      var ed = editors[i];
      if ( main.clientHeight + main.scrollTop > ed.DOMElement.offsetTop ) {
        ed.update();
        ed.render();
      }
    }
  }
  requestAnimationFrame( paint );

  // Walk the documentation database, grouping different objects by type.
  function buildDocumentation () {
    var stack = [ pliny.database ];
    while ( stack.length > 0 ) {
      var collections = stack.shift();
      for ( var key in collections ) {
        if ( groupings[key] ) {
          var collection = collections[key],
              group = groupings[key];
          for ( var i = 0; i < collection.length; ++i ) {
            var obj = collection[i];
            if ( key === "pages" && obj.fullName.indexOf( "Tutorial:" ) === 0 ) {
              obj.name = obj.name.substring( 10 );
              groupings.tutorials.push( obj );
            }
            else {
              group.push( obj );
            }
            docoCache["#" + obj.id.trim()] = pliny.formats.html.format( obj ).replace( /<under construction>/g, "&lt;under construction>" ) + "<a href=\"javascript:scroller('top')\">top</a>";
            // This is called "trampolining", and is basically a way of performing
            // recursion in languages that do not support automatic tail recursion.
            // Which is ECMAScript 5. Supposedly it's coming in ECMAScript 6. Whatever.
            stack.push( obj );
          }
        }
      }
    }
  }

  function renderDocs () {
    buildDocumentation();
    groupings.pages.unshift( {id: "", fullName: "Getting Started"} );
    // Build the menu.
    groupings.examples = pliny.database.examples || [ ];
    var output = "";
    for ( var g in groupings ) {
      if ( g !== "methods" && g !== "events" ) {
        var group = groupings[g];
        if ( g !== "pages" && g !== "tutorials" ) {
          group.sort( function ( a, b ) {
            var c = a.fullName,
                d = b.fullName;
            if ( c === "[Global]" ) {
              c = "A" + c;
            }
            if ( d === "[Global]" ) {
              d = "A" + d;
            }
            if ( c > d ) {
              return 1;
            }
            else if ( c < d ) {
              return -1;
            }
            else {
              return 0;
            }
          } );
        }

        output += "<li><h2>";
        if ( g === "issues" ) {
          output += "Open Issues (" + group.length + ")";
        }
        else {
          output += g;
        }
        output += "</h2><ul>";
        for ( var i = 0; i < group.length; ++i ) {
          var obj = group[i];
          if ( g !== "issues" || obj.type === "open" ) {
            var id = "#" + obj.id.trim(),
                doc = docoCache[id];
            output += "<li data-name=\"" + obj.fullName + "\"><a href=\"" + id + "\"";
            if ( doc && doc.indexOf( "&lt;under construction>" ) > -1 ) {
              output += " class=\"incomplete\"";
            }
            output += ">" + obj.fullName + "</a></li>";
          }
        }
        output += "</ul></li>";
      }
    }
    nav.innerHTML = output;
    showHash();
    search.call( docSearch );
  }

  // Setup the navigation events
  docSearch.addEventListener( "keyup", search, false );
  docSearch.addEventListener( "search", search, false );
  window.addEventListener( "hashchange", showHash, false );

  Primrose.Text.Themes.Default.regular.unfocused = "transparent";

  pliny.load( [
    "setup",
    "faq",
    "editorVRManual",
    "hmd",
    "webvr",
    "sync",
    "pliny",
    "../CHANGELOG",
    "../LICENSE",
    "../CONTRIBUTORS",
    "lighting",
    "drum",
    "video",
    "export",
    "blenderBeginner",
    "blenderAdvanced",
    "editorVRTutorial",
    "adventure",
    "server"
  ].map( function ( f ) {
    return f + ".md";
  } ) ).then( renderDocs );
} )();