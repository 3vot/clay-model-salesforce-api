var Superagent = function(url){
  this.url = url;
}


Superagent.prototype.query = function(query){
  this.querystring = query;
  return this;
}
Superagent.prototype.withCredentials = function(){
  return this;
}

Superagent.prototype.send = function(body){
  this.body = body;
  return this;
}

Superagent.prototype.end = function(callback){
  var _this = this;
  setTimeout( function(){
    if(_this.error) callback(_this.error);
    else Superagent.nextReponse(_this.type, _this.url, _this.querystring || _this.body , callback)
  }, 50 );

}

Superagent.get = function(url){
  var req = new Superagent(url);
  
  req.type = "get";
  
  return req;
}

Superagent.post = function(url){
  var req = new Superagent(url);
  req.type = "post";
  return req;
}

Superagent.put = function(url){
    var req = new Superagent(url);
  req.type = "put";
  
  return req;
}

Superagent.del = function(url){
  var req = new Superagent(url);
  req.type = "del";
  
  return req;
}



module.exports= Superagent;