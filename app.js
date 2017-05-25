var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);
var http = require("http");
var url = require("url");
var crypto = require("crypto");
var request = require("request");
var fs=require("fs");
var util=require("util");
// var redis=require("redis");

// var client = redis.createClient();

var cache = require('memory-cache');
var access_token="";
// if you'd like to select database 3, instead of 0 (default), call 
// client.select(3, function() { /* ... */ }); 
 
// client.on("error", function (err) {
//     console.log("Error " + err);
// });

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
var APPID='wx0d215ec078c80bc0';
var SECRET='a6ee3f5b61b3ee85307840f5853d2785';
var CODE="";
function sha1(str){
  var md5sum = crypto.createHash("sha1");
  md5sum.update(str);
  str = md5sum.digest("hex");
  return str;
}

// app.use(function(req,res,next){
//   var query = url.parse(req.url,true).query;
//   //console.log("*** URL:" + req.url);
//   //console.log(query);
//   var signature = query.signature;
//   var echostr = query.echostr;
//   var timestamp = query['timestamp'];
//   var nonce = query.nonce;
//   var oriArray = new Array();
//   oriArray[0] = nonce;
//   oriArray[1] = timestamp;
//   oriArray[2] = "940421";//
//   oriArray.sort();
//   var original = oriArray.join('');
//   console.log("Original str : " + original);
//   console.log("Signature : " + signature );
//   var scyptoString = sha1(original);
//   if(signature == scyptoString){
//     res.end(echostr);
//     console.log("Confirm and send echo back");

//     next();
//   }else {
//     res.end("false");
//     console.log("Failed!");
//   }
// })
app.use(function(req, res, next){
  if(cache.get("access_token")){
    access_token=cache.get("access_token");
    console.log(access_token);
    next();
  }else{
    request.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx0d215ec078c80bc0&secret=a6ee3f5b61b3ee85307840f5853d2785', function (err, data) {
          cache.put("access_token", JSON.parse(data.body).access_token,7199000,function(key,value){
            if(value){
              access_token=cache.get("access_token");
              console.log(value);
              next();
            }
          });
        })
  }
        
      

})


	  //var access_token = JSON.parse(data.body).access_token;
    var menu = "https://api.weixin.qq.com/cgi-bin/menu/create?access_token=" + cache.get("access_token");
    // var message="https://api.weixin.qq.com/cgi-bin/get_current_autoreply_info?access_token="+access_token;
    console.log(cache.get("access_token"));
    console.log(menu);
    request.post(menu, {form:`{
      
        "button":[
     
      {
            "type":"view",
           "name":"欢迎点菜",
           "url":"http://food.ngrok.xiaomiqiu.cn/"

       }]
      }`}, function(err, data) {
         console.log(err);
        console.log(data);
      }
    );

  
  
app.use(bodyParser.xml({
  limit: '1MB',   // Reject payload bigger than 1 MB
  xmlParseOptions: {
    normalize: true,     // Trim whitespace inside text nodes
    normalizeTags: true, // Transform tags to lowercase
    explicitArray: false // Only put nodes in array if >1
  }
}));
app.use(function (req, res, next) {
		console.log(req.url);
		//res.writeHead(200, {'Content-Type': 'application/xml;charset=utf-8'});
		// fs.writeFile('C:\\a.json',util.inspect(req.body.xml,{depth: 100 }));
    
		if(req.body.xml){
      
			var xml=req.body.xml;
      console.log(xml);
			var resMsg='';
			if(xml.msgtype==='text'){
				if(xml.content.indexOf("菜单")>-1){
					resMsg=`<xml>
						<ToUserName><![CDATA[${xml.fromusername}]]></ToUserName>
						<FromUserName><![CDATA[${xml.tousername}]]></FromUserName>
						<CreateTime>${parseInt(new Date().valueOf() / 1000)}</CreateTime>
						<MsgType><![CDATA[text]]></MsgType>
						<Content><![CDATA[http://food.ngrok.xiaomiqiu.cn/]]></Content>
						</xml>`;
				}else if(xml.content.indexOf("活动")>-1){
					resMsg=`<xml>
						<ToUserName><![CDATA[${xml.fromusername}]]></ToUserName>
						<FromUserName><![CDATA[${xml.tousername}]]></FromUserName>
						<CreateTime>${parseInt(new Date().valueOf() / 1000)}</CreateTime>
						<MsgType><![CDATA[text]]></MsgType>
						<Content><![CDATA[100积分可以换10元抵用券哦]]></Content>
						</xml>`;
				}else{
					resMsg=`<xml>
						<ToUserName><![CDATA[${xml.fromusername}]]></ToUserName>
						<FromUserName><![CDATA[${xml.tousername}]]></FromUserName>
						<CreateTime>${parseInt(new Date().valueOf() / 1000)}</CreateTime>
						<MsgType><![CDATA[text]]></MsgType>
						<Content><![CDATA[我不明白您的意思]]></Content>
						</xml>`;
				}
				
				res.send(resMsg);
			}else{
				console.log("next");
				next();
			}
		}else{
			console.log("next2");
			next();
		}
		
  
	
	//console.log(req.socket._events);

		//next();

});

app.use('/', index);
app.use('/users', users);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
