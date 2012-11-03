( function ( ) {
  function user ( options ) {
    this.id = options.id;
    this.name = options.name;
  }

  if( module && module.exports ) { 
    module.exports = user;
  }

  user.name = "user";
  user.schema = {
    items: {
      id: "INT NOT NULL AUTO_INCREMENT",
      name: "VARCHAR(80) NOT NULL DEFAULT ''"
    },
    key: 'id',
    created: true,
    insert: [
      {
        id: 1,
        name: "Anonymous User"
      },
      {
        id: 2,
        name: "Meadhbh Hamrick"
      },
      {
        id: 3,
        name: "William Shatner"
      }
    ]
  };
  user.prototype.toString = function ( ) {
    return( this.id + ":" + this.name );
  }
} ) ( );