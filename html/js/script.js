var irc = {}
irc.chans = {
	console: {
		divname: 'console',
		names: [],
		topic: 'Welcome to Node.IRC!'
	}
}
irc.current_chan = 'console';
irc.hooks = {};

irc.connect = function(form)
{
	irc.socket = new io.Socket('127.0.0.1', {port:1337});
	irc.socket.connect();
	irc.socket.send({server:form.server.value, nick:form.nick.value});
	irc.current_nick = form.nick.value;
	jQuery('#connect').remove();
	irc.socket.on('message', function(data)
	{
		document.getElementById('console_main').innerHTML += '<li>' + data + '</li>';
		
		info = /:([0-9a-zA-Z\[\]\\`_^{|}\-]+)!~?[0-9a-zA-Z\[\]\\`_^{|}\-]+@[0-9a-zA-Z.-]+ JOIN :(.+)/.exec(data)
		if (info)
		{
			irc.switch_chans(info[2]);
			return;
		}
		
		info = /:([0-9a-zA-Z\[\]\\`_^{|}]+)!~?[0-9a-zA-Z\[\]\\`_^{|}\-]+@[0-9a-zA-Z.-]+ PART (.+)/.exec(data)
		if (info)
		{
			if (chan in irc.chans)
			{
				irc.call_hook('chan_part', chan);
				delete irc.chans[chan];
				irc.regen_chans();
			};
			return;
		}
		
		info = /:[0-9a-zA-Z.-]+ 332 [0-9a-zA-Z\[\]\\`_^{|}\-]+ [= |@ ]?([^ ]+) :(.+)/.exec(data)
		if (info)
		{
			irc.chans[info[1]].topic = info[2];
			if (info[1] == irc.current_chan)
				irc.call_hook('global_chan', {
					chan: info[1],
					topic: info[2]
				});
			return;
		}
		
		info = /:([0-9a-zA-Z\[\]\\`_^{|}\-]+)!~?[0-9a-zA-Z\[\]\\`_^{|}]+@[0-9a-zA-Z.-]+ TOPIC (.+) :(.+)/.exec(data)
		if (info)
		{
			irc.chans[info[2]].topic = info[3];
			irc.call_hook('chan_topic', {
				chan: irc.get_name(info[2]) + '_main',
				nick: info[1],
				topic: info[3]
			});
			
			if (info[2] == irc.current_chan)
				irc.call_hook('global_chan', {
					chan: info[2],
					topic: info[3]
				});
			
			return;
		}
		      
		info = /:([0-9a-zA-Z\[\]\\`_^{|}\-]+)!~?[0-9a-zA-Z\[\]\\`_^{|}\-]+@[0-9a-zA-Z.-]+ PRIVMSG (.+) :(.*callum-test.*)/.exec(data);
		if (info)
		{
			alert('test')
			irc.call_hook('chan_msg_hl', {
				chan: irc.get_name(info[2]) + '_main',
				nick: info[1],
				msg: info[3]
			});
			return;
		}
		      
		info = /:([0-9a-zA-Z\[\]\\`_^{|}\-]+)!~?[0-9a-zA-Z\[\]\\`_^{|}\-]+@[0-9a-zA-Z.-]+ PRIVMSG (.+) :(.+)/.exec(data)
		if (info)
		{
			irc.call_hook('chan_msg', {
				chan: irc.get_name(info[2]) + '_main',
				nick: info[1],
				msg: info[3]
			});
			return;
		}
		      
		info = /::ZIRCKSELF PRIVMSG (.+) :(.+)/.exec(data)
		if (info)
		{
			irc.call_hook('chan_msg', {
				chan: irc.get_name(info[1]) + '_main',
				nick: irc.current_nick,
				msg: info[2]
			});
			return;
		}
		
		info = /:([0-9a-zA-Z\[\]\\`_^{|}\-]+)!~?[0-9a-zA-Z\[\]\\`_^{|}\-]+@[0-9a-zA-Z.-]+ NICK :(.+)/.exec(data)
		if (info)
		{
			if (irc.current_nick == info[1])
			{
				irc.current_nick = info[2];
			}
			return;
		}
		
		//note: the below regex is incorrect, I have been unable to find the correct syntax as of yet
		info = /:[0-9a-zA-Z.-]+ 353 [0-9a-zA-Z\[\]\\`_^{|}\-]+ [=|@] ([^ ]+) :([%+@~&0-9a-zA-Z\[\]\\`_^{|}\- ]+)/.exec(data)
		if (info)
		{
			if (!info[1] in irc.chans)
				return;
			
			names = info[2].split(' ');
			if (names[names.length - 1] === "")
				names = names.splice(0, names.length - 1)
			irc.chans[info[1]].names = names;
			
			irc.regen_names(info[1]);
			return;
		}
	})
	
	irc.socket.on('disconnect', function()
	{
		irc.call_hook('global_error', 'Disconnected, please reconnect.');
	})
	
	irc.send_msg = function(form)
	{
		irc.socket.send({msg:form.msg.value, chan:irc.current_chan});
		form.msg.value = '';
		return false;
	}
	
	irc.join_chan = function(chan)
	{
		irc.socket.send({msg:'/join ' + chan, chan:irc.current_chan});
	}
	
	irc.switch_chans = function(chan)
	{
		if (!(chan in irc.chans))
		{
			irc.chans[chan] = {
				divname: irc.make_name(chan),
				names: [],
				topic: ''
			};
			irc.call_hook('chan_join', chan);
			irc.regen_chans();
		}
		irc.call_hook('chan_switch', chan);
		irc.current_chan = chan;
	}
	
	irc.regen_chans = function()
	{
		var chans = {};
		var key, a = [];
		
		for (key in irc.chans)
		  if (irc.chans.hasOwnProperty(key))
		    a.push(key);
		
		a.sort();
		
		for (key = 0; key < a.length; key++)
		  chans[a[key]] = irc.chans[a[key]];
		
		chans_ul = document.getElementById('left_chans_ul');
		chans_ul.innerHTML = '<li><a onclick="irc.switch_chans(\'console\')"><strong>Console</strong></a></li>';
		for (var chan in chans)
			if (chan !== 'console')
				chans_ul.innerHTML += '<li><a onclick="irc.switch_chans(\'' + chan + '\')"><strong>' + chan + '</strong></a></li>';
		
		return true;
	}
	
	irc.regen_names = function(chan)
	{
		if (!chan in irc.chans || chan == "console")
			return false;
	
		names = irc.chans[chan].names;
		names_div = document.getElementById(irc.get_name(chan) + '_names');
		
		names_div.innerHTML = '';
		for (var i = 0; i < names.length; i++)
			names_div.innerHTML += '<li>' + names[i] + '</li>';
		return true;
	}
	
	irc.get_name = function(chan)
	{
		if (chan === undefined)
			chan = irc.current_chan;
		return irc.chans[chan].divname;
	}
	
	irc.make_name = function(chan)
	{
		name = Math.random().toString(32);
		for (var channel in irc.chans)
		{
			if (channel.divname == name)
			{
				name = irc.make_name(chan);
				break;
			}
		}
		name = name.replace('.', ''); //jQuery hates me
		return name;
	}
}
	
irc.add_hook = function(name, callback)
{
	if (typeof callback != 'function')
		return false;
	
	if (irc.hooks[name] === undefined)
		irc.hooks[name] = [];

	irc.hooks[name].push(callback);
	return true
}

irc.call_hook = function(name, data)
{
	var hooks = irc.hooks[name];
	for (var i = 0; i < hooks.length; i++)
		hooks[i](data);
	return true;
}