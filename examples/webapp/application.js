( function () {
  var fs        = require( 'fs' );
  var templates = require( './templates.js' );
  var path      = require( 'path' );

  var _aopts = {
    flags: "a+",
    encoding: "UTF-8",
    mode: 0666
  };

  module.exports = function ( element, current, facilities ) {
    var server_impl = current.server ? current.server : 'connect';
    var server = require( server_impl );

    var app = server();

    if( current.favicon ) {
      app.use( server.favicon( current.favicon.path ) );
    }

    if( current.access ) {
      if( current.access.path ) {
        current.access.stream = fs.createWriteStream( current.access.path, _aopts );
      }
      app.use( server.logger( current.access ) );
    }

    if( current.body ) {
      app.use( server.bodyParser() );
    }

    if( current.router ) {
      app.use( app.router );
    }

    if( current.source ) {
      require( path.join( process.cwd(), current.source ) ) ( app, element, facilities );
    }

    if( current.views ) {
      current.views.path && app.set( 'views', current.views.path );
      current.views.engine && app.set( 'view engine', current.views.engine );
    }

    if( current.templates ) {
      app.use( "/templates", ( new templates( current.templates ) ).middleware( ) );
    }

    if( current.static && current.static.path ) {
      app.use( server.static( current.static.path, current.static ) );
    }
    
    // what a hack. if we don't do this, then the static middleware
    // renders its own substandard error page

    app.use( function( request, response, next ) {
      next( 404 );
    } );

    app.use( function( error, request, response, next ) {
      if( 404 == error ) {
        if( current.views ) {
          response.render( '404', {site: current.info, path:request.url} );
        } else {
          _text( 404, '404 Not Found [' + request.url + ']' );
        }
      } else {
        var e = error ? error : {};
        var stack = e.stack ? e.stack : '';
        var msg = e.message ? e.message : '';
        if( current.views ) {
          response.render( '500', {site: current.info, path:request.url, message: msg, stack: stack} );
        } else {
          _text( 500, '500 Internal Server Error [' + request.url + ']\n' + msg + '\n' + stack );
        }
      }

      function _text( e, m ) {
        response.writeHead( e, { 'Content-Length': m.length, 'Content-Type': 'text/plain' } );
        response.end( m );
      }
    } );

    if( current.listen && current.listen.port ) {
      app.listen( current.listen.port, current.listen.host );
    }
  };
} ) ();
