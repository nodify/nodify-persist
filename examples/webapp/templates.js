( function () {
  var fs = require( 'fs' );
  var path = require( 'path' );
  var _ = require( 'underscore' );

  function templates( path ) {
    var that = this;
    this.path = path;
    this.read();
    fs.watch( this.path, function( event, filename ) {
      if( 'change' == event ) {
        setTimeout( function () {
          that.read();
        }, 500 );
      }
    } );
  }

  if( module && module.exports ) {
    module.exports = templates;
  }

  templates.prototype.read = function () {
    this.templates = {};
    var re = /\_/g;
    _.each( fs.readdirSync( this.path ), function( item ) {
      this.templates[ item.split('.')[0].replace(re,'/') ] = fs.readFileSync( path.join( this.path, item ), 'utf8' );
    }, this );
  };

  templates.prototype.getTemplates = function () {
    return this.templates;
  };

  templates.prototype.middleware = function () {
    var that = this;

    return function( request, response, next ) {
      var output = JSON.stringify( that.getTemplates() );
      response.writeHead( 200, { "Content-Length": output.length,
                                 "Content-Type": 'application/json' } );
      response.end( output );
    };
  };
} )();