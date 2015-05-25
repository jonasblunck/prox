var http = require("http");
var stats = require("./userStats")

exports.processHttpRequest = function (incomingRequest, response)
{
    // track request     
    stats.trackUsage(incomingRequest.socket.remoteAddress, incomingRequest.url, new Date());

    // process request
    var req = http.request(incomingRequest.url, function(res) {
        res.on('data', function (chunk) {
            response.write(chunk, 'binary');
        });
        res.on('end', function() {
          response.end();
        });
    
        response.writeHead(res.statusCode, res.headers);
    });
    
    req.on('error', function(e) {
      	response.writeHead(500, { 'Content-Type': 'text/html' });
        response.write('<html><body>Unknown error. Perhaps address is incorrect?</body></html>');
        response.end();
    });
    
    for(var header in incomingRequest.headers)
      req.setHeader(header, incomingRequest.headers[header]);
      
    req.end();      
}

