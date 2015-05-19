var fs = require('fs');
var util = require('util');
var path = require('path');
var dns = require('dns');

var usageData = {};
var usageIdleThresholdMinutes = 2; // no request in 2 minutes means user is idle
var lastReportDate = new Date();

function createTrackerItem(user, requestTime)
{
  var item = {
    'user' : user,
    'startTime' : requestTime,
    'endTime' : requestTime,
    'requestCount' : 0,
    'nextItem' : null,
    'dnsName' : user,   
    'getUsageMinutes' : function(){
      return (this.endTime - this.startTime) / (1000 * 60);  
    }
    
  };
  
  // do reverse dns lookup on user
  try {
    dns.reverse(user, function(error, domain) {
      if (!error)
      {
        item.dnsName = domain[0];
      }
    });
  }
  catch (e) {    
  }
  
  return item;
}

function internalGetUsage(user)
{
  return usageData[user];
}

function internalGetLastUsageData(user)
{
  var usage = usageData[user];
    
  while (null != usage.nextItem)
    usage = usage.nextItem;

  return usage;  
}

function getReportData(usage, userKey)
{
   var totalRequests = 0;
   var totalMinutes = 0;
   var entries = 0;
   var firstTransaction = usage.startTime;
   var lastTransaction = usage.endTime;
   var dnsName = usage.dnsName;
   
   // iterate over all records
   while (null != usage)
   {      
     entries++;
     totalRequests += usage.requestCount;
     totalMinutes += usage.getUsageMinutes();
     lastTransaction = usage.endTime;
      
     usage = usage.nextItem;
   }
   
  var item = {
    'user' : userKey,
    'startTime' : firstTransaction,
    'endTime' : lastTransaction,
    'totalRequests' : totalRequests,
    'totalMinutes' : totalMinutes,
    'recordCount' : entries,
    'dnsName' : dnsName
  };
  
  return item;   
}

function doReportingIfOld()
{
  var secondsBetweenReporting = 60;
  var now = new Date();
  
  if ((now - lastReportDate) > (1000 * secondsBetweenReporting))  
  {
    var fileName = util.format("proxy_log_%s_%s_%s.log", now.getFullYear(), now.getMonth(), now.getUTCDate());
    var fileStream = fs.createWriteStream(path.resolve(__dirname, fileName), 'ascii');
    
    for (var userKey in usageData)
    {
      var usage = usageData[userKey];
      var reportData = getReportData(usage, userKey);
      
      console.log('Reporting on %s (%s)', reportData.user, reportData.dnsName);
      
      fileStream.write(util.format("User '%s' has issued %s requests and used %s minutes [%s records].\n", 
        reportData.dnsName, 
        reportData.totalRequests,
        reportData.totalMinutes,
        reportData.recordCount));
      
      // clear out data if new day
      if (now.getDay() != reportData.endTime.getDay())
        usageData[userKey] = null;             
    }
    
  	fileStream.end();
    lastReportDate = now;
  }   
}

function internalTrackUsage(user, address, requestTime)
{
  // create user book-keeping if we don't have it
  if (null == usageData[user])
    usageData[user] = createTrackerItem(user, requestTime);
  
  var usage = internalGetLastUsageData(user);
  
  // if last request time is older than threshold, create new tracker
  if (((requestTime - usage.endTime) / (1000 * 60)) < usageIdleThresholdMinutes)
  { 
    usage.requestCount++;
    usage.endTime = requestTime;
  }
  else
  {
    usage.nextItem = createTrackerItem(user, requestTime); 
    usage.nextItem.requestCount++;  
  }  
}

exports.getUsage = function(user)
{
  return internalGetUsage(user);
};

exports.trackUsage = function(user, address, requestTime)
{
  internalTrackUsage(user, address, requestTime);
  doReportingIfOld();
};

