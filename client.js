var sys = require('sys'),
	options = require('./config'),
	IRC = require('./lib/lib'),
	url = require('url'),
	querystring = require('querystring'),
	io = require('socket.io'),
	http = require('http'),  
	path = require('path'),
	fs = require('fs');

server = http.createServer(function (req, res)
{
	req.setEncoding('utf8');
	
	if (req.url == '/')
		var filename = path.join(process.cwd(), 'html/index.html');
	else
		var filename = path.join(process.cwd(), 'html/' + url.parse(req.url).pathname);
	
	path.exists(filename, function(exists)
	{  
		if (!exists)
		{  
			res.writeHeader(404, {"Content-Type": "text/plain"});
			res.end("404 Not Found\n");
			return;
		}
	
		fs.readFile(filename, "binary", function(err, file)
		{  
			if(err)
			{  
				res.writeHeader(500, {"Content-Type": "text/plain"});
				res.end(err + "\n");
				return;
			}  
	
			res.writeHeader(200);
			res.end(file, "binary");
		});
	});
});
server.listen(1337, "127.0.0.1");

var socket = io.listen(server);
socket.on('connection', function(client)
{
	client.connected = false;
	client.on('message', function(data)
	{
		if (!client.connected)
		{
			if (data.server !== undefined && data.nick !== undefined)
			{
				for (var item in data)
					options[item] = data[item];
				
				console.log('Connecting to ' + data.server);
				client.irc = new IRC(options, client);
				client.irc.connect();
				client.connected = true;
				return true;
			}
			return false;
		}
		
		if (data.msg == undefined || data.chan == undefined)
		{
			return false;
		}
	
		if (data.msg.slice(0, 1) == '/' && data.msg.slice(0, 2) != '//')
		{
			var command = data.msg.slice(1, data.msg.indexOf(' '));
			var rest_of = data.msg.slice(data.msg.indexOf(' ') + 1, data.msg.length);
			switch (command)
			{
				case "msg":
				case "query":
					var nick = rest_of.slice(0, rest_of.indexOf(' '));
					var msg = rest_of.slice(rest_of.indexOf(' ') + 1, rest_of.length);
					client.irc.raw('PRIVMSG ' + nick + ' :' + msg);
					break;
					
				case "q":
				case "quit":
					client.irc.quit('https://github.com/callumacrae/irc-js/');
					break;
				
				default:
					client.irc.raw(command.toUpperCase() + ' ' + rest_of);
					break;
			}
		}
		else
		{
			client.irc.privmsg(data.chan, data.msg);
		}
		return true;
	});

	client.on('disconnect', function()
	{
		if (client.connected)
			client.irc.quit('https://github.com/callumacrae/irc-js/');
	});
});