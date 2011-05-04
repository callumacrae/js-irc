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
	      
	info = /:([0-9a-zA-Z\[\]\\`_^{|}]+)![0-9a-zA-Z\[\]\\`_^{|}]+@[0-9a-zA-Z.-]+ PRIVMSG (.+) :(.+)/.exec(data)
	if (info)
	{
		document.getElementById(get_name(info[2]) + '_main').innerHTML += '<li><strong>' + info[1] + '</strong>: ' + info[3] + '</li>';
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
	document.getElementById(irc.get_name() + '_main').innerHTML += '<li><strong>Error</strong>: Disconnected, please reconnect.</li>'
})

irc.send_msg = function(form)
{
	irc.socket.send({msg:form.msg.value, chan:irc.current_chan})
	//document.getElementById(irc.get_name() + '_main').innerHTML += '<li><strong>' + irc.current_nick + '</strong>: ' + form.msg.value + '</li>'
	form.msg.value = ''
	return false
}

irc.switch_chans = function(chan)
{
	if (!chan in irc.chans)
	{
		irc.socket.send({msg:'/join ' + chan, chan:irc.current_chan})
		document.getElementById('main').innerHTML += '<ul id="' + irc.get_name(chan) + '_main"></ul>'
		document.getElementById('right_names').innerHTML += '<ul id="' + irc.get_name(chan) + '_names"></ul>'
		document.getElementById('left_chans_ul').innerHTML += '<li><a onclick="irc.switch_chans(\'' + irc.get_name(chan) + '\')"><strong>' + chan + '</strong></a></li>'
		irc.chans[chan] = {
			divname: irc.make_name(chan),
			names: [],
			topic: ''
		}
	}
	jQuery('#' + irc.get_name() + '_main').hide()
	jQuery(irc.get_name(chan) + '_main').show()
	irc.current_chan = chan
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
	for (var channel in chans)
	{
		if (channel.divname == name)
		{
			name = irc.make_name(chan);
			break
		}
	}
	return name
}