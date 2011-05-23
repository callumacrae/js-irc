var net = require('net'),
	path = require('path'),
	sys = require('sys'),
	fs = require('fs');
	Compiler = require('./compiler');

require.paths.unshift(path.join(__dirname, '..', 'node_modules'));
require.paths.unshift(path.join(__dirname));

function IRC(options, client)
{
	//options
	var internal = {
		buffer: '',
		connected: false,
		privmsg_queue: [],
		listener_cache: {},
		single_listener_cache: {},
		cache: {},
		locks: {}
	},
	emitter = new process.EventEmitter(),
	stream;

	this.options = options

	function do_connect()
	{
		internal.connected = true;
		internal.connected_since = +new Date;

		if (this.options.pass !== undefined)
		{
			this.raw('PASS ' + this.options.pass);
		}

		this.raw('NICK ' + this.options.nick);

		var mode = (this.options.user.wallops ? 4 : 0) + (this.options.user.invisible ? 8 : 0);
		this.raw('USER ' + [this.options.user.username, mode, '*'].join(' ') + ((this.options.user.realname) ? ' :' + this.options.user.realname : ''));

		// Privmsg queue for flood protection
		internal.privmsg_queue_timer = setInterval(function tick()
		{
			var m;
			if (m = internal.privmsg_queue.pop())
			{
				privmsg.call(this, m.receiver, m.message);
			}
		}.bind(this), 200);

		emitter.emit('connected');
	}

    function do_disconnect()
	{
		clearTimeout(internal.privmsg_queue_timer);
		internal.privmsg_queue = [];
		internal.connected = false;
		stream.end();
		emitter.emit('disconnected');
	}

    //parse incoming messages
	function parseMessage(data)
	{
		var buffer, last, message, command, i;
		internal.last_message = +new Date;

		//apply previous buffer, split, re-buffer
		if (!!internal.buffer)
		{
			data = internal.buffer + data;
			internal.buffer = '';
		}
		buffer = data.split(/\r\n/);
		if (last = buffer.pop())
		{
			internal.buffer = last;
		}

		//emit!
		for (i = 0; i < buffer.length; i++)
		{
			client.send(buffer[i]);

			//compile
			try
			{
				message = Compiler.compile(buffer[i] + "\r\n");
			}
			catch (err)
			{
				sys.puts("[ERROR] Failed parsing '" + buffer[i] + "'");
			}

			if (message.command === '001' || (message.command === 'nick' && message.person.nick == client.nick))
			{
				client.nick = message.params[0];
			}

			//we're "connected" once we receive data
			if (!internal.connected)
			{
				do_connect.call(this);
			}

			// Emit event
			emitter.emit(message.command, message);
		}
	}

    emitter.addListener('ping', function(message)
	{
		this.raw('PONG ' + ':' + message.params[0]);
	}.bind(this));

	this.connect = function(hollaback)
	{
		var not_open;
		if (!stream || (not_open = (['open', 'opening'].indexOf(stream.readyState) < 0)))
		{
			if (not_open)
			{
				stream.end();
				stream.removeAllListeners();
				stream = null;
			}

			stream = new net.Stream();
			stream.setEncoding(this.options.encoding);
			stream.setTimeout(0);

			//forward network errors
			stream.addListener('error', function(er)
			{
				emitter.emit('error', er);
				emitter.emit('error:network', er);
			})

			//receive data
			stream.addListener('data', parseMessage.bind(this));

			//timeout
			stream.addListener('timeout', do_disconnect.bind(this));

			//end
			stream.addListener('end', do_disconnect.bind(this));

			stream.connect(this.options.port, this.options.server);
		}

		if (typeof hollaback === 'function')
		{
			this.listenOnce('connected', hollaback);
		}

		return this;
	}

	this.disconnect = function()
	{
		do_disconnect.call(this);
		return this;
	}

	this.raw = function(data)
	{
		if (stream.readyState == 'open')
		{
			data = data.slice(0, 509);
			if (!/\r\n$/.test(data)) data += "\r\n";
			stream.write(data);

			client.send(':' + client.nick + '!username@host ' + data.replace(/\r\n$/, ""));
		}
		return this;
	}

	//listener
	this.on = function(event, hollaback)
	{
		var bound = hollaback.bind(this);

		if (!internal.listener_cache[event])
		{
			internal.listener_cache[event] = [];
		}

		internal.listener_cache[event].push(bound);
		emitter.addListener(event, bound);
		return this;
	}
	//alias of on
	this.addListener = this.on;

	//listen once
	this.once = function(event, hollaback)
	{
		//store reference and wrap
		internal.single_listener_cache[hollaback] = function(hollaback, message)
		{
			//call function
			hollaback.call(this, message)

			//unregister self
			setTimeout(function()
			{
				emitter.removeListener(event, internal.single_listener_cache[hollaback]);
				delete internal.single_listener_cache[hollaback];
			}, 0);
		}.bind(this, hollaback);

		//listen
		emitter.addListener(event, internal.single_listener_cache[hollaback]);
	}
	//alias of once
	this.listenOnce = this.once;

	this.privmsg = function(receiver, msg)
	{
		var max_length, private_messages, i;
		max_length = 500 - receiver.length;
		private_messages = msg.match(new RegExp('.{1,' + max_length + '}', 'g'));

		for (i = 0; i < private_messages.length; i++)
		{
			if (i > 0)
			{
				internal.privmsg_queue.push({
					receiver: receiver,
					message: private_messages[i]
				});
			}
			else
			{
				this.raw('PRIVMSG ' + receiver + ' :' + private_messages[i]);
			}
		}
		return this;
	}
}

//numeric error codes
IRC.errors = {};

//numeric reply codes
IRC.replies = {};

module.exports = IRC;
