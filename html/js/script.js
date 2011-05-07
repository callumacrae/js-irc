var irc = {}
irc.chans = {
	console: {
		divname: 'console',
		names: [],
		topic: 'Welcome to Node.IRC!'
	}
}
irc.current_chan = 'console'

irc.socket = new io.Socket('127.0.0.1', {port:1337});
irc.socket.connect();
irc.socket.on('message', function(data)
{
	document.getElementById('console_main').innerHTML += '<li>' + data + '</li>';
	
	info = /:([0-9a-zA-Z\[\]\\`_^{|}]+)![0-9a-zA-Z\[\]\\`_^{|}]+@[0-9a-zA-Z.-]+ JOIN :(.+)/.exec(data)
	if (info)
	{
		irc.switch_chans(info[2])
		return;
	}
	
	info = /:([0-9a-zA-Z\[\]\\`_^{|}]+)![0-9a-zA-Z\[\]\\`_^{|}]+@[0-9a-zA-Z.-]+ PART (.+)/.exec(data)
	if (info)
	{
		irc.part_chan(info[2])
		return;
	}
	      
	info = /:([0-9a-zA-Z\[\]\\`_^{|}]+)![0-9a-zA-Z\[\]\\`_^{|}]+@[0-9a-zA-Z.-]+ PRIVMSG (.+) :(.+)/.exec(data)
	if (info)
	{
		document.getElementById(irc.get_name(info[2]) + '_main').innerHTML += '<li><strong>' + info[1] + '</strong>: ' + info[3] + '</li>';
		window.scrollBy(0, 15);
		return;
	}
	
	info = /:([0-9a-zA-Z\[\]\\`_^{|}]+)![0-9a-zA-Z\[\]\\`_^{|}]+@[0-9a-zA-Z.-]+ NICK :(.+)/.exec(data)
	if (info)
	{
		irc.current_nick = info[1]
		return;
	}
})

irc.socket.on('disconnect', function()
{
	irc.msg_to_all('Error', 'Disconnected, please reconnect.')
})

irc.send_msg = function(form)
{
	irc.socket.send({msg:form.msg.value, chan:irc.current_chan})
	form.msg.value = ''
	return false
}

irc.msg_to_all = function(nick, msg)
{
	for (var chan in irc.chans)
		document.getElementById(irc.get_name(chan) + '_main').innerHTML += '<li><strong>' + nick + '</strong>: ' + msg + '</li>'
}

irc.switch_chans = function(chan)
{
	if (!(chan in irc.chans))
	{
		irc.socket.send({msg:'/join ' + chan, chan:irc.current_chan})
		irc.chans[chan] = {
			divname: irc.make_name(chan),
			names: [],
			topic: ''
		}
		document.getElementById('main').innerHTML += '<ul id="' + irc.get_name(chan) + '_main"></ul>'
		document.getElementById('right_names').innerHTML += '<ul id="' + irc.get_name(chan) + '_names"></ul>'
		irc.regen_chans()
	}
	jQuery('#' + irc.get_name() + '_main').hide()
	jQuery('#' + irc.get_name(chan) + '_main').show()
	irc.current_chan = chan
}

irc.part_chan = function(chan)
{
	if (!(chan in irc.chans))
		return false
	
	jQuery('#' + irc.get_name(chan) + '_main').remove()
	jQuery('#' + irc.get_name(chan) + '_names').remove()
	delete irc.chans[chan]
	irc.regen_chans()
	return true
}

irc.regen_chans = function()
{
	var chans = {}
	var key, a = []
	
	for (key in irc.chans)
	  if (irc.chans.hasOwnProperty(key))
	    a.push(key);
	
	a.sort();
	
	for (key = 0; key < a.length; key++)
	  chans[a[key]] = irc.chans[a[key]];
	
	document.getElementById('left_chans_ul').innerHTML = '<li><a onclick="irc.switch_chans(\'console\')"><strong>Console</strong></a></li>'
	for (var chan in chans)
		if (chan !== 'console')
			document.getElementById('left_chans_ul').innerHTML += '<li><a onclick="irc.switch_chans(\'' + chan + '\')"><strong>' + chan + '</strong></a></li>'
	
	return true
}

irc.get_name = function(chan)
{
	if (chan === undefined)
		chan = irc.current_chan
	return irc.chans[chan].divname
}

irc.make_name = function(chan)
{
	name = Math.random().toString(32)
	for (var channel in irc.chans)
	{
		if (channel.divname == name)
		{
			name = irc.make_name(chan);
			break
		}
	}
	name = name.replace('.', '') //jQuery hates me
	return name
}