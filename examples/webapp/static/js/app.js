var menu;
var templates;
var user;
var timer;
var endpoints = new Endpoints();

var workspace_options = {
  routes: {
    "dashboard": "dashboard",
    "room/:id": "room",
    "about": "about",
    "about/:id": "about",
    "short/:id": "short",
    "long/:id": "long",
    "settings": "settings",
    "logout": "logout",
    "": "root",
    "*action": "def"
  },
  dashboard: function () {
    var template = Handlebars.compile( templates.get( '/dashboard' ) );
    var object = {rooms: [], personas: dash_options.personas};
    _.each( dash_options.rooms, function( item ) {
      object.rooms.push( item );
    } );
    $( '#contents' ).html( template( object ) );
  },
  room: function ( id ) {
    var template = Handlebars.compile( templates.get( '/room' ) );
    $( '#contents' ).html( template( dash_options.rooms[ id ] ) );
  },
  short: function ( id ) {
    console.log( 'short ' + id );
    $( '#contents' ).html( templates.get( '/short' ) );
  },
  long: function ( id ) {
    console.log( 'long ' + id );
    $( '#contents' ).html( templates.get( '/long' ) );
  },
  about: function( path ) {
    if( ! path ) {
      path = 'start';
    }
    var template = Handlebars.compile( templates.get( '/about/' + path ) );
    $( '#contents' ).html( template( {site: { port: location.port } } ) );
  },
  settings: function( path ) {
    if( path ) {
      $( '#contents' ).html( templates.get( '/settings/' + path ) );
    } else {
      location.href="/#settings/user";
    }
  },
  logout: function () {
    _cookie_delete( 'seed' );
    setMenu();
    location.href='/#';
  },
  root: function () {
    if( user.isAnon() ) {
      $( '#contents' ).html( templates.get( '/login' ) );
    } else {
      $( '#contents' ).html( templates.get( '/dashboard' ) );
    }
  },
  def: function( path ) {
    $( '#contents' ).html( templates.get( '/' + path ) );
  }
};

$(document).ready ( function () {
  user = User.fromCookie();
  menu = new Menu( '#put_menu_here' );

  templates = new Template( '/templates', 'json' );
  templates.init( postTemplate );
	
  function postTemplate ( data ) {
    var AppRouter = Backbone.Router.extend( workspace_options );
    var approuter = new AppRouter();

    Backbone.history.start();
    setMenu();
  }

} );

function setMenu () {
  if( user.isAnon() ) {
    menu.set( '<li><a class="dropdown-toggle brand" id="dLabel" role="button" data-toggle="dropdown" data-target="#">'
              + 'menu</i></a><ul class="dropdown-menu" role="menu" aria-labelledby="dLabel"><li></li><li><a href="/#about">about</a></li><li class="divider"></li><li><a href="/#login">sign in</a></li></ul></li>' );
//    menu.set( '<li><a href="/#login" class="brand">sign in</a></li>' );
  } else {
    menu.set( '<li><a class="dropdown-toggle" id="dLabel" role="button" data-toggle="dropdown" data-target="#">'
              + 'menu</a><ul class="dropdown-menu" role="menu" aria-labelledby="dLabel"><li><a href="/#dashboard">dashboard</a></li><li class="divider"></li><li><a href="/#about">about</a></li><li class="divider"></li><li><a href="/#settings">settings</a></li><li><a href="/#logout">sign out</a></li></ul></li>' );
  }
}

function User( seed, name, anon ) {
  this.seed = seed;
  this.name = name;
  this.anon = anon;
}

User.anonymous = new User( null, 'Anonymous User', true );

User.fromCookie = function () {
  var seed = _cookie_get( 'seed' );

  if( seed ) {
    return new User( null, 'OhMeadhbh' );
  } else {
    return User.anonymous;
  }
};

User.prototype.isAnon = function () {
  return this.anon;
};

function Template( url, type ) {
  this.url = url;
  this.type = type ? type : 'xml';
  this.items= {};
}

Template.prototype.init = function( _complete ) {
  var that = this;
  _get( this.url, _post_get, this.type );

  function _post_get( err, data ) {
    if( err ) { throw err; }
    that.items = data;
    _complete( data );
  }
};

Template.prototype.get = function ( key ) {
  return this.items[ key ] ? this.items[ key ] : "";
};

function Menu ( id ) {
  this.element = $( id );
}

Menu.prototype.set = function( content ) {
  if( this.element ) {
    this.element.html( content );
  }
}

function Endpoint ( url, parent, expires ) {
  this.url = url;
  this.expires = expires;
  this.parent = parent;
}

Endpoint.prototype.get = function( params, _complete ) {
  _get( this.url + '/' + params.join('/'), _complete );
};

function Endpoints () {
  this.endpoints = {};
  this.endpoints[ '/short' ] = new Endpoint( location.origin + '/api/short' );
  this.endpoints[ '/long' ] = new Endpoint( location.origin + '/api/long' );
}

Endpoints.prototype.getEndpoint = function ( desc ) {
  return this.endpoints[ desc ];
};

function logout () {
    _cookie_set( 'webid', '', '1970-01-01T00:00:00Z');
    location.href = "/";
}

function _get( url, complete, dataType ) {
    that = this;
    $.ajax({
        url: url,
	async: true,
        contentType: 'application/json',
	dataType: ( dataType ? dataType : 'json' ),
	type: 'GET',
	success: success,
	error: error,
	timeout: 10000
    });
	
    function success(data, textStatus, jqXHR) {
	complete(null,data);
    }

    function error( jqXHR, textStatus, errorThrown) {
      if( errorThrown && ( 'object' === typeof errorThrown ) ) {
        return complete( errorThrown, null );
      } else {
        return complete( 'error retrieving  ' + url + ' (' + textStatus + ',' + errorThrown + ')' );
      }
    }
}

function _cookie_get( name ) {
  var rv;
  _.each( document.cookie.split('; '), function( e ) {
    var tmp = e.split('=');
    if( tmp[0] == name) {
      rv = decodeURIComponent( tmp[1] );
    }
  } );
  return( rv );
}

function _cookie_set( name, value, expires ) {
  var cookie_string = encodeURIComponent(name) + '=' + encodeURIComponent(value) + "; path=/";

  if( expires ) {
    cookie_string += "; expires=" + (new Date(expires)).toUTCString();
  }

  console.log( cookie_string );

  document.cookie=cookie_string;
}

function _cookie_delete( name ) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function _raise_alert( type, message ) {
  var text = '<div class="fade in alert alert-' + type + '"><a class="close" data-dismiss="alert">&times;</a><strong>' + type.toUpperCase() + '!</strong> ' + message + '</div>';

  if( timer ) {
    clearTimeout( timer );
    $('.close').trigger('click');
  }

  $('.alert-area').html( text );

  timer = setTimeout( function () {
    $('.close').trigger('click');
    timer = null;
  }, 7000 );
}

function _build_error( data ) {
  var text = '';

  if( data && data.error ) {
    text += data.error;
  }

  if( data && data.errno ) {
    text += ' (' + data.errno + ')';
  }

  if( data && data.moreinfo ) {
    text = '<a href="' + data.moreinfo + '">' + text + '</a>';
  }

  return( text );
}
