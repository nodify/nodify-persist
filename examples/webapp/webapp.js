try {
  var _        = require( 'underscore' );
  var props    = require( 'node-props' );
  var approute = require( 'nodify-approute' );
  var persist  = require( '../../nodify-persist' );
  var connect  = require( 'connect' );
  var mug      = require( 'node-mug' );
  var fs       = require( 'fs' );
  var iappl    = require( './application' );
} catch( e ) {
  console.log( "can't find required modules. try executing this command:" );
  console.log( "  make" );
  console.log( e );
  process.exit( 1 );
}

var g;
var apps = {};

var facilities = {};

read_props();

function read_props( ) {
  props.read( function( properties ) {
    g = facilities.properties = properties;

    mug_init();
  } );
}

function mug_init( ) {
  var mug_options = g.mug || {version: mug.RANDOM};
  mug.createInstance( mug_options, function( generator ) {
    u = facilities.uuid_generator = generator;

    dao_init();
  } );
}

function dao_init( ) {
  if( g.persist ) {
    var instance = new persist( g.persist );
    instance.init( function( err, target ) {
      facilities.dao = target;
      facilities.persist = instance;
      load_apps();
    } );
  }
}

function load_apps( ) {
  var apps_to_start = g.start || _.keys( g.apps );
  _.each( apps_to_start, function ( element, index, list ) {
    apps[ element ] = iappl( element, g.apps[ element ], facilities );
  } );
}
