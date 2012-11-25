module.exports = function( app, name, f ) {
  var _ = require('underscore');
  var g = f.properties;
  var a = f.properties.apps[ name ];

  var app_js = f.persist.getClientSource();

  app.use( "/app.js", function( request, response, next ) {
    response.writeHead( 200, {
      'Content-Type': 'text/javascript',
      'Content-Length': app_js.length
    } );
    response.end( app_js );
  } );
};