//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    request = require( 'request' ),
    app = express();

//. env values
var settings_api_url = 'api_url' in process.env ? process.env.api_url : '';
var settings_access_url = 'access_url' in process.env ? process.env.access_url : '';
var settings_client_id = 'client_id' in process.env ? process.env.client_id : '';
var settings_client_secret = 'client_secret' in process.env ? process.env.client_secret : '';

//. access_token
var access_token = null;

if( settings_access_url && settings_client_id && settings_client_secret ){
  var data = {
    grantType: 'client_credentials',
    clientId: settings_client_id,
    clientSecret: settings_client_secret
  };
  var option = {
    url: settings_access_url,
    method: 'POST',
    json: data,
    headers: { 'Content-Type': 'application/json' }
  };
  request( option, ( err, res, body ) => {
    if( err ){
      console.log( err );
    }else{
      if( body && body.access_token ){
        access_token = body.access_token;
      }
      console.log( "connected.." );
    }
  });
}


app.use( express.Router() );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.static( __dirname + '/public' ) );

//. 感情分析
app.post( '/api/sentiment', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var text = req.body.text;
  if( access_token && settings_api_url && text ){
    var data = {
      sentence: text
    };
    var option = {
      url: settings_api_url + 'nlp/v1/sentiment',
      method: 'POST',
      json: data,
      headers: { 
        'Content-Type': 'application/json; charset=UTF-8', 
        'Authorization': 'Bearer ' + access_token
      }
    };
    request( option, ( err, res0, body ) => {
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err }, null, 2 ) );
        res.end();
      }else{
        if( body && body.status ){
          res.status( 400 );
          res.write( JSON.stringify( { status: false, message: body.message, error: body.message }, null, 2 ) );
          res.end();
        }else{
          var result = body.result;
          /*
          {
            sentiment: "Positive",
            score: 0.20766788536,
            emotional_phrase: [
              {
                form: "謳歌",
                emotion: "喜ぶ,安心"
              }
            ]
          }
          */
          res.write( JSON.stringify( { status: true, message: body.message, result: result }, null, 2 ) );
          res.end();
        }
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'not ready' }, null, 2 ) );
    res.end();
  }
});

//. ユーザー属性分析
app.post( '/api/user_attribute', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var text = req.body.text;
  if( access_token && settings_api_url && text ){
    var data = {
      document: text,
      type: 'kuzure',
      do_segment: false
    };
    var option = {
      url: settings_api_url + 'nlp/beta/user_attribute',
      method: 'POST',
      json: data,
      headers: { 
        'Content-Type': 'application/json; charset=UTF-8', 
        'Authorization': 'Bearer ' + access_token
      }
    };
    request( option, ( err, res0, body ) => {
      if( err ){
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err }, null, 2 ) );
        res.end();
      }else{
        if( body && body.status ){
          res.status( 400 );
          res.write( JSON.stringify( { status: false, message: body.message, error: body.message }, null, 2 ) );
          res.end();
        }else{
          var result = body.result;
          /*
          {
            age: "40-49歳",  **
            civilstatus: "既婚",  **
            earnings: "不明",
            gender: "不明",
            habit: [ "ALCOHOL" ],  *
            hobby: [ "ANIMAL", "COOKING", "FISHING", .. ],  *
            kind_of_business: "不明",
            kind_of_occupation: "不明",
            location: "不明",  **
            moving: [ "RAILWAY" ], *
            occupation: "会社員",  **
            position: "不明"
          }
          */
          res.write( JSON.stringify( { status: true, message: body.message, result: result }, null, 2 ) );
          res.end();
        }
      }
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'not ready' }, null, 2 ) );
    res.end();
  }
});


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );
