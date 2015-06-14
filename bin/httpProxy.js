var http = require("http");
var stats = require("./userStats");
var fs = require('fs');
var path = require('path');
var util = require('util');

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

function GetRootDir()
{
    return rootPath = path.join(__dirname, '..');       
}

function GenerateListing(directory, response)
{
    var relativeRoot = directory.substr(GetRootDir().length);
    
    var files = fs.readdirSync(directory);
    var html = '<html><head><title>Listing</title></head><body>';
    
    for(var i = 0; i < files.length; ++i)
    {
       html += util.format("<a href='%s/%s'>%s</a></br>", relativeRoot, files[i], files[i]);    
    }
    
    html += '</body></html>';
    
    writeResponse(response, 200, 'text/html', html);
}

function ProcessLocalRequest(incomingRequest, response)
{
    var resource = path.join(GetRootDir(), incomingRequest.url.substr(1)); // first char should be a '/' which we don't want to include

    stats.trackUsage(incomingRequest.socket.remoteAddress, resource, new Date());

    if (!fs.existsSync(resource))
    {
        writeResponse(response, 404, 'text/html', '<html><body>Cannot find what you are looking for.</body></html>');  
        return;     
    }
    
    if (fs.existsSync(resource) && fs.lstatSync(resource).isDirectory())
    {
        GenerateListing(resource, response);        
    }    
    else 
    {
        console.log("GET for file: " + resource);
        writeResponse(response, 200, 'text/html', fs.readFileSync(resource));
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

