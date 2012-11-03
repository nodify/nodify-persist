( function ( ) {
  var mysql = require( 'mysql' );
  var _     = require( 'underscore' );
  
  var log;
  var PERSIST;

  function provider( options, target, _f, _m ) {
    this.target = target;
    this.options = options;
    log = _f;
    PERSIST = _m;
  }

  if( module && module.exports ) {
    module.exports = provider;
  }

  provider.prototype.init = function( complete ) {
    var that = this;
    _create_connection( this.options, complete );

    function _create_connection( options, _complete ) {
      that.connection = mysql.createConnection( that.options );
      that.connection.on( 'error', function( err ) {
        log( PERSIST.E_CONNECT, err );
        if( err.code === 'PROTOCOL_CONNECTION_LOST' ) {
          _create_connection( options );
        } else {
          throw err;
        }
      } );

      that.connection.connect( function( err, data ) {
        that.query( 'USE ' + that.options.database, [], function () {
          if( _complete ) {
            _complete.apply( that, [null] );
          }
        } );
      } );
    }
  }

  provider.prototype.drop = function ( name, complete ) {
    var that = this;

    that.query( 'USE mysql', [], function (err) {
      if( err ) { return complete( err ) };
      that.query( 'DROP DATABASE IF EXISTS ' + name, [], function (err) {
        if( err ) { return complete( err ) };
        that.query( 'CREATE DATABASE ' + name, [], function (err) {
          if( err ) { return complete( err ) };
          that.query( 'USE ' + name, [], function (err) {
            if( err ) { return complete( err ) };
            complete( null );
          } );
        } );
      } );
    } );
  };

  provider.prototype.query = function( query, params, complete ) {
    try {
      log( PERSIST.D_QUERY, query, params );
      this.connection.query( query, params, function( err, data ) {
        if( err ) { log( PERSIST.E_QUERY, err ); }
        log( PERSIST.D_RESULT, data );
        complete( err, data );
      } );
    } catch( e ) {
      log( PERSIST.E_QUERY, e );
      complete( err, null );
    }
  };

  provider.prototype.createCollection = function( collection, drop, populate, complete ) {
    var that = this;
    var schema = collection.schema;
    var elements = _.keys( schema.items );
    var name = collection.name;

    this.target[ name + 'Create' ] = _.bind( _create_accessor, this );
    this.target[ name + 'Read' ] = _.bind( _read_accessor, this );
    this.target[ name + 'Update' ] = _.bind( _update_accessor, this );
    this.target[ name + 'Delete' ] = _.bind( _delete_accessor, this );

    if( drop ) {
      _build_tables();
    } else if( populate ) {
      _populate();
    }
      
    function _build_tables() {
      var elements = [];
      _.each( _.keys( schema.items ), function( item ) {
        var element = item + " " + schema.items[ item ];
        if( schema.key == item ) {
          element += " KEY";
        }
        elements.push( element );
      } );

      if( schema.created ) {
        elements.push( 'created TIMESTAMP DEFAULT CURRENT_TIMESTAMP' );
      } else if( schema.updated ) {
        elements.push( 'updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' );
      } else if( schema.expires ) {
        elements.push( 'expires TIMESTAMP' );
      }
      
      var query = "CREATE TABLE " + name + "(" + elements.join(',') + ")" ;
      that.query( query, [], function( err, data ) {
        if( err ) { return complete( err ); }
        if( populate ) {
          _populate();
        } else {
          complete( null, null );
        }
      } );
    }

    function _populate () {
      if( schema.insert ) {
        var count = schema.insert.length;

        _.each( schema.insert, function( item ) {
          that.target[ name + 'Create' ]( item, function( err, data ) {
            if( err ) { return complete( err, null ); }
            count = count - 1;
            if( 0 == count ) {
              complete( null, null );
            }
          } );
        } );
      } else {
        complete( null, null );
      }
    }

    function _create_accessor( input, _callback ) {
      var params = _get_params( input );

      if( schema.expires && ( ! input.expires ) ) {
        params[0].push( 'expires' );
        params[1].push( new Date( Date.now() + 86400000 ) );
      }

      if( params[0].length > 0 ) {
        var query = "INSERT INTO " + name + "(" + params[0].join(',') + ") " +
          "VALUES (" + Array(params[0].length).join('?,') +"?)";
        this.query( query, params[1], function( err, data ) {
          if( err ) { return _callback( err ); }
          var qdata = {};
          qdata[ schema.key ] = data.insertId;
          that.target[ name + 'Read' ]( qdata, _callback );
        } );
      } else {
        _callback( null, [] );
      }
    }

    function _read_accessor( input, _callback ) {
      var params = _get_params( input );
      var query = "SELECT * FROM " + name;
      var where = '';

      if( params[0].length > 0 ) {
        where += params[0].join( '=?,' ) + '=?';
      }

      if( schema.expires ) {
        where += " AND expires > '" +new Date( Date.now() ).toISOString() + "'";
      }
      
      if( '' !== where ) {
        query += " WHERE " + where ;
      }

      this.query( query, params[1], function( err, data ) {
        if( err ) { return _callback( err ); }
        var results = [];
        _.each( data, function( item ) {
          results.push( new collection( item ) );
        } );
        _callback( null, results );
      } );
    }

    function _update_accessor( input, _callback ) {
      var params = _get_params( input );
      if( ( params[0].length > 0 ) && input[ schema.key ] ) {
        var query = "UPDATE " + name + " SET " + params[0].join('=?,') + 
          "=? WHERE " + schema.key + "=?";
        params[1].push( input[ schema.key ] );

        if( schema.expires ) {
          query += " AND expires > '" + 
            new Date( Date.now() ).toISOString() + "'";
        }

        this.query( query, params[1], function( err, data ) {
          if( err ) { return _callback( err ); }
          var qdata = {};
          qdata[ schema.key ] = input[ schema.key ];
          that.target[ name + 'Read' ]( qdata, _callback );
        } );
      } else {
        _callback( null, [] );
      }
    }

    function _delete_accessor( input, _callback ) {
      if( input[ schema.key ] ) {
        var query = "DELETE FROM " + name + " WHERE " + schema.key + "=?";

        if( schema.expires ) {
          query += " AND expires > '" + 
            new Date( Date.now() ).toISOString() + "'";
        }

        this.query( query, [ input[ schema.key ] ], function( err, data ) {
          if( err ) { return _callback( err ); }
          _callback( null, [] );
        } );        
      } else {
        _callback( null, [] );
      }
    }

    function _get_params ( object ) {
      var values = [];
      var keys = [];
      _.each( object, function( value, key ) {
        values.push( value );
        keys.push( key );
      } );
      return( [keys, values] );
    }
  };

  provider.prototype.close = function ( complete ) {
    this.connection.end( complete );
  };
} ) ( );