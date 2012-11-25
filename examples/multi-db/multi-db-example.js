#!/usr/bin/env node

var persist = require( '../../nodify-persist' );
var _       = require( 'underscore' );

var dao;
var user;
var db_descriptor = {
  log: {
    level: 1
  },
  providers: {
    agentdb: {
      mysql: {
/*        host: "127.0.0.1",
        database: "agent",
        user: "insert db username here",
        password: "insert password here"
*/
        host: "localhost",
        database: "agent_test",
        user: "kickstart",
        password: "77dreSpa"
      },
      collections: {
        user: 'collection_user.js'
        ,session: 'collection_session.js'
      }
      , drop: true
    }
    , partsdb: {
      mysql: {
//        host: "internal.example.com",
//        database: "parts",
//        user: "insert db username here",
//        password: "insert password here"

        host: "localhost",
        database: "parts_test",
        user: "kickstart",
        password: "77dreSpa"
      },
      collections: {
        part: 'collection_part.js'
      }
    }
  }
};

var instance = new persist( db_descriptor );

instance.init( function( err, target ) {
  dao = target;

  dao.countUsers = function ( _callback ) {
    instance.providers[ 'agentdb' ].query( "SELECT COUNT(*) AS count FROM _user", _callback );
  };

  dao.countUsers( function( err, data ) {
    console.log( 'user count is: ' + data[0].count );

    console.log( "\nreading anonymous user" );
    dao.userRead( { uid: 1 }, function( err, data ) {
      if( data.length > 0 ) {
        console.log( data[0].toString() );
      }
      _create_user();
    } );
  } );
} );

function _create_user () {
  console.log( "\ncreating new user" );
  dao.userCreate( { uname: "Meadhbh" }, function( err, data ) {
    user = data[0];
    console.log( user.toString() );

    _add_sessions();
  } );
}

function _add_sessions () {
  console.log( "\nadding sessions" );
  var count = 3;

  for( var i = 0, il = count; i < il; i++ ) {
    dao.sessionCreate( {user: user.uid}, function( err, data ) {
      count--;
      if( 0 == count ) {
        user._loadSessions( function( err ) {
          console.log( user.toString() );
         _testing_accessors();
       } );
      }
    } );
  }
}

function _testing_accessors () {
  console.log( "\ntesting accessors" );
  console.log( user.getUid() );
  console.log( user.getUname() );
  user.setUname( 'Droog' );
  console.log( user.getUname() );
  user.flush( function( err, data ) {
    console.log( user.toString() );
    dao.userRead( {uid: user.uid}, function( err, data ) {
      console.log( user.toString() );
      _close();
    } );
  } );
}

function _close () {
  instance.close( function( err ) {
    if( err ) {
      console.log( "Error Closing Database(s): " + err.toString() );
      process.exit( 2 );
    }
    
    console.log( "Database Connection(s) Closed" );
  } );
}