var http = require("http");
var stats = require("./userStats")
var fs = require('fs');

function IsRequestForLocalResource(incomingRequest)
{
    return incomingRequest.url[0] == '/';
}

function writeResponse(response, statusCode, contentType, content)
{
    response.writeHead(statusCode,  { 'Content-Type': contentType });
    response.write(content);
    response.end();   
}

function ProcessLocalRequest(incomingRequest, response)
{
    var resource = "../" + incomingRequest.url.substr(1); // first char should be a '/' which we don't want to include
    
    if (fs.existsSync(resource))
    {
        writeResponse(response, 200, 'text/html', fs.readFileSync(resource));
    }
    else
    {
        writeResponse(response, 404, 'text/html', '<html><body>Cannot find what you are looking for.</body></html>');
    }    
}

function ProcessExternalRequest(incomingRequest, response)
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
        writeResponse(response, 500, 'text/html', '<html><body>Unknown error. Perhaps address is incorrect?</body></html>');
    });
    
    for(var header in incomingRequest.headers)
      req.setHeader(header, incomingRequest.headers[header]);
      
    req.end();         
}

exports.processHttpRequest = function (incomingRequest, response)
{
    if (IsRequestForLocalResource(incomingRequest))
    {
        ProcessLocalRequest(incomingRequest, response);
    } 
    else   
    {
        ProcessExternalRequest(incomingRequest, response);
    }
}

