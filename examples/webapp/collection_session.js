( function() {
  var persist = require('../../nodify-persist')
  var persistent = persist.persistent.mysql;

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
      uuid: "VARCHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'"
    },
    key: 'sid',
    created: true,
    insert: [ { sid: 1 } ]
  };

  session.prototype = new persistent( null, session.schema );

  session.prototype.toString = function () {
    var output = "Session(" + this.sid + "," + this.uuid + ")";
    return output;
  };
} ) ();