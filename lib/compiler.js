var Parser = require('./parser'),
	Walker = require('./walker'),
	Compiler = {};

Compiler.compile = function(input)
{
	var tree = Parser.parse(input);
	return Walker.walk(tree);
}

module.exports = Compiler;
