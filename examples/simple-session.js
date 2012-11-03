( function ( ) {
  function session ( options ) {
    this.id = options.id;
    this.persona = options.persona;
    this.expires = options.expires;
  }

  if( module && module.exports ) { 
    module.exports = session;
  }

  session.name = "session";
  session.schema = {
    items: {
      id: "INT NOT NULL AUTO_INCREMENT",
      persona: "INT NOT NULL DEFAULT '1'"
    },
    key: 'id',
    expires: true
  };

  session.prototype.toString = function ( ) {
    return( "session: " + this.id + " persona: " + this.persona + " expires: " + this.expires );
  }
} ) ( );