var assert = require("./assert");
var stats = require("../userStats");

function testRequestCount()
{
  var requestDate = new Date(2015, 10, 10, 10, 10, 10);
  stats.trackUsage('userA', 'address', requestDate);
  
  var usage = stats.getUsage('userA');
  assert.areEqual(1, usage.requestCount);
  assert.areEqual(requestDate, usage.startTime);
  assert.areEqual(requestDate, usage.endTime);
  assert.areEqual(null, usage.nextItem);
}

function testUsageTime()
{
  var firstRequest = new Date(2015, 10, 10, 10, 10, 0);
  var secondRequest = new Date(2015, 10, 10, 10, 10, 22);
  var thirdRequest = new Date(2015, 10, 10, 10, 11, 0);
  
  stats.trackUsage('userB', 'any', firstRequest);
  stats.trackUsage('userB', 'any', secondRequest);
  stats.trackUsage('userB', 'any', thirdRequest);
  
  var usage = stats.getUsage('userB');
  assert.areEqual(3, usage.requestCount);
  assert.areEqual(1, usage.getUsageMinutes());
  assert.areEqual(null, usage.nextItem);
}

function testMultiUsage()
{
  var firstRequest = new Date(2015, 10, 10, 10, 10, 0);
  var secondRequest = new Date(2015, 10, 10, 10, 11, 0);
  var thirdRequest = new Date(2015, 10, 10, 10, 16, 0);
  var forthRequest = new Date(2015, 10, 10, 10, 16, 20);
  var lastRequest = new Date(2015, 10, 10, 10, 17, 0);
  
  stats.trackUsage('userC', 'any', firstRequest);
  stats.trackUsage('userC', 'any', secondRequest);
  stats.trackUsage('userC', 'any', thirdRequest);
  stats.trackUsage('userC', 'any', forthRequest);
  stats.trackUsage('userC', 'any', lastRequest);
  
  var usage = stats.getUsage('userC');

  assert.areEqual(1, usage.getUsageMinutes());
  assert.areEqual(1, usage.nextItem.getUsageMinutes()); 
  assert.areEqual(2, usage.requestCount);
  assert.areEqual(3, usage.nextItem.requestCount);
  assert.areEqual(5, usage.getTotalRequestCount());
}

testRequestCount();
testUsageTime();
testMultiUsage();



