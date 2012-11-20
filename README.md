nodify-persist
==============

**Easily persist node.js objects with MySQL, SQLite or Mongo.**

# Intro

Nodify-persist adds an easy(ish) to use persistence tier to your
node.js applications. It provides a regular interface between your
application and common database drivers. Application developers use a
simple JSON object to describe the schema of a database table or
collection; nodify-persist reads this description and creates a data
access object to create, read, update and delete records in the
collection.

Nodify-persist is not an object-relational mapping package. It does
not build a SQL table or Mongo collection from your object
definitions. You still have to define the structure of tables or
collections. But it does handle the mundane tasks of creating tables,
building accessors and managing the connection to the database.

Though you still need to have knowledge of the underlying database
technology, it does move database specific features into a declarative
JSON initialization object. Application developers provide SQL or
Mongo-specific setup data during initialization, but during steady
state usage, a implementation-independent API is used to access data
from the persistence tier.

Also, nodify-persist binds records in a table (or collection) to a
prototype object so database reads return objects with behavior, not
blank maps of field-names to data.

Please note that nodify-persist trades expressiblity for
convenience. In reducing the complexity of dealing directly with the
database, there are some complex database schemas which cannot be
effectively modeled with this package. However, we have noted it
effectively models the vast majority of database tables we have wanted
to use. If you are building a simple or moderately complex web
application, nodify-persist is probably still a net win. In short, if
you're not using a complex database schema, you won't miss what you
aren't using.

# Simple Example

What follows is a simple example of using nodify-persist with
MySQL. You might notice a few things about it. First off, it's kind of
long for a "simple" example. Mea Culpa. But in my defense, let me
remind you that a) there _are_ a lot of comments, b) there's a fair
amount of setup and c) it's not like database access has ever been a
one or two line activity.

What we see in this example is:

1. Setting up the persistence instance
2. Building a model class to hold info we cribbed from the database and define it's behavior.
3. How to use the DAO object returned from the init() call to access elements in the database.
4. How to close down a database connection

<pre>var persist = require( 'nodify-persist' );
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
  return "User(" + this.uid + ") " + this.uname + "," + this.role;
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
}</pre>

