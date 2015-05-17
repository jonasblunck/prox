
exports.isTrue = function(expression, message)
{
	if (!expression)
	{
		console.log('Test failed: %s', message);
	}	
};

exports.areEqual = function(left, right)
{
   if (left != right)
   {
	   console.log("assert.areEqual failed. Got '%s' but expected '%s'", right, left);
   }	
};
