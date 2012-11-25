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

  provider.prototype.init = function( init_options, complete ) {
    var that = this;

    _create_connection( _.pick( this.options, 'host', 'user', 'password' ), function( err, _conn ) {
      if( err ) { return complete( err ); }
      that.connection = _conn;
      
      if( init_options.drop ) {
        log( PERSIST.I_DROP, that.options.database );
        _drop( that.options.database, function( err ) {
          if( err ) { return complete( err ); }
          _use( that.options.database );
        } );
      } else {
        _use( that.options.database );
      }
    } );

    function _create_connection ( options, _callback ) {
      var connection = mysql.createConnection( options );

      connection.on( 'error', function( err ) {
        if( 'PROTOCOL_CONNECTION_LOST' === err.code ) {
        log( PERSIST.E_CONNECT, err );
          _create_connection( options, function( err, _conn ) {
            if( that.connection ) {
              that.connection.destroy();
            }
            that.connection = _conn;
            _use( that.options.database );
          } );
        } else {
          throw err;
        }
      } );

      connection.connect( function( err ) {
        if( err ) { return _callback( err ); }
        _callback( null, connection );
      } );
    }

    function _use ( database ) {
      that.query( 'USE ' + database, [], function( err, data ) {
        if( err ) {
          if( 'ER_BAD_DB_ERROR' === err.code ) {
            return that.query( 'CREATE DATABASE IF NOT EXISTS ' + database, [], function( err ) {
              if( err ) {
                log( PERSIST.E_DBCREATE, database, err.code );
              } else {
                log( PERSIST.S_DBCREATE, database );
                return _use( database );
              }
              return complete( err );
            } );
          } else {
            return complete( err );
          }
        }
        complete( null );
      } );
    }

    function _drop ( database, _complete ) {
      that.query( 'DROP DATABASE IF EXISTS ' + database, [], function( err, data ) {
        if( err ) { return _complete( err ); }
        _complete( null );
      } );
    }
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


  provider.prototype.createCollection = function( collection, name, complete ) {

    var that = this;
    var schema = collection.schema;
    var elements = _.keys( schema.table );

    this.target[ name + 'Create' ] = _.bind( _create_accessor( elements ), this );
    this.target[ name + 'Read' ] = _.bind( _read_accessor( elements ), this );
    this.target[ name + 'Update' ] = _.bind( _update_accessor( elements ), this );
    this.target[ name + 'Delete' ] = _.bind( _delete_accessor( elements ), this );
    this.target[ name + 'Insert' ] = _.bind( _insert_accessor( this.target[ name + 'Create' ] ), this );

    _create_view_accessors.apply( this, [this.target, schema, collection] );

    collection.prototype._create = function ( _complete ) {
      that.target[ name + 'Create' ]( this, _complete );
    };

    collection.prototype._read = function ( _complete ) {
      that.target[ name + 'Read' ]( this, _complete );
    };

    collection.prototype._update = function ( _complete ) {
      that.target[ name + 'Update' ]( this, _complete );
    };

    collection.prototype._delete = function ( _complete ) {
      that.target[ name + 'Delete' ]( this, _complete );
    };

    collection.prototype._insert = function ( input, _complete ) {
      that.target[ name + 'Insert' ]( input, _complete );
    };
    
    var elements = [];
    _.each( _.keys( schema.table ), function( item ) {
      var element = item + " " + schema.table[ item ];
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
      
    var query = "CREATE TABLE IF NOT EXISTS " + schema.name + "(" + elements.join(',') + ")" ;
    that.query( query, [], function( err, data ) {
      if( err ) { return complete( err ); }

      complete( null, collection );
    } );

    function _create_accessor( keys ) {
      return function( input, _callback ) {
        var params = _get_params( input, keys );

        if( schema.expires && ( ! input.expires ) ) {
          params[0].push( 'expires' );
          params[1].push( new Date( Date.now() + 86400000 ) );
        }

        if( params[0].length > 0 ) {
          var query = "INSERT INTO " + schema.name + " (" + params[0].join(',') + ") " +
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
      };
    }

    function _read_accessor( keys ) {
      return function( input, _callback ) {
        var params = _get_params( input, keys );
        var query = "SELECT * FROM " + schema.name;
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
      };
    }

    function _update_accessor( keys ) {
      return function( input, _callback ) {
        var params = _get_params( input, keys );

        if( ( params[0].length > 0 ) && input[ schema.key ] ) {
          var query = "UPDATE " + schema.name + " SET " + params[0].join('=?,') + 
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
      };
    }

    function _delete_accessor( keys ) {
      return function( input, _callback ) {
        if( input[ schema.key ] ) {
          var query = "DELETE FROM " + schema.name + " WHERE " + schema.key + "=?";

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
      };
    }

    function _insert_accessor ( create_function ) {
      return function( input, _callback ) {
        var count = input.length;
        _.each( input, function( item ) {
          create_function( item, _complete );
        } );

        function _complete( err ) {
          if( err ) { return _callback( err, null ); }
          count--;
          if( 0 === count ) {
            return _callback( null, null );
          }
        }
      };
    };

    function _create_view_accessors ( target, schema, collection ) {
      var that = this;
      _.each( schema.relations, function ( relation, rname ) {
        var query;
        var items = [];

        _.each( relation.local.members, function( item ) {
          items.push( schema.name + "." + item );
        } );

        _.each( relation.foreign.members, function( item ) {
          items.push( relation.foreign.table + "." + item );
        } );

        query  = "SELECT " + items.join( ', ' );
        query += " FROM " + schema.name + ', ' + relation.foreign.table;
        
        items = [];

        _.each( relation.foreign.key, function( value, key ) {
          items.push( schema.name + '.' + key + '=' + relation.foreign.table + "." + value );
        } );

        query += " WHERE " + items.join ( 'AND ' ) + " AND ";

        var crname = _camelize( rname );
        target[ name + 'View' + crname ] = _.bind( function( input, _callback ) {
          items = _get_params( input, _.keys( schema.table ) );
          query += items[0].join( '=? AND ' ) + "=?";
          this.query( query, items[1], _callback );
        }, this );

        collection.prototype[ '_view' + crname ] = function ( _complete ) {
          target[ name + 'View' + crname ]( this, _complete );
        };

      }, this );
    }

    function _get_params ( object, input_keys ) {
      var values = [];
      var keys = [];
      var items = _.intersection( _.keys( object ), input_keys );
      _.each( items, function( item ) {
        values.push( object[ item ] );
        keys.push( item);
      } );

      return( [keys, values] );          
    }

  };

  provider.prototype.close = function ( complete ) {
    this.connection.end( complete );
  };

  function persistent( options, schema ) {
    if( schema ) {
      var that = this;
      this._schema = schema;
      this._keys = _.keys( schema.table );
      this._dirty = false;

      _.each( this._keys, function( item ) {
        var cased = item.substr(0,1).toUpperCase() + item.substr(1).toLowerCase();
        this[ 'get' + cased ] = function () {
    return this[ item ];
  };
        this[ 'set' + cased ] = function ( arg ) {
    if( arg != this[ item ] ) {
      this[ item ] = arg;
      this._dirty = true;
    }
  };
      }, this );
    }

    if( options ) {
      _.each( this._keys, function( item ) {
        if( options[ item ] ) {
          this[ item ] = options[ item ];
        }
      }, this );
    }
  }

  persistent.prototype.flush = function ( _complete ) {
    if( this._dirty && this._update ) {
      return this._update(_complete);
    } else {
      _complete.apply( this, [null, this] );
    }
  };

  function _camelize( input ) {
    return input.substr(0,1).toUpperCase() + input.substr(1).toLowerCase();
  }

  provider.persistent = persistent;

} ) ( );