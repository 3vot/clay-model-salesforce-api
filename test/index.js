var test = require('tape');

var Model = require("clay-model")
var VFR = require("../")
var ClayVFR = require("clay-vfr");
var Visualforce = require("clay-vfr/test/mock/visualforce");
ClayVFR.Visualforce = Visualforce;

test('Create Records', function (t) {
  t.plan(4);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;

  Visualforce.nextReponse= function(method, params, callback){       
    t.equal( params[0],"post" )
    t.equal( params[1],"/Asset" )
    var obj = JSON.parse( params[2] );
    obj.id = 2;

    callback( JSON.stringify(obj) );
  }
  
  var asset;
  Asset.create({name: "test.pdf"})
  .then( function( value ){ asset = value; 
    t.equal( asset.name, "test.pdf" ) 
    t.equal( asset.id, 2 );
  })

})

test('Create Records, with error in response', function (t) {
  t.plan(1);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;

  Visualforce.nextReponse= function(method, params, callback){       
    callback(  );
  }
  
  var asset;
  Asset.create({name: "test.pdf"})
  .fail(function(err){t.notEqual( err, null ) })
})

test('Update record', function (t) {
  t.plan(6);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;

  Visualforce.nextReponse= function(method, params, callback){
    t.equal( params[0],"put" )
    t.equal( params[1],"/Asset/3" )    
    callback();
  }
  
  var asset = Asset.create({ name: "test.pdf", id: 3 }, { ignoreAjax: true })
  
  t.equal(asset.id, 3);

  asset.visible=true;
  asset.save()

  .then( function(sameAsset){ 
    t.deepEqual( asset.id, sameAsset.id)  
    t.deepEqual( asset.name, sameAsset.name) 
    t.deepEqual( asset.visible, sameAsset.visible)  });
})



test('Destroy record', function (t) {
  t.plan(3);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;

  Visualforce.nextReponse= function(method, params, callback){
    callback();
  }
  
  var asset = Asset.create({ name: "test.pdf", id: 3 }, { ignoreAjax: true })
  
  t.equal(asset.id, 3);
  t.equal(  Asset.exists(3), true);

  asset.destroy()
  .then( function(sameAsset){ 
    t.equal(  Asset.exists(3), false) } );
})

test('Read record', function (t) {
  t.plan(1);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;

  Visualforce.nextReponse= function(method, params, callback){
    callback(JSON.stringify({name: "read name", visible: false}));
  }
  
  Asset.read(3)
  .then(function(asset){
    t.equal( asset.visible, false );
  })

})

test('Query record', function (t) {
  t.plan(1);
  var Asset = Model.setup("Asset", ["name", "visible", "contact_methods"]);
  Asset.ajax = VFR;

  Visualforce.nextReponse= function(method, params, callback){
    callback(JSON.stringify([{name: "read query", visible: false},{name: "read query 2", visible: false}]));
  }
  
  Asset.query("select id,name from assets")
  .then(function(){
    t.equal( Asset.count() , 2 );
  })

})




