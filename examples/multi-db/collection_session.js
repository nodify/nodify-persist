( function () {
  var _ = require( 'underscore' );
  var persistent = require( '../../nodify-persist' ).persistent.mysql;

  function session ( context ) {
    persistent.call( this, context );
  }

  if( module && module.exports ) {
    module.exports = session;
  }

  session.schema = {
    name: "_session",
    table: {
      sid: "INT NOT NULL AUTO_INCREMENT",
      user: "INT NOT NULL DEFAULT 0"
    },
    key: 'sid',
    expires: true,
    insert: [
      { sid: 1, user: 1 }
    ]
  };

  session.prototype = new persistent( null, session.schema );

  session.prototype.toString = function () {
    return " Session(" + this.sid + ") " + this.user;
  };

} ) ();