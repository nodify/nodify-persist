( function ( ) {

  function persona ( options ) {
    this.pid = options.pid;
    this.pname = options.pname;
    this.user = options.user;
  }

  if( module && module.exports ) { 
    module.exports = persona;
  }

  persona.name = "persona";
  persona.schema = {
    name: "persona",
    table: {
      pid: "INT NOT NULL AUTO_INCREMENT",
      user: "INT NOT NULL DEFAULT 1",
      pname: "VARCHAR(80) NOT NULL DEFAULT ''"
    },
    relations: {
      "user": {
        "local": {
          "members": [ "pid", "pname" ]
        },
        "foreign": {
          "table": "user",
          "members": [ "uid", "uname" ],
          "key": { "user": "uid" }
        }
      }
    },
    key: 'pid',
    created: true,
    insert: [
      { pid: 1, user: 1, pname: "Anonymous Persona" },
      { user: 2, pname: "Meadhbh Hamrick" },
      { user: 2, pname: "Meadhbh Octopodidae" },
      { user: 3, pname: "William Shatner" },
      { user: 3, pname: "Captain Kirk" },
      { user: 3, pname: "T.J. Hooker" },
      { user: 3, pname: "Guy on airplane who sees gremlin" }
    ]
  };

  persona.prototype.toString = function ( ) {
    var output = "Persona(" + this.pid + ") " + this.pname;
    if( this._user ) {
      output += " - " + this._user.toString();
    } else {
      output += " - User(" + this.user + ")";
    }
    return( output );
  };

  persona.prototype.loadUser = function ( complete ){
    var that = this;

    if( persona.dao ) {
      persona.dao.userRead( { uid: this.user }, function( err, data ) {
        if( err ) { return complete( err ); }
        if( data && data.length > 0 ) {
          that._user = data[0];
          complete( null, that );
        }
      } );
    }
  };

} ) ( );