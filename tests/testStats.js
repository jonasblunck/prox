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
}

testRequestCount();




