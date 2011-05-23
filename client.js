var options = require('./config'),
	IRC = require('./lib/lib'),
	url = require('url'),
	io = require('socket.io'),
	http = require('http'),  
	path = require('path'),
	fs = require('fs'),
	dns = require('dns');

server = http.createServer(function (req, res)
{
	req.setEncoding('utf8');
	var filename = 'html' + ((req.url == '/') ? '/index.html' : url.parse(req.url).pathname);
	
	if (filename == 'html/js/config.js')
	{
		res.writeHeader(200);
		res.end('var config = { ip:"' + options.server.address + '", port:' + options.server.port + '};', "binary");
		return;
	}
	
	filename = path.join(process.cwd(), filename);
	
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
server.listen(options.server.port, options.server.address);

function write(text)
{
	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	var d = new Date();
	var date = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
	
	console.log(date + ' - ' + text);
}

var socket = io.listen(server);
socket.on('connection', function(client)
{
	client.irc_connected = false;
	client.on('message', function(data)
	{
		if (!client.irc_connected)
		{
			if (data.server !== undefined && data.nick !== undefined)
			{
				for (var item in data)
				{
					options.irc[item] = data[item];
				}
					
				return dns.resolve(data.server, 'A', function(err)
				{
					if (err)
					{
						return false;
					}
					
					client.irc_info = data;
					write('Connecting to ' + data.server);
					client.irc = new IRC(options.irc, client);
					client.irc.connect();
					client.irc.on('error', function(data)
					{
						write('An error occurred:');
						console.log(data);
					});
					client.irc_connected = true;
					return true;
				});
			}
			return false;
		}
		
		if (data.msg == undefined || data.chan == undefined || data.msg == null)
		{
			return false;
		}
		if (data.msg.slice(0, 1) == '/' && data.msg.slice(0, 2) != '//')
		{
			var index_of = data.msg.indexOf(' ') === -1 ? data.msg.length : data.msg.indexOf(' ');
			var command = data.msg.slice(1, index_of);
			var rest_of = data.msg.slice(index_of + 1);
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
					client.irc.quit('https://github.com/callumacrae/js-irc/');
					write('Disconnected from ' + client.irc_info.server);
					client.irc_connected = false;
					break;
				
				case "me":
					client.irc.raw('PRIVMSG ' + data.chan + ' :\u0001ACTION ' + rest_of + '\u0001');
					break;
				
				case "ns":
					client.irc.raw('PRIVMSG NickServ ' + rest_of);
					break;
				
				case "cs":
					client.irc.raw('PRIVMSG ChanServ ' + rest_of);
					break;
				
				case "slap":
					client.irc.raw('PRIVMSG ' + data.chan + ' :\u0001ACTION slaps ' + rest_of + ' around a bit with a large trout.\u0001');
					break;
				
				default:
					client.irc.raw(command.toUpperCase() + ' ' + rest_of);
					break;
			}
		}
		else
		{
			if (data.msg.slice(0, 2) == '//')
			{
				data.msg = data.msg.slice(1, data.msg.length);
			}
			client.irc.privmsg(data.chan, data.msg);
		}
		return true;
	});

	client.on('disconnect', function()
	{
		if (client.irc_connected)
		{
			client.irc.quit('https://github.com/callumacrae/js-irc/');
			write('Disconnected from ' + client.irc_info.server);
		}
	});
});