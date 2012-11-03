( function ( ) {
  function persona ( options ) {
    this.id = options.id;
    this.name = options.name;
    this.user = options.user;
  }

  if( module && module.exports ) { 
    module.exports = persona;
  }

  persona.name = "persona";
  persona.schema = {
    items: {
      id: "INT NOT NULL AUTO_INCREMENT",
      user: "INT NOT NULL DEFAULT 1",
      name: "VARCHAR(80) NOT NULL DEFAULT ''"
    },
    key: 'id',
    created: true,
    insert: [
      {
        id: 1,
        user: 1,
        name: "Anonymous Persona"
      },
      {
        user: 2,
        name: "Meadhbh Hamrick"
      },
      {
        user: 2,
        name: "Meadhbh Octopodidae"
      },
      {
        user: 3,
        name: "William Shatner"
      },
      {
        user: 3,
        name: "Captain Kirk"
      }
    ]
  };

  persona.prototype.toString = function ( ) {
    var rv = this.id + ":" + this.name;
    if( this.userImpl ) {
      rv += "(" + this.userImpl.toString() + ")";
    }
    return( rv );
  }

  persona.prototype.loadUser = function ( complete ){
    var that = this;

    if( persona.dao ) {
      persona.dao.userRead( { id: this.user }, function( err, data ) {
        if( err ) { return complete( err ); }
        if( data && data.length > 0 ) {
          that.userImpl = data[0];
          complete( null, that );
        }
      } );
    }

  }
} ) ( );