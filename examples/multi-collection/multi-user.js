( function ( ) {

  var persona = require( './multi-persona' );
  var _ = require( 'underscore' );

  function user ( options ) {
    this.uid = options.uid;
    this.uname = options.uname;
  }

  if( module && module.exports ) { 
    module.exports = user;
  }

  user.schema = {
    name: "user",
    table: {
      uid: "INT NOT NULL AUTO_INCREMENT",
      uname: "VARCHAR(80) NOT NULL DEFAULT ''"
    },
    relations: {
      "persona": {
        "local": {
          "members": [ "uid", "uname" ]
        },
        "foreign": {
          "table": "persona",
          "members": [ "pid", "pname" ],
          "key": { "uid": "user" }
        }
      }
    },
    key: 'uid',
    created: true,
    insert: [
      { uid: 1, uname: "Anonymous User" },
      { uid: 2, uname: "Meadhbh Hamrick" },
      { uid: 3, uname: "William Shatner" }
    ]
  };

  user.prototype.loadPersonas = function( _complete ) {
    var that = this;
    user.dao.userViewPersona( { uid: this.uid }, function( err, data ) {
      if( err ) { return _complete( err, null ); }
      that.personas = [];
      _.each( data, function ( item ) {
        item.user = item.uid;
        that.personas.push( new persona( item ) );
      } );
      _complete( null, that );
    } );
  };

  user.prototype.toString = function ( ) {
    var output = "User(" + this.uid + ") " + this.uname;
    if( this.personas ) {
      _.each( this.personas, function( item ) {
        output += "\n " + item.toString(); 
      } );
    }
    return( output );
  }

} ) ( );