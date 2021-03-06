var persist = require( '../../nodify-persist' );
var dao;

// Here we define an object that will later be the prototype
// for all database read results. Note that elements in this
// object are the same as fields in the row.

function user( context ) {
  this.uid = context.uid;
  this.uname = context.uname;
  this.role = context.role;
}

user.prototype.toString = function () {
  return "User(" + this.uid + ") " + this.uname + ", " + this.role;
};

// Here is the SQL schema for the user table

user.schema = {
  name: "user",
  table: {
    uid: "INT NOT NULL AUTO_INCREMENT",
    uname: "VARCHAR(80) NOT NULL DEFAULT ''",
    role: "VARCHAR(20)"
  },
  key: "uid"
};

// The database descriptor tells us we're connecting to a MySQL
// database and that we want to define accessors for the user
// table / collection.

var db_descriptor = {
  mysql: {
    host: "127.0.0.1",
    database: "example",
    user: "insert db username here",
    password: "insert password here"
  },
  collections: [
    user
  ],
  drop: true,
  loglevel: 1
};

var sample_data = [
  { uid: 1, uname: "Anonymous User" },
  { uid: 2, uname: "John Lee", role: "Super-Taster" },
  { uid: 3, uname: "James T. Kirk", role: "Captain" }  
];

// First, let's create a new instance; we need to keep this object
// around in order to close the database later. The 'dao' variable
// is the "Data Access Object." After calling init(), this object
// will have methods to access the user table: userCreate(),
// userRead(), userUpdate(), userDelete() and userInsert()

var instance = new persist( db_descriptor );
instance.init( function( err, target ) {
  if( err ) { throw err; }
  dao = target;

  dao.userInsert( sample_data, post_insert );
} );

// We have (in theory) inserted several rows of data. To read
// a record, we pass an object with some of the fields filled in.

function post_insert( err ) {
  if( err ) { throw err; }
  dao.userRead( { uid: 2 }, post_read );
}

function post_read( err, data ) {
  if( err ) { throw err; }
  if( 0 === data.length ) {
    console.log( "can't find user" );
    return exuent_omnis( 2 );
  }
  var user = data[0];
  console.log( "found user! " + user.toString() );
  user.role = "Broom";
  console.log( "modified user: " + user.toString() );
  dao.userUpdate( user, post_update );
}

function post_update( err ) {
  if( err ) { throw err; }
  exuent_omnis( 0 );  
}

function exuent_omnis( exit_code ) {
  instance.close( function() {
    process.exit( exit_code );
  } );
}