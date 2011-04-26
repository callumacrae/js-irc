var sys = require('sys')

var options = {
	server:	'irc.webdevrefinery.com',
	port:	6677,
	nick:	'callum',
	user: {
		username:	'callumacrae',
		hostname:	'what.is.this',
		servername:	'nodeXB1',
		realname:		'Node XB'
	}
};

var IRC = require('./lib/lib')
var irc = new IRC(options);

function handle_commands(message)
{
	command = message.params[1].split(' ')
	switch (command[0])
	{
		case "join":
			irc.join(command[1]);
			break;
		
		case "identify":
			irc.privmsg('NickServ', 'IDENTIFY callumacrae ')
			break;
		
		case "say":
			delete command[0]
			irc.privmsg(message.params[0], command.join(' '))
			break;
		
		case "nick":
			irc.nick(command[1])
			break;
		
		case "slap":
			irc.privmsg(message.params[0], "\001ACTION slaps " + command[1] + " around a bit with a large trout.\001");
			break;
		
		case "crash":
			irc.privmsg(message.params[0], "Command not found. Searching...")
			setTimeout(function()
			{
				irc.privmsg(message.params[0], "Windows has encountered a problem and has had to close. Sorry for any inconvinient caused.")
				irc.quit()
			}, 10000)
	}
}

irc.on('privmsg', function(message)
{
	try
	{
		if (message.person.nick == 'callumacrae' && message.params[0] == options.nick)
		{
			handle_commands(message)
		}
		else if (message.params[0].slice(0, 1) == '#' && message.params[1].slice(0, options.nick.length) == options.nick)
		{
			message.params[1] = message.params[1].slice(options.nick.length + 2, message.params[1].length)
			handle_commands(message)
		}
	}
	catch (err)
	{
		if (err == TypeError)
		{
			return true;
		}
	}
})
irc.connect();