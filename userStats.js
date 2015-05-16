
var requestCount = {};

function trackRequestCount(user, address)
{
  if (!requestCount[user])
    requestCount[user] = 0;
    
  requestCount[user]++;
  
  if (0 == (requestCount[user] % 100))
  {
    console.log('User [%s] has made %s requests.', user, requestCount[user]);
  }  
}

exports.trackUsage = function(user, address)
{
  trackRequestCount(user, address);
}
