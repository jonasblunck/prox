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
   
   var host = incomingRequest.headers['host'];
   var requestPathOffset = incomingRequest.url.search(host) + host.length;
   var path = incomingRequest.url.substr(requestPathOffset);
   
   var options = {
        hostname: host,
        port: 80,
        path: path,
        method: incomingRequest.method,
        headers: incomingRequest.headers,
    }; 

    // initiate the request
    var req = http.request(options, function(res) {
        
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
        console.log('The following error occurred: ' + e);
    });

    // for POST actions, we need to write the body to the request
    if (incomingRequest.method == 'POST')
    {   
        var bytesleftToWrite = incomingRequest.headers['content-length'];
        
        incomingRequest.on('data', function(chunk){
            bytesleftToWrite = bytesleftToWrite - chunk.length;
            req.write(chunk);
            
            if (bytesleftToWrite == 0)
            {
              req.end();
            }            
        });
    }
    else
    {
        req.end();
    }
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

