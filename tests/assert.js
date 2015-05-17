
exports.isTrue = function(expression)
{
	if (!expression)
	{
		console.log('assert.isTrue failed.');
	}	
};

exports.areEqual = function(left, right)
{
   if (left != right)
   {
	   console.log("assert.areEqual failed. Got '%s' but expected '%s'", right, left);
   }	
};
