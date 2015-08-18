var Q = require("kew");
var Request = require("superagent")
//var Qs = require('qs');
//var QueryString = require("querystring");


var Ajax = function(eventName, model, options){
  if(eventName == "create") return Ajax.post.call(this, model,options )
  else if(eventName == "update") return Ajax.put.call(this, model,options )
  else if(eventName == "destroy") return Ajax.del.call(this, model,options )
  
  var params = model;
  if(eventName == "query") return Ajax.query.call(this, params, options);  
  else if(eventName == "read") return Ajax.get.call(this, params, options);
  else if(eventName == "pull") return Ajax.pull.call(this, params);  
  else if(eventName == "push") return Ajax.push.call(this, params);  

}

Ajax.Request = Request;

Ajax.host = "";
Ajax.login_server = "login.salesforce.com"

Ajax.logout = function(redirectUrl){
  var deferred = Q.defer();
  var url =Ajax.host.replace("/api","")
  window.location =  url + "/logout?redirect=" + redirectUrl
}

Ajax.apex = function(method, name, params){
  
  var deferred = Q.defer();

  Ajax.Request[method]( Ajax.host + "/apex/" + name  )
  .query("login_server=" +Ajax.login_server)
  .send(params)
  .withCredentials()
  .end( function( err, res ){ 
    if( !navigator.onLine || window.simulateOffline ) return deferred.reject("NO_INTERNET")
    if( err ) return deferred.reject( err );
    deferred.resolve( res )
  });
  return deferred.promise;
}


Ajax.query = function(params, options){
var _this = this;
  //var pctEncodeSpaces = true;
//  var params = encodeURIComponent(params).replace(/%40/gi, '@').replace(/%3A/gi, ':').replace(/%24/g, '$').replace(/%2C/gi, ',').replace(/%20/g, pctEncodeSpaces ? '%20' : '+');
  
  var deferred = Q.defer();
  

  Ajax.Request.get( Ajax.generateURL(this) )
  .query( "query=" + params )
  .query( options )
  .query("login_server=" +Ajax.login_server)
  .withCredentials()
  .end( function( err, res ){
    if( !navigator.onLine || window.simulateOffline ) return deferred.reject("NO_INTERNET")
    if( err ) return deferred.reject( err );
    if(res.status >= 400) return deferred.reject( res.body );

    for (var i = res.body.length - 1; i >= 0; i--) {
      var item = res.body[i];
      item.id = item.Id;
    };
    
    deferred.resolve( res.body )
  });
  return deferred.promise;

}

Ajax.login = function(options){
  if(!options) options = {};
  var _this = this;
  var url =Ajax.host.replace("/api","")
  var deferred = Q.defer();

  Ajax.Request.get( url + "/login/whoami")
  .withCredentials()
  .query( options )
  .query("login_server=" +Ajax.login_server)
  .end( function( err, res ){ 
    if( !navigator.onLine || window.simulateOffline ) return deferred.reject("NO_INTERNET")
    if( err || res.status != 200 ) return window.location = url + "/login?app_url=" + window.location.href + "&login_server=" + Ajax.login_server ;
    Ajax.user = res.body;
    deferred.resolve();
  })
  
  return deferred.promise;
}

Ajax.push = function(options){
  var _this = this;
  var url =Ajax.host.replace("/api","")
  var deferred = Q.defer();

  if(options.channel) channel = this.className + "_" + options.channel;
  else options.channel = this.className

  options.socket_id = Ajax.pusher.connection.socket_id;

  Ajax.Request.get( url + "/pusher" )
  .withCredentials()
  .query( options )
  .query("login_server=" +Ajax.login_server)
  .end( function( err, res ){ 
    if( !navigator.onLine || window.simulateOffline ) return deferred.reject("NO_INTERNET")
    if(err) deferred.reject(err);
    if(res.status >= 400) return deferred.reject( res.body );
    deferred.resolve(res);
  })
  
  return deferred.promise;
}

Ajax.pull = function(options){
  var _this = this;
  if( !Ajax.pusher ) throw "Remember to register. Ajax.pusher = var pusher = new Pusher('KEY');"
  var channel = Ajax.pusher.subscribe( this.className );
  if(options.channel) channel += "_" + options.channel;

  channel.bind( options.eventName, function(data) {
    
    _this.trigger(options.eventName, JSON.parse( data.message ) );
  });
}

Ajax.realtime = function(){
  Ajax.realtime = true;

  this.pull( { eventName: "create" } )
  this.pull( { eventName: "update" } )
  this.pull( { eventName: "destroy" } )
}

Ajax.get = function(id, options){
  var _this = this;
  var deferred = Q.defer();

  Ajax.Request.get( Ajax.generateURL(this) + "/" + id )
  .query("login_server=" +Ajax.login_server)
  .end( function( err, res ){ 
    if( !navigator.onLine || window.simulateOffline ) return deferred.reject("NO_INTERNET")
    if(err) return deferred.reject( err );
    if(res.status >= 400) return deferred.reject( res.body );
    res.id = res.Id;
    Ajax.handleResultWithPromise.call(_this, err, res.body, false, deferred  );
  })

  return deferred.promise;
}

Ajax.post = function(model, options){
  var deferred = Q.defer();

  var _this = this;

  var id = this.id;
  this.id = null;

  Ajax.Request.post( Ajax.generateURL(model) )
  .query("login_server=" +Ajax.login_server)
  .send( this.toJSON() )
  .withCredentials()
  .end( function( err, res ){ 
    if( !navigator.onLine || window.simulateOffline ) return deferred.reject("NO_INTERNET")
    if(err){ _this.id = id; return deferred.reject( err ); }
    if(res.status >= 400){ _this.id = id; return deferred.reject( res.body ); }
    
    _this.id = res.body.Id;
    _this.changeID(res.body.Id);
    _this.Id = res.body.Id;
    if(res.status >= 400) return deferred.reject( res.body );
    Ajax.handleResultWithPromise.call(_this, err, res.body, false, deferred  )
  });

  return deferred.promise;  
}

Ajax.put = function(model, options){
  var _this = this;
  var deferred = Q.defer();

  var valuesToSend = JSON.parse(JSON.stringify(this.toJSON())); //ugly hack
  var previousAttributes = JSON.parse( model.previousAttributes[this.id] );
  for(key in valuesToSend){
    if( this.constructor.ignoreFields && this.constructor.ignoreFields.indexOf(key) > -1 ) delete valuesToSend[key];

    
    else if(valuesToSend[key] == previousAttributes[key]){
      delete valuesToSend[key];
    }
  }

  Ajax.Request.put( Ajax.generateURL(model, this.id ) )
  .query("login_server=" +Ajax.login_server)
  .send( valuesToSend )
  .withCredentials()
  .end( function( err, res ){ 
    if( !navigator.onLine || window.simulateOffline ) return deferred.reject("NO_INTERNET")
    if(err) return deferred.reject( err );
    if(res.status >= 400) return deferred.reject( res.body );
    Ajax.handleResultWithPromise.call(_this, err, res.body, true, deferred  )
  });

  return deferred.promise;  
}

Ajax.del = function(model, options){
  var _this = this;
  var deferred = Q.defer();

  Ajax.Request.put( Ajax.generateURL(model, this.id ) )
  .query("login_server=" +Ajax.login_server)
  .withCredentials()
  .end( function( err, res ){ 
    if( !navigator.onLine || window.simulateOffline ) return deferred.reject("NO_INTERNET")
    if(err) return deferred.reject( err );
    if(res.status >= 400) return deferred.reject( res.body );
    Ajax.handleResultWithPromise.call(_this, err, res.body, true, deferred  )
  });

  return deferred.promise;  
}

Ajax.generateURL = function() {
  var args, collection, object, path, scope;
  object = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  collection = object.className;
  
  args.unshift(collection);
  args.unshift(scope);
  path = args.join('/');
  path = path.replace(/(\/\/)/g, "/");
  path = path.replace(/^\/|\/$/g, "");
  
  return  Ajax.host + "/"+path;
};

Ajax.handleResultWithPromise = function(err, result, nullok, deferred) {
  if (result) {
    if (typeof result !== 'object') {
      result = JSON.parse(result);
    }
    if (Array.isArray(result) && result.length > 0 && result[0].message && result[0].errorCode) {
      return deferred.reject(result);
    } else {      
      return deferred.resolve(this);
    }
  } else if (typeof nullok !== 'undefined' && nullok) {
    return deferred.resolve(this);
  } else {
    deferred.reject({
      message: 'Null returned by RemoteAction not called with nullOk flag',
      errorCode: 'NULL_RETURN'
    });
  }
}

module.exports = Ajax;