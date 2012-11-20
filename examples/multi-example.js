#!/usr/bin/env node

var persist = require( '../nodify-persist.js' );

var persist_options = {
  mysql: {
    host: "127.0.0.1",
    database: "example",
    user: "insert db username here",
    password: "insert password here"
  },
  collections: [
    "multi-user.js",
    "multi-persona.js"
  ],
  drop: true,
  loglevel: 1
};

var dao;
var userid;
var user;
var persona;

function _error ( f ) {
  return function( err ) {
    if( err ) {
      throw err;
    }
    
    f.apply( this, Array.prototype.slice.call( arguments, 1 ) );
  };
}

var instance = new persist( persist_options );
instance.init( _error( _post_persist ) );

function _post_persist( _target ) {
  dao = _target;

  // read anonymous user
  console.log( "\nReading Anonymous User record" );
  dao.userRead( { uid: 1 }, _error( function( data ) {
    console.log( "  " + data[0].toString() );
    _create_user();
  } ) );
}

function _create_user() {
  console.log( "\nCreating New User" );
  dao.userCreate( { uname: "Random User" }, _error( function( data ) {
    console.log( "  " + data.toString() );
    user = data[0];
    _read_user();
  } ) );
}

function _read_user() {
  console.log( "\nRereading user from database" );
  dao.userRead( { uid: user.uid }, _error( function( data ) {
    console.log( "  " + data.toString() );
    _write_user();
  } ) );
}

function _write_user() {
  console.log( "\nChanging the name of this user and committing changes" );
  dao.userUpdate( { uid: user.uid, uname: "Someone Else" }, _error( function( data ) {
    console.log( "  " + data.toString() );
    _delete_user();
  } ) );
}

function _delete_user() {
  console.log( "\nDeleting that user" );
  dao.userDelete( { uid: user.uid }, _error( function( ) {
    console.log( '  User ' + user.uid + ' deleted' );
    _read_user_again();
  } ) );
}

function _read_user_again() {
  console.log( "\nTrying to read user #" + user.uid + " again" );
  dao.userRead( { uid: user.uid }, _error( function( data ) {
    if( data.length > 0 ) {
      console.log( "  Uh oh. Looks like we didn't delete it." );
    } else {
      console.log( "  Yup. Looks like we really deleted it." );
    }
    _read_another_user();
  } ) );
}

function _read_another_user() {
  console.log( "\nReading user number 3" );
  dao.userRead( { uid: 3 }, _error( function( data ) {
    user = data[0];
    console.log( "  " + user.toString() );
    _read_persona();
  } ) );
}

function _read_persona() {
  console.log( "\nReading persona(s) for this user" );
  user.loadPersonas( function( err, data ) {
    console.log( "  " + user.toString() );
    _read_user_from_persona();
  } );
}

function _read_user_from_persona () {
  console.log( "\nReading user from first persona" );
  user.personas[0].loadUser( function( err, data ) {
    console.log( "  " + user.toString() );
    _close_connection();
  } );
}

function _close_connection () {
  console.log( '\nClosing DB Connection' );
  instance.close( function () {
    console.log( 'DB Connection Closed' );
  } );
}