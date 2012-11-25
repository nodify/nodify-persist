( function () {
  var _ = require( 'underscore' );

  function part ( context ) {
    this.pid = context.pid;
    this.name = context.name;
  }

  if( module && module.exports ) {
    module.exports = part;
  }

  part.schema = {
    name: "_part",
    table: {
      pid: "INT NOT NULL AUTO_INCREMENT",
      name: "VARCHAR(80) NOT NULL DEFAULT ''"
    },
    key: 'pid',
    created: true
  };

  part.prototype.toString = function () {
    return
  };

} ) ();