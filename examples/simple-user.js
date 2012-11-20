( function ( ) {
  function user ( options ) {
    this.uid = options.uid;
    this.uname = options.uname;
  }

  if( module && module.exports ) { 
    module.exports = user;
  }

  user.name = "user";
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
      // SELECT user.uid, user.uname, persona.pid, persona.pname FROM user, persona WHERE user.uid=persona.user AND user.uid=?
    },
    key: 'uid',
    created: true,
    insert: [
      {
        uid: 1,
        uname: "Anonymous User"
      },
      {
        uid: 2,
        uname: "Meadhbh Hamrick"
      },
      {
        uid: 3,
        uname: "William Shatner"
      }
    ]
  };

  user.prototype.toString = function ( ) {
    return( this.uid + ":" + this.uname );
  }
} ) ( );