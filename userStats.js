
var usageData = {};

function createTrackerItem(user, requestTime)
{
  var item = {
    'user' : user,
    'startTime' : requestTime,
    'endTime' : requestTime,
    'requestCount' : 0,  
    
    'getUsageMinutes' : function(){
      return (this.endTime - this.startTime) / (1000 * 60);  
    }
  };
  
  return item;
}

function internalGetUsage(user)
{
  return usageData[user];
}

function internalTrackUsage(user, address, requestTime)
{
  if (null == usageData[user])
  {
    usageData[user] = createTrackerItem(user, requestTime);  
  }
  
  var usage = usageData[user];
  usage.requestCount++;
  usage.endTime = requestTime;
}

exports.getUsage = function(user)
{
  return internalGetUsage(user);
};

exports.trackUsage = function(user, address, requestTime)
{
  internalTrackUsage(user, address, requestTime);
};

