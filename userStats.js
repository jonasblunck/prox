
var usageData = {};
var usageIdleThresholdMinutes = 2; // no request in 2 minutes means user is idle

function createTrackerItem(user, requestTime)
{
  var item = {
    'user' : user,
    'startTime' : requestTime,
    'endTime' : requestTime,
    'requestCount' : 0,
    'nextItem' : null,  
    'getUsageMinutes' : function(){
      return (this.endTime - this.startTime) / (1000 * 60);  
    },
    'getTotalRequestCount' : function(){
      var total = this.requestCount;
      var item = this;
      while (null != item.nextItem)
      {
        item = item.nextItem;
        total += item.requestCount;
      }
      
      return total;
    },
    'getTotalUsageMinutes' : function(){
      var total = this.getUsageMinutes();
      var item = this;
      while (null != item.nextItem)
      {
        item = item.nextItem;
        total += item.getUsageMinutes;
      }
      
      return total;
    }
    
  };
  
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
  
  // temp reporting to std out
  if (usageData[user].getTotalRequestCount() % 100 == 0)
  {
    var totalRequests = usageData[user].getTotalRequestCount();
    var totalUsage = usageData[user].getTotalUsageMinutes();
    
    console.log("user '%s' has issued '%s' requests and used '%s' minutes", user, totalRequests, totalUsage);
  }
}

exports.getUsage = function(user)
{
  return internalGetUsage(user);
};

exports.trackUsage = function(user, address, requestTime)
{
  internalTrackUsage(user, address, requestTime);
};

