irc.add_hook('chan_msg', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li><strong>' + data.nick + '</strong>: ' + data.msg + '</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_msg_hl', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li class="highlight"><strong>' + data.nick + '</strong>: ' + data.msg + '</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_action', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li class="action"><strong>' + data.nick + ' ' + data.msg + '</strong></li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_action_hl', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li class="action highlight"><strong>' + data.nick + ' ' + data.msg + '</strong></li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_notice', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li><strong>-' + data.nick + '-</strong> ' + data.msg + '</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_usr_part', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li>' + data.nick + ' has left the channel. (' + data.msg + ')</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_usr_join', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li>' + data.nick + ' has entered the channel.</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_topic', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li>' + data.nick + ' changed the topic to ' + data.topic + '</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('global_topic', function(data)
{
	document.getElementsByTagName('header')[0].innerHTML = '<strong>' + data.chan + ':</strong> ' + data.topic;
});

irc.add_hook('chan_part', function(chan)
{
	jQuery('#' + irc.get_name(chan) + '_main').remove();
	jQuery('#' + irc.get_name(chan) + '_names').remove();
});

irc.add_hook('chan_join', function(chan)
{
	document.getElementById('main').innerHTML += '<ul id="' + irc.get_name(chan) + '_main"></ul>';
	document.getElementById('right_names').innerHTML += '<ul id="' + irc.get_name(chan) + '_names"></ul>';
});

irc.add_hook('chan_switch', function(chan)
{
	document.getElementsByTagName('header')[0].innerHTML = '<strong>' + chan + ':</strong> ' + irc.chans[chan].topic;
	jQuery('#' + irc.get_name() + '_main').hide();
	jQuery('#' + irc.get_name(chan) + '_main').show();
	jQuery('#' + irc.get_name() + '_names').hide();
	jQuery('#' + irc.get_name(chan) + '_names').show();
});

irc.add_hook('global_notice', function(msg)
{
	for (var chan in irc.chans)
		document.getElementById(irc.get_name(chan) + '_main').innerHTML += '<li><strong>Notice:</strong> ' + msg + '</li>';
});

irc.add_hook('global_error', function(msg)
{
	for (var chan in irc.chans)
		document.getElementById(irc.get_name(chan) + '_main').innerHTML += '<li><strong>Error:</strong> ' + msg + '</li>';
});

/*
 chan_msg
 chan_msg_hl
 chan_notice
 chan_action
 chan_action_hl
 *chan_nick
 chan_topic
 chan_usr_join
 chan_usr_part
 *chan_join
 chan_part
 chan_switch
 
 *pm_msg
 *pm_msg_hl
 *pm_notice
 *pm_nick
 *pm_open
 *pm_close
 *pm_start
 
 global_topic
 global_notice
 global_error
 
*/