( function ( ) {
  var _      = require( 'underscore' );
  var logger = require( 'nodify-logger' );

  var logger_options = {
    facility: 'PERSIST',
    messages_path: __dirname + '/persist-messages.json'
  };

  var log;
  var PERSIST;


  function persist( options ) {
    var that = this;
    this.instances = [];

    var good_options = [ 'target', 'mysql', 'collections', 'drop', 'populate', 'loglevel', 'path' ];
    _.each( good_options, function( option ) {
      if( options[ option ] ) {
        that[ option ] = options[ option ];
      }
    } );
  }

  if( module && module.exports ) {
    module.exports = persist;
  }

  persist.prototype.init = function( complete ) {
    var that = this;

    if( ! this.target ) {
      this.target = {};
    }

    var provider;
    var options;
    var instance;

    if( this.loglevel ) {
      logger_options.level = this.loglevel;
    }
    logger.createInstance( logger_options, _post_logger );

    function _post_logger ( _f, _m ) {
      log = _f;
      PERSIST = _m;

      if( that.mysql ) {
        provider = require( './src/nodify-mysql' );
        options = that.mysql;
        log( PERSIST.I_MYSQL, options.host, options.database, options.user );
      } else if( that.sqllite ) {
        provider = require( 'src/nodify-sqllite' );
        options = that.sqllite;
      } else if( that.mongo ) {
        provider = require( 'src/nodify-mongo' );
        options = that.mongo;
      }

      if( ! provider ) {
        log( PERSIST.E_NOPROV );
        return complete( new Error( 'no provider specified' ), null );
      }

      instance = new provider( options, that.target, log, PERSIST );
      that.instances.push( instance );
      instance.init( _error( _post_instance_init ) );
    }

    function _post_instance_init ( ) {
      var count = that.collections.length;

      if( that.drop ) {
        instance.drop( that.mysql.database, function( err, data ) {
          if( err ) { return complete( err ); }
          if( that.populate ) {
            _create();
          }
        } );
      } else {
        _create();
      }

      function _create() {
        _.each( that.collections, function( path ) {
          if( that.path ) { path = that.path + '/' + path; }
          var collection = require( path );
          collection.dao = that.target;
          log( PERSIST.I_COLLECT, collection.name );
          instance.createCollection( collection, that.drop, that.populate, _error( _post_create ) );
        } );
      }

      function _post_create () {
        count = count - 1;
        if( 0 == count ) {
          complete( null, that.target );
        }
      }
    }
  };

  persist.prototype.close = function ( complete ) {
    var count = this.instances.length;

    _.each( this.instances, function( item ) {
      item.close( function( ) {
        count = count - 1;
        if( 0 == count ) {
          complete();
        }
      } );
    } );
  };

  function _error ( f ) {
    return function( err ) {
      if( err ) {
        throw err;
      }
    
      f.apply( this, Array.prototype.slice.call( arguments, 1 ) );
    };
  }

} ) ( );