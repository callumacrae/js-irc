var sys = require('sys'),
	options = require('./test.config'),
	IRC = require('./lib/lib'),
	irc = new IRC(options),
	url = require('url'),
	querystring = require('querystring');

irc.connect()

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
				if (data.msg !== undefined && data.chan !== undefined)
				{
					irc.privmsg(data.chan, data.msg)
				}
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