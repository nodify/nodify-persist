( function ( ) {
  var _      = require( 'underscore' );
  var logger = require( 'nodify-logger' );
  var path   = require( 'path' );

  var logger_options = {
    facility: 'PERSIST',
    messages_path: __dirname + '/persist-messages.json'
  };

  var log;
  var PERSIST;

  function persist( descriptor ) {
    this._providers = descriptor.providers;
    this._log = descriptor.log ? descriptor.log : {};
    this._target = descriptor.target ? descriptor.target : {}
    _.each( logger_options, function( value, key ) { this._log[ key ] = value; }, this );
  }

  if( module && module.exports ) {
    module.exports = persist;
  }

  persist.persistent = {};

  persist.prototype.init = function( complete ) {
    var that = this;
    var outer_count;

    logger.createInstance( this._log, function _post_logger ( _f, _m ) {
      log = _f;
      PERSIST = _m;

      that.providers = {};
      outer_count = _.keys( that._providers ).length;
      _.each( that._providers, _create_provider );
      
    } );

    function _create_provider( descriptor, name ) {
      var provider, options, instance;

      if( descriptor.mysql ) {
        provider = require( './src/nodify-mysql' );
        options = descriptor.mysql;
        if( ! persist.persistent.mysql ) {
          persist.persistent.mysql = provider.persistent;
        }
        log( PERSIST.I_MYSQL, options.host, options.database, options.user );
      } else if( descriptor.sqlite ) {
        provider = require( 'src/nodify-sqlite' );
        options = descriptor.sqlite;
        if( ! persist.persistent.sqlite ) {
          persist.persistent.sqlite = provider.persistent;
        }
      } else if( descriptor.mongo ) {
        provider = require( 'src/nodify-mongo' );
        options = descriptor.mongo;
        if( ! persist.persistent.mongo ) {
          persist.persistent.mongo = provider.persistent;
        }
      }

      if( ! provider ) {
        log( PERSIST.E_NOPROV );
        return complete( new Error( 'no provider specified' ), null );
      }

      instance = new provider( options, that._target, log, PERSIST );
      instance._collections = {};
      that.providers[ name ] = instance;

      instance.init( {drop: descriptor.drop}, function( err ) {
        if( err ) { return complete( err, null ); }

        var count = _.keys( descriptor.collections ).length;
        var collection;

        _.each( descriptor.collections, function( collection_path, collection_name ) {
          if( 'string' === typeof collection_path ) {
            collection = require( path.join( process.cwd(), collection_path ) );
          } else {
            collection = collection_path;
          }
          
          collection.dao = that._target;
          instance._collections[ collection_name ] = collection;

          log( PERSIST.I_COLLECT, collection_name );

          instance.createCollection( collection, collection_name, _post_create );
        } );

        function _post_create( err, collection ) {
          if( err ) { return complete( err, null ); }

          if( descriptor.drop && collection.schema.insert ) {
            collection.prototype._insert( collection.schema.insert, function( err ) {
              if( err ) { return complete( err, null ); }
              _post_insert();
            } );
          } else {
            _post_insert();
          }
        }

        function _post_insert( ) {
          count = count - 1;
          if( 0 == count ) {
            outer_count = outer_count - 1;
            if( 0 == outer_count ) {
              complete( null, that._target );
            }
          }
        }
      } );

    }
  };

  persist.prototype.close = function ( complete ) {
    var count = this.providers.length;

    _.each( this.providers, function( item ) {
      item.close( function( ) {
        count = count - 1;
        if( 0 == count ) {
          complete();
        }
      } );
    } );
  };

  persist.prototype.getClientSource = function () {
    function persistent ( context ) {
    if( this.keys ) {
      _.each( this.keys, function( item ) {
        if( context[ item ] ) {
          this[ item ] = context[ item ];
        }
      }, this );
    }
  }

    var output = "";
    output += "( function() {\n  " + persistent.toString() + "\nwindow.persistent=persistent;\n})();\n";
    _.each( this.providers, function( item ) {
      _.each( item._collections, function ( collection, name ) {
        output += "( function () {\n";
        output += "  " + collection.toString();
        output += "\n  window." + name + "=" + name + ";\n";
        output += "  " + name + ".prototype=new persistent();";
        if( collection.prototype._keys ) {
          output += "  " + name + ".prototype.keys=['" + collection.prototype._keys.join("','") + "'];\n";
        }
        _.each( collection.prototype, function( value, key ) {
          if( ( 'function' === typeof value ) && ('_' !== key.substr(0,1) ) ) {
            output += "  " + name + ".prototype." + key + "=" + value.toString() + "\n";
          }
        } );
        output += "} ) ();\n"
      } );
    } );
    return output;
  };

} ) ( );
