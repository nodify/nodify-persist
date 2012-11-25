( function () {
  var _ = require( 'underscore' );
  var persistent = require( '../../nodify-persist' ).persistent.mysql;
  var session = require( './collection_session' );

  function user ( context ) {
    persistent.call( this, context );
  }

  if( module && module.exports ) {
    module.exports = user;
  }

  user.schema = {
    name: "_user",
    table: {
      uid: "INT NOT NULL AUTO_INCREMENT",
      uname: "VARCHAR(80) NOT NULL DEFAULT ''"
    },
    key: 'uid',
    created: true,
    insert: [ { uid: 1, uname: 'Anonymous User' } ],
    relations: {
      "session": {
        "local": {
          "members": [ "uid", "uname" ]
        },
        "foreign": {
          "table": "_session",
          "members": [ "sid" ],
          "key": { "uid": "user" }
        }
      }
    }
  };

  user.prototype = new persistent( null, user.schema );

  user.prototype.toString = function () {
    var output = "User(" + this.uid + ") " + this.uname;
    if( this.sessions ) {
      _.each( this.sessions, function( item ) {
        output += "\n " + item.toString();
      } );
    }
    return output;
  };

  user.prototype._loadSessions = function( _callback ) {
    var that = this;
    this._viewSession( function( err, data ) {
      that.sessions = [];
      _.each( data, function( item ) {
        that.sessions.push( new session( {sid: item.sid, user: item.uid} ) );
      } );
      _callback( null );
    } );
  };

} ) ();