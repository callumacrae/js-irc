var sys = require('sys'),
	options = require('./test.config'),
	IRC = require('./lib/lib'),
	irc = new IRC(options),
	url = require('url'),
	querystring = require('querystring');

irc.connect()

function handle_msg(data)
{
	if (data.msg == undefined || data.chan == undefined)
	{
		return false
	}

	if (data.msg.slice(0, 1) == '/' && data.msg.slice(0, 2) != '//')
	{
		var command = data.msg.slice(1, data.msg.indexOf(' '));
		var rest_of = data.msg.slice(data.msg.indexOf(' '), data.msg.length)
		switch (command)
		{
			case "msg":
			case "query":
				var nick = rest_of.slice(0, rest_of.indexOf(' '))
				var msg = rest_of.slice(rest_of.indexOf(' '), rest_of.length)
				irc.raw('PRIVMSG ' + nick + ' :' + msg)
				break;
				
			case "q":
			case "quit":
				irc.quit('https://github.com/callumacrae/irc-js/')
				break;
			
			default:
				irc.raw(command.toUpperCase() + ' ' + rest_of);
				break;
		}
	}
	else
	{
		irc.privmsg(data.chan, data.msg)
	}
}

var http = require('http');
http.createServer(function (req, res)
{
	res.writeHead(200, {'Content-Type': 'text/html'})
	req.setEncoding('utf8')
	
	switch (req.url)
	{
		case '/submit':
			req.addListener("data", function(data)
			{
				data = querystring.parse(data)
				handle_msg(data)
			});
			//no break

		case '/':
			res.end(
				'<form action="/submit" method="post">'+
				'<input type="text" name="msg">'+
				'<input type="hidden" name="chan" value="#test" />'+
				'<input type="submit" value="Submit">'+
				'</form>'
			);
			break;
	}
}).listen(1337, "127.0.0.1");