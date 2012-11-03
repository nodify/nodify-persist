#!/usr/bin/env node

var persist = require( '../nodify-persist.js' );

var persist_options = {
  mysql: {
    host: "127.0.0.1",
    database: "daofunk",
    user: "kickstart",
    password: "77dreSpa"
  },
  collections: [
    __dirname + "/simple-user.js",
    __dirname + "/simple-persona.js",
    __dirname + "/simple-session.js"
  ],
  drop: true,
  populate: true,
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
  dao.userRead( { id: 1 }, _error( function( data ) {
    console.log( 'anon user:' + data[0].toString() );
    _create_user();
  } ) );
}

function _create_user() {
  dao.userCreate( { name: "Random User" }, _error( function( data ) {
    console.log( 'newly created user: ' + data.toString() );
    user = data[0];
    _read_user();
  } ) );
}

function _read_user() {
  // in theory, we should take this out of the cache
  dao.userRead( { id: user.id }, _error( function( data ) {
    console.log( 'user ' + user.id + ': ' + data.toString() );
    _write_user();
  } ) );
}

function _write_user() {
  console.log( "changing the name of this user" );
  dao.userUpdate( { id: user.id, name: "Someone Else" }, _error( function( data ) {
    console.log( 'user ' + user.id + ': ' + data.toString() );
    _delete_user();
  } ) );
}

function _delete_user() {
  dao.userDelete( { id: user.id }, _error( function( ) {
    console.log( 'user ' + user.id + ' deleted' );
    _read_user_again();
  } ) );
}

function _read_user_again() {
  console.log( "trying to read user #" + user.id + " again" );
  dao.userRead( { id: user.id }, _error( function( data ) {
    if( data.length > 0 ) {
      console.log( "uh oh. didn't delete" );
    } else {
      console.log( "looks like it really deleted it" );
    }
    _read_persona();
  } ) );
}

function _read_persona() {
  dao.personaRead( {id: 3}, _error( function( data ) {
    console.log( 'read persona' );
    persona = data[0];
    console.log( persona.toString() );
    persona.loadUser( _error( function( data ) {
      console.log( 'loaded user (supposedly)' );
      console.log( persona.toString() );
      _create_session();
    } ) );
  } ) );
}

function _create_session () {
  dao.sessionCreate( { persona: 2 }, function( err, data ) {
    console.log( data[0].toString() );
    _create_expired_session();
  } );
}

function _create_expired_session () {
  dao.sessionCreate( { persona: 4, expires: new Date( Date.now() - 86400000 ).toISOString() }, function( err, data ) {
    if( data.length != 0 ) {
      console.log( "uh oh. we're getting expired sessions." );
    } else {
      console.log( "cool. properly ignoring expired sessions." );
    }

    console.log( 'closing db' );
    instance.close( function () {
      console.log( 'closed' );
    } );
  } );
}