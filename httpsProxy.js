
var http = require("http");
var net = require("net");
var stats = require("./userStats")

var regex_hostport = /^([^:]+)(:([0-9]+))?$/;

function getHostPortFromString( hostString, defaultPort ) {
  var host = hostString;
  var port = defaultPort;
 
  var result = regex_hostport.exec( hostString );
  if ( result != null ) {
    host = result[1];
    if ( result[2] != null ) {
      port = result[3];
    }
  }
 
  return( [ host, port ] );
}

exports.setupHttpsProxy = function(server) {

  // add handler for HTTPS (which issues a CONNECT to the proxy)
  server.addListener(
    'connect',
    function ( request, socketRequest, bodyhead ) {
      var url = request['url'];
      var httpVersion = request['httpVersion'];
 
      var hostport = getHostPortFromString( url, 443 );
      var userAddress = socketRequest.remoteAddress;
 
      // set up TCP connection
      var proxySocket = new net.Socket();
      proxySocket.connect(
        parseInt( hostport[1] ), hostport[0],
        function () {
          proxySocket.write( bodyhead );
          socketRequest.write( "HTTP/" + httpVersion + " 200 Connection established\r\n\r\n" );
        }
      );
 
      proxySocket.on(
        'data',
        function ( chunk ) {
          socketRequest.write( chunk );
          stats.trackUsage(userAddress, url);
        }
      );
 
      proxySocket.on(
        'end',
        function () {
          socketRequest.end();
        }
      );
 
      socketRequest.on(
        'data',
        function ( chunk ) {
          proxySocket.write( chunk );
          stats.trackUsage(userAddress, url);
        }
      );
 
      socketRequest.on(
        'end',
        function () {
          proxySocket.end();
        }
      );
 
      proxySocket.on(
        'error',
        function ( err ) {
          socketRequest.end();
        }
      );
 
      socketRequest.on(
        'error',
        function ( err ) {
//          console.log('[Requesting] HTTPS proxy error: %s', err );
          proxySocket.end();
        }
      );
    }
  ); 
}