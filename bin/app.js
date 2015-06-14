var proxyPort = 8001;
var http = require("http");
var httpsProxy = require("./httpsProxy")
var httpProxy = require("./httpProxy");

var server = http.createServer(function(incomingRequest, response) {
  httpProxy.processHttpRequest(incomingRequest, response);   
});

httpsProxy.setupHttpsProxy(server);
server.listen(proxyPort);
console.log("Server is listening on port %s", proxyPort);
 