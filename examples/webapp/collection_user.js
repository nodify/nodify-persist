( function() {
  var persist = require('../../nodify-persist')
  var persistent = persist.persistent.mysql;

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
      uname: "VARCHAR(80) NOT NULL DEFAULT ''",
      uuid: "VARCHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'"
    },
    key: 'uid',
    created: true,
    insert: [ { uid: 1, uname: 'Anonymous User' } ]
  };

  user.prototype = new persistent( null, user.schema );

  user.prototype.toString = function () {
    var output = "User(" + this.uuid + ") " + this.uname;
    return output;
  };
} ) ();