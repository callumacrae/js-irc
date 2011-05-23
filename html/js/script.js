var irc = {};
irc.chans = {
	console: {
		divname: 'console',
		names: [],
		topic: 'Welcome to Node.IRC!'
	}
};
irc.msgs = {};
irc.connected = false;
irc.current_chan = 'console';
irc.current_type = 'chan';
irc.hooks = {};
irc.prev_msgs = {
	msgs: [],
	current: 0
};
irc.runs = 0;

function html_clean(string)
{
	string = string.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
	
	var regex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	string = string.replace(regex, '<a href="$1" target="_blank">$1</a>');
	
	regex = /(^|[^\/])(www\.[\S]+(\b|$))/ig;
	string = string.replace(regex, '$1<a href="http://$2" target="_blank">$2</a>');
	
	regex = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/ig;
	string = string.replace(regex, '<a href="mailto:$1">$1</a>');
	
	regex = /((?:^|\s+))(#[^# ]+)/ig;
	string = string.replace(regex, '$1<a href="javascript:irc.switch_chans(\'$2\')">$2</a>');
	
	return string;
}

irc.connect = function(form)
{
	irc.socket = new io.Socket(config.ip, {port:config.port});
	irc.socket.connect();
	irc.socket.send({server:form.server.value, nick:form.nick.value});
	irc.current_nick = form.nick.value;
	jQuery('#connect').remove();
	irc.connected = true;
	irc.socket.on('message', function(data)
	{
		document.getElementById('console_main').innerHTML += '<li>' + data + '</li>';
		
		info = /^:([0-9a-zA-Z\[\]\\`_\^{|}\-]+)!~?[0-9a-zA-Z\[\]\\`_\^{|}\-]+@[0-9a-zA-Z.\-\/]+ JOIN :(.+)$/.exec(data);
		if (info)
		{
			if (info[1] === irc.current_nick)
			{
				irc.switch_chans(info[2]);
			}
			else
			{
				irc.call_hook('chan_usr_join', {
					chan: irc.get_name(info[2]),
					nick: info[1]
				});
				
				irc.chans[info[2]].names.push(info[1]);
				irc.regen_names(info[2]);
			}
			return;
		}
		
		info = /^:([0-9a-zA-Z\[\]\\`_\^{|}]+)!~?[0-9a-zA-Z\[\]\\`_\^{|}\-]+@[0-9a-zA-Z.\-\/]+ PART ([^:]+) :(.+)$/.exec(data);
		if (info)
		{
			if (info[1] === irc.current_nick)
			{
				if (irc.chans[chan] !== undefined)
				{
					irc.call_hook('chan_part', chan);
					delete irc.chans[chan];
					irc.regen_chans();
				}
			}
			else
			{
				irc.call_hook('chan_usr_part', {
					chan: irc.get_name(info[2]),
					nick: info[1],
					msg: info[3]
				});
				
				var names = irc.chans[info[2]].names,
					index = false,
					i;
				for (i = 0; i < names.length; i++)
				{
					if (new RegExp('[~&@%+]?' + info[1]).test(names[i]))
					{
						index = i;
						break;
					}
				}
					
				if (index !== false)
				{
					names.splice(index, 1);
					irc.regen_names(info[2]);
				}
			}
			return;
		}
		
		info = /^:[0-9a-zA-Z.\-]+ 332 [0-9a-zA-Z\[\]\\`_\^{|}\-]+ [= |@ ]?([^ ]+) :(.+)$/.exec(data);
		if (info)
		{
			irc.chans[info[1]].topic = info[2];
			if (info[1] === irc.current_chan)
			{
				irc.call_hook('global_topic', {
					chan: info[1],
					topic: info[2]
				});
			}
			return;
		}
		
		info = /^:([0-9a-zA-Z\[\]\\`_\^{|}\-]+)!~?[0-9a-zA-Z\[\]\\`_\^{|}]+@[0-9a-zA-Z.\-\/]+ TOPIC ([^:]+) :(.+)$/.exec(data);
		if (info)
		{
			irc.chans[info[2]].topic = info[3];
			irc.call_hook('chan_topic', {
				chan: irc.get_name(info[2]),
				nick: info[1],
				topic: info[3]
			});
			
			if (info[2] === irc.current_chan)
			{
				irc.call_hook('global_topic', {
					chan: info[2],
					topic: info[3]
				});
			}
			
			return;
		}
		      
		info = /^:([0-9a-zA-Z\[\]\\`_\^{|}\-]+)!~?[0-9a-zA-Z\[\]\\`_\^{|}\-]+@[0-9a-zA-Z.\-\/]+ (PRIVMSG|NOTICE) ([^:]+) :(.+)$/.exec(data);
		if (info)
		{
			var action = /^\x01ACTION (.+)\x01$/.exec(info[4]);
			var highlight = info[4].search(irc.current_nick) !== -1;
			var notice = info[2] === 'NOTICE';
			if (/^#/.test(info[3]))
			{
				var type = (notice) ? 'chan_notice' :
					('chan_' + (action ? 'action' : 'msg') + (highlight ? '_hl' : ''));
				
				irc.call_hook(type, {
					chan: irc.get_name(info[3]),
					nick: info[1],
					msg: (action) ? action[1] : info[4]
				});
			}
			else
			{
				if (irc.msgs[info[1]] === undefined)
				{
					irc.switch_chans(info[1]);
				}
				var type = (notice) ? 'pm_notice' :
					('pm_msg' + (highlight ? '_hl' : ''));
				
				irc.call_hook(type, {
					chan: irc.get_name(info[1], 'pm'),
					nick: info[1],
					msg: info[4]
				});
			}
			return;
		}
		      
		info = /^::ZIRCKSELF PRIVMSG ([^:]+) :\x01ACTION (.+)\x01$/.exec(data);
		if (info)
		{
			irc.call_hook('chan_action', {
				chan: irc.get_name(info[1]),
				nick: irc.current_nick,
				msg: info[2]
			});
			return;
		}
		      
		info = /^::ZIRCKSELF PRIVMSG ([^:]+) :(.+)$/.exec(data);
		if (info)
		{
			if (/^#/.test(info[1]))
			{
				irc.call_hook('chan_msg', {
					chan: irc.get_name(info[1]),
					nick: irc.current_nick,
					msg: info[2]
				});
			}
			return;
		}
		      
		info = /^::ZIRCKSELF QUIT :(.+)$/.exec(data);
		if (info)
		{
			irc.call_hook('quit', info[1]);
			irc.connected = false;
			irc.socket.disconnect();
			return;
		}
		
		info = /^:([0-9a-zA-Z\[\]\\`_\^{|}\-]+)!~?[0-9a-zA-Z\[\]\\`_\^{|}\-]+@[0-9a-zA-Z.\-\/]+ NICK :(.+)$/.exec(data);
		if (info)
		{
			var chan, names;
			
			if (irc.current_nick === info[1])
			{
				irc.current_nick = info[2];
			}
			
			for (chan in irc.chans)
			{
				names = irc.chans[chan].names;
				if (names.indexOf(info[1]) !== -1)
				{
					irc.call_hook('chan_nick', {
						chan: irc.get_name(chan),
						old_nick: info[1],
						new_nick: info[2]
					});
					
					names.splice(names.indexOf(info[1]), 1, info[2]);
					irc.regen_names(chan);
				}
			}
			return;
		}
		
		info = /^:([0-9a-zA-Z\[\]\\`_\^{|}\-]+)!~?[0-9a-zA-Z\[\]\\`_\^{|}\-]+@[0-9a-zA-Z.\-\/]+ QUIT :(.*)$/.exec(data);
		if (info)
		{
			var chan, names;
			for (chan in irc.chans)
			{
				names = irc.chans[chan].names;
				if (names.indexOf(info[1]) !== -1)
				{
					irc.call_hook('chan_usr_quit', {
						chan: irc.get_name(chan),
						nick: info[1],
						msg: info[2]
					});
					
					names.splice(names.indexOf(info[1]), 1);
					irc.regen_names(chan);
				}
			}
			return;
		}
		
		//note: the below regex is incorrect, I have been unable to find the correct syntax as of yet
		info = /^:[0-9a-zA-Z.\-]+ 353 [0-9a-zA-Z\[\]\\`_\^{|}\-]+ [=|@] ([^ ]+) :([%+@~&0-9a-zA-Z\[\]\\`_\^{|}\- ]+)$/.exec(data);
		if (info)
		{
			if (irc.chans[info[1]] === undefined)
			{
				return;
			}
			
			var names_p = info[2].split(' ');
			if (names_p[names_p.length - 1] === '')
			{
				names_p = names_p.splice(0, names_p.length - 1);
			}
			irc.chans[info[1]].names = irc.chans[info[1]].names.concat(names_p);
			return;
		}
		
		info = /^:[0-9a-zA-Z.\-]+ 366 [0-9a-zA-Z\[\]\\`_\^{|}\-]+ ([^ ]+) :.+$/.exec(data);
		if (info)
		{
			irc.regen_names(info[1]);
			return;
		}
	});
	
	irc.socket.on('disconnect', function()
	{
		if (irc.connected)
		{
			irc.call_hook('global_error', 'Disconnected, please reconnect.');
		}
	});
	
	irc.send_msg = function(form)
	{
		if (form.msg.value === '')
		{
			return false;
		}
		
		irc.prev_msgs.msgs.push(form.msg.value);
		
		var cancel_send = false;
		if (form.msg.value.slice(0, 1) === '/' && form.msg.value.slice(0, 2) !== '//')
		{
			var end = form.msg.value.indexOf(' ') === -1 ? form.msg.value.length : form.msg.value.indexOf(' ');
			var command = form.msg.value.slice(1, end);
			var rest_of = form.msg.value.slice(form.msg.value.indexOf(' ') + 1);
			switch (command)
			{
				case 'about':
					irc.call_hook('about');
					cancel_send = true;
					break;
				
				case 'part':
				case 'query':
					if (!/^#/.test(irc.current_chan))
					{
						delete irc.msgs[irc.current_chan];
						irc.call_hook('pm_close', irc.current_chan);
						irc.regen_chans();
						cancel_send = true;
					}
					break;
			}
		}
		
		if (!cancel_send)
		{
			irc.socket.send({msg:form.msg.value, chan:irc.current_chan});
		}
		form.msg.value = '';
		return false;
	}
	
	irc.join_chan = function(chan)
	{
		irc.socket.send({msg:'/join ' + chan, chan:irc.current_chan});
	}
	
	irc.switch_chans = function(chan)
	{
		if (/^#/.test(chan) || chan === 'console')
		{
			if (irc.chans[chan] === undefined)
			{
				irc.join_chan(chan);
				irc.chans[chan] = {
					divname: irc.make_name(chan),
					names: [],
					topic: ''
				};
				irc.call_hook('chan_join', chan);
				irc.regen_chans();
			}
			irc.call_hook(irc.current_type + '_hide', irc.current_chan);
			irc.call_hook('chan_show', chan);
			irc.current_type = 'chan';
		}
		else
		{
			if (irc.msgs[chan] === undefined)
			{
				irc.msgs[chan] = {
					divname: chan
				};
				irc.call_hook('pm_open', chan);
				irc.regen_chans();
			}
			irc.call_hook(irc.current_type + '_hide', irc.current_chan);
			irc.call_hook('pm_show', chan);
			irc.current_type = 'pm';
		}
		irc.current_chan = chan;
	}
	
	irc.regen_chans = function()
	{
		var chans = {},
			key,
			a = [],
			chan;
		
		for (key in irc.chans)
		{
			if (irc.chans.hasOwnProperty(key))
			{
				a.push(key);
			}
		}
		
		a.sort();
		
		for (key = 0; key < a.length; key++)
		{
			chans[a[key]] = irc.chans[a[key]];
		}
		
		chans_ul = document.getElementById('left_chans_ul');
		chans_ul.innerHTML = '<li><a onclick="irc.switch_chans(\'console\')"><strong>Console</strong></a></li>';
		for (chan in chans)
		{
			if (chan !== 'console')
			{
				chans_ul.innerHTML += '<li><a onclick="irc.switch_chans(\'' + chan + '\')"><strong>' + chan + '</strong></a></li>';
			}
		}
		
		a = []; chans = {};
		
		for (key in irc.msgs)
		{
			if (irc.msgs.hasOwnProperty(key))
			{
				a.push(key);
			}
		}
		
		a.sort();
		
		for (key = 0; key < a.length; key++)
		{
			chans[a[key]] = irc.chans[a[key]];
		}
		
		chans_ul = document.getElementById('left_msgs_ul');
		chans_ul.innerHTML = '';
		for (chan in chans)
		{
			chans_ul.innerHTML += '<li><a onclick="irc.switch_chans(\'' + chan + '\')"><strong>' + chan + '</strong></a></li>';
		}
		
		return true;
	}
	
	irc.regen_names = function(chan)
	{
		if (irc.chans[chan] === undefined || chan === 'console')
		{
			return false;
		}

		var i,
			names = irc.chans[chan].names,
			names_div = document.getElementById(irc.get_name(chan, 'names'));
		
		names_div.innerHTML = '';
		
		function get_num(c)
		{
			switch (c)
			{
				case '~':
					return 5;
				    
				case '&':
					return 4;
				    
				case '@':
					return 3;
				    
				case '%':
					return 2;
				    
				case '+':
					return 1;
				    
				default:
					return 0;
			}
		}
		
		names = names.sort(function(a, b)
		{
			irc.runs++;
			var a_num = get_num(a.slice(0, 1));
			var b_num = get_num(b.slice(0, 1));
			if (a_num !== b_num)
			{
				return b_num - a_num;
			}
			
			if (a_num !== 0)
			{
				a = a.slice(1);
			}
			if (b_num !== 0)
			{
				b = b.slice(1);
			}
			
			return (a.toLowerCase() < b.toLowerCase()) ? -1 : 1;
		});
		
		for (i = 0; i < names.length; i++)
		{
			names_div.innerHTML += '<li>' + names[i] + '</li>';
		}
		return true;
	}
	
	irc.get_name = function(chan, state)
	{
		if (chan === undefined)
		{
			chan = irc.current_chan;
		}
		if (state === undefined)
		{
			state = 'main';
		}
		
		if (/^#/.test(chan))
		{
			chan = irc.chans[chan].divname;
		}
		else
		{
			chan = chan.replace(/([^a-zA-Z0-9])/, '\\$1');
		}
		return chan + '_' + state;
	}
	
	irc.make_name = function(chan)
	{
		var channel,
			name = Math.random().toString(32);
		for (channel in irc.chans)
		{
			if (channel.divname === name)
			{
				name = irc.make_name(chan);
				break;
			}
		}
		name = name.replace('.', ''); //jQuery hates me
		return name;
	}
	
	$(document).keydown(function(event)
	{
		var kill = true;
		switch(event.keyCode)
		{
			case 9: //tab
				
				var ctrl = document.getElementById('msginput'),
					position = 0;
				if (document.selection)
				{
					ctrl.focus();
					var selection = document.selection.createRange();
					selection.moveStart('character', -ctrl.value.length);
					position = selection.text.length;
				}
				else if (ctrl.selectionStart || ctrl.selectionStart === '0')
				{
					position = ctrl.selectionStart;
				}
				
				var start_pos = ctrl.value.lastIndexOf(' ', position) + 1,
					text = ctrl.value.slice(start_pos, position),
					text_final,
					text_once;
					
				if (!text)
				{
					break;
				}
				
				if (text.slice(0, 1) === '#')
				{
					for (text_once in irc.chans)
					{
						if (text.toLowerCase() === text_once.slice(0, text.length).toLowerCase())
						{
							text_final = text_once;
						}
					}
				}
				else
				{
					var names = irc.chans[irc.current_chan].names,
						spec, i;
					for (i = 0; i < names.length; i++)
					{
						spec = /^[~&@%+]/.test(names[i]);
						if (text.toLowerCase() === names[i].slice(spec ? 1 : 0, text.length + (spec ? 1 : 0)).toLowerCase())
						{
							text_final = spec ? names[i].slice(1) : names[i];
						}
					}
				}
				
				if (!text_final)
				{
					break;
				}
				
				if (start_pos)
				{
					ctrl.value = ctrl.value.slice(0, start_pos) + text_final + ' ' + ctrl.value.slice(position);
				}
				else if (text.slice(0, 1) !== '#')
				{
					ctrl.value = text_final + ': ' + ctrl.value.slice(position);
				}
				else
				{
					ctrl.value = text_final + ' ' + ctrl.value.slice(position);
				}
				
				break;
			
			case 191: //forward stroke ("/")
				var jinput = $('#msginput'),
					input = document.getElementById('msginput');
				if (!jinput.is(':focus'))
				{
					jinput.focus();
					if (input.value === '')
					{
						input.value = '/';
					}
				}
				else
				{
					kill = false;
				}
				break;
			
			case 38: //up key
				if (!$('#msginput').is(':focus'))
				{
					kill = false;
					break;
				}
				
				var input = document.getElementById('msginput'),
					msgs = irc.prev_msgs.msgs,
					new_msg = msgs[msgs.length - irc.prev_msgs.current - 1];
				
				if (new_msg !== undefined)
				{
					input.value = new_msg;
					irc.prev_msgs.current++;
				}
				
				break;
			
			case 40: //down key
				if (!$('#msginput').is(':focus'))
				{
					kill = false;
					break;
				}
				
				var input = document.getElementById('msginput'),
					msgs = irc.prev_msgs.msgs,
					new_msg = msgs[msgs.length - irc.prev_msgs.current + 1];
				
				if (new_msg !== undefined)
				{
					input.value = new_msg;
					irc.prev_msgs.current--;
				}
				else
				{
					input.value = '';
					irc.prev_msgs.current = 0;
				}
				
				break;
				
				
			default:
				if ($('#msginput').is(':focus') && irc.prev_msgs.current !== 0)
				{
					irc.prev_msgs.current = 0;
				}
				kill = false;
		}
		
		if (kill)
		{
			event.preventDefault();
		}
	});
}
	
irc.add_hook = function(name, callback)
{
	if (typeof callback !== 'function')
	{
		return false;
	}
	
	if (irc.hooks[name] === undefined)
	{
		irc.hooks[name] = [];
	}

	irc.hooks[name].push(callback);
	return true;
}

irc.call_hook = function(name, data)
{
	var hooks = irc.hooks[name],
		i;
	if (hooks === undefined)
	{
		return false;
	}
	for (i = 0; i < hooks.length; i++)
	{
		hooks[i](data);
	}
	return true;
}