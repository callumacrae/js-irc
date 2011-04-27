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
		switch (command)
		{
			case "join":
				if (data.msg.indexOf(' ', data.msg.indexOf(' ') + 1) !== -1)
					var end = data.msg.indexOf(' ', data.msg.indexOf(' ') + 1)
				else
					var end = data.msg.length
				var channel = data.msg.slice(data.msg.indexOf(' '), end)
				irc.join(channel)
				console.log(data.msg.indexOf(' ', data.msg.indexOf(' ')))
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