var proxyPort = 8001;
var http = require("http");
var httpsProxy = require("./httpsProxy")

function copyHeader(headerName, incomingRequest, outgoingRequest)
{
  if (incomingRequest.headers[headerName])
  {
    outgoingRequest.setHeader(headerName, incomingRequest.headers[headerName]);
  }
}

function processRequest(incomingRequest, response)
{
    var req = http.request(incomingRequest.url, function(res) {
        var data = [];

        res.on('data', function (chunk) {
            data.push(chunk);
        });
        res.on('end', function() {
    
          for(var property in res.headers)
          {
            var headerValue = res.headers[property];
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
    
    copyHeader('cookie', incomingRequest, req);
    copyHeader('accept', incomingRequest, req);
    copyHeader('connection', incomingRequest, req);
    copyHeader('authorization', incomingRequest, req);
    copyHeader('content-type', incomingRequest, req);
    copyHeader('content-length', incomingRequest, req);
    copyHeader('pragma', incomingRequest, req);
    
    req.end();      
}

var server = http.createServer(function(incomingRequest, response) {
  processRequest(incomingRequest, response);   
});

httpsProxy.setupHttpsProxy(server);
server.listen(proxyPort);
console.log("Server is listening on port %s", proxyPort);
 