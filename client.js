var sys = require('sys'),
	options = require('./test.config'),
	IRC = require('./lib/lib'),
	irc = new IRC(options),
	url = require('url'),
	querystring = require('querystring'),
	io = require('socket.io'),
	http = require('http'),  
	path = require('path'),
	fs = require('fs');

function handle_msg(data)
{
	if (data.msg == undefined || data.chan == undefined)
	{
		return false
	}

	if (data.msg.slice(0, 1) == '/' && data.msg.slice(0, 2) != '//')
	{
		var command = data.msg.slice(1, data.msg.indexOf(' '));
		var rest_of = data.msg.slice(data.msg.indexOf(' ') + 1, data.msg.length)
		switch (command)
		{
			case "msg":
			case "query":
				var nick = rest_of.slice(0, rest_of.indexOf(' '))
				var msg = rest_of.slice(rest_of.indexOf(' ') + 1, rest_of.length)
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
	return true
}

server = http.createServer(function (req, res)
{
	req.setEncoding('utf8')
	
	if (req.url == '/')
		var filename = path.join(process.cwd(), 'html/index.html')
	else
		var filename = path.join(process.cwd(), 'html/' + url.parse(req.url).pathname)
	
	path.exists(filename, function(exists)
	{  
		if (!exists)
		{  
			res.writeHeader(404, {"Content-Type": "text/plain"})
			res.end("404 Not Found\n")
			return
		}  
	
		fs.readFile(filename, "binary", function(err, file)
		{  
			if(err)
			{  
				res.writeHeader(500, {"Content-Type": "text/plain"})
				res.end(err + "\n")
				return
			}  
	
			res.writeHeader(200)
			res.end(file, "binary")
		})
	})
})
server.listen(1337, "127.0.0.1")

var socket = io.listen(server);
socket.on('connection', function(client)
{
	console.client = client //horrible global!
	irc.connect()
	client.on('message', handle_msg)
	client.on('disconnect', function()
	{
		irc.quit('https://github.com/callumacrae/irc-js/')
	}) 
});