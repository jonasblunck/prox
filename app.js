var proxyPort = 8001;
var http = require("http");
var httpsProxy = require("./httpsProxy")

function processRequest(incomingRequest, response)
{
    var options = { 
      hostname: incomingRequest.headers["host"],
      path: incomingRequest.url,
      method: incomingRequest.method,
      headers: incomingRequest.headers
   };

    var req = http.request(options, function(res) {
        var data = [];

        res.on('data', function (chunk) {
            data.push(chunk);
        });
        res.on('end', function() {
    
          for(var property in res.headers)
          {
            var headerValue = res.headers[property];

            // this is a workaround for nodejs 
            // in some cases, the location header is 'https://something.xxhttp://something.xx', i.e both https and http location without any seperation            
            if (property == 'location')
              headerValue = headerValue.split('http://')[0];
            
            response.setHeader(property, headerValue);
          }        
            
          response.statusCode = res.statusCode;
          response.write(Buffer.concat(data));            
          response.end();
    
          console.log("[%s][%s] Processed %s.", res.statusCode, incomingRequest.socket.remoteAddress, incomingRequest.url);     
        });
    
    });
    
    req.on('error', function(e) {
      	response.writeHead(500, { 'Content-Type': 'text/html' });
        response.write('<html><body>Unknown error. Perhaps address is incorrect?</body></html>');
        response.end();
    });
    
    req.end();      
}

var server = http.createServer(function(incomingRequest, response) {
  processRequest(incomingRequest, response);   
});

httpsProxy.setupHttpsProxy(server);
server.listen(proxyPort);
console.log("Server is listening on port %s", proxyPort);
 