var proxyPort = 8001;
var http = require("http");
var httpsProxy = require("./httpsProxy")

var server = http.createServer(function(incomingRequest, response) {
  
  var req = http.request(incomingRequest.url, function(res) {
    console.log("Requesting: " + incomingRequest.url);
    
    var data = [];

    res.on('data', function (chunk) {
        data.push(chunk);
    });
    res.on('end', function() {

      for(var property in res.headers)
        response.setHeader(property, res.headers[property]);
        
      response.statusCode = res.statusCode;
      response.write(Buffer.concat(data));
        
      response.end();
       
    });
  });
  
  req.end();    
});


httpsProxy.setupHttpsProxy(server);
server.listen(proxyPort);
console.log("Server is listening");
 