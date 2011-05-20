irc.add_hook('chan_msg', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li><strong>' + data.nick + '</strong>: ' + html_clean(data.msg) + '</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_msg_hl', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li class="highlight"><strong>' + data.nick + '</strong>: ' + html_clean(data.msg) + '</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_action', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li class="action"><strong>' + data.nick + ' ' + html_clean(data.msg) + '</strong></li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_action_hl', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li class="action highlight"><strong>' + data.nick + ' ' + html_clean(data.msg) + '</strong></li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_notice', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li class="notice"><strong>-' + data.nick + '-</strong> ' + html_clean(data.msg) + '</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_usr_part', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li>' + data.nick + ' has left the channel. (' + html_clean(data.msg) + ')</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_usr_join', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li>' + data.nick + ' has entered the channel.</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_usr_quit', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li>' + data.nick + ' has quit. (' + html_clean(data.msg) + ')</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_topic', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li>' + data.nick + ' changed the topic to ' + html_clean(data.topic) + '</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('chan_nick', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li>' + data.old_nick + ' is now known as ' + data.new_nick + '</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('global_topic', function(data)
{
	document.getElementsByTagName('header')[0].innerHTML = '<strong>' + html_clean(data.chan) + ':</strong> ' + html_clean(data.topic);
});

irc.add_hook('chan_part', function(chan)
{
	jQuery('#' + irc.get_name(chan)).remove();
	jQuery('#' + irc.get_name(chan, 'names')).remove();
});

irc.add_hook('chan_join', function(chan)
{
	document.getElementById('main').innerHTML += '<ul id="' + irc.get_name(chan) + '"></ul>';
	document.getElementById('right_names').innerHTML += '<ul id="' + irc.get_name(chan, 'names') + '"></ul>';
});

irc.add_hook('chan_switch', function(chan)
{
	document.getElementsByTagName('header')[0].innerHTML = '<strong>' + html_clean(chan) + ':</strong> ' + html_clean(irc.chans[chan].topic);
	jQuery('#' + irc.get_name()).hide();
	jQuery('#' + irc.get_name(chan)).show();
	jQuery('#' + irc.get_name(undefined, 'names')).hide();
	jQuery('#' + irc.get_name(chan, 'names')).show();
});

irc.add_hook('chan_hide', function(chan)
{
	jQuery('#' + irc.get_name(chan)).hide();
	jQuery('#' + irc.get_name(chan, 'names')).hide();
});

irc.add_hook('chan_show', function(chan)
{
	document.getElementsByTagName('header')[0].innerHTML = '<strong>' + html_clean(chan) + ':</strong> ' + html_clean(irc.chans[chan].topic);
	jQuery('#' + irc.get_name(chan)).show();
	jQuery('#' + irc.get_name(chan, 'names')).show();
});

irc.add_hook('pm_hide', function(chan)
{
	jQuery('#' + irc.get_name(chan, 'pm')).hide();
});

irc.add_hook('pm_show', function(chan)
{
	document.getElementsByTagName('header')[0].innerHTML = '<strong>' + html_clean(chan) + '</strong>';
	jQuery('#' + irc.get_name(chan, 'pm')).show();
});

irc.add_hook('global_notice', function(msg)
{
	for (var chan in irc.chans)
		document.getElementById(irc.get_name(chan)).innerHTML += '<li><strong>Notice:</strong> ' + html_clean(msg) + '</li>';
});

irc.add_hook('global_error', function(msg)
{
	for (var chan in irc.chans)
		document.getElementById(irc.get_name(chan)).innerHTML += '<li><strong>Error:</strong> ' + html_clean(msg) + '</li>';
});

irc.add_hook('quit', function(msg)
{
	for (var chan in irc.chans)
		document.getElementById(irc.get_name(chan)).innerHTML += '<li><strong>You have quit</strong> (' + html_clean(msg) + ')</li>';
});

irc.add_hook('about', function()
{
	alert('This IRC client was built by Callum Macrae.')
});

irc.add_hook('pm_open', function(nick)
{
	document.getElementById('main').innerHTML += '<ul id="' + nick + '_pm"></ul>';
});

irc.add_hook('pm_msg', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li><strong>' + data.nick + '</strong>: ' + html_clean(data.msg) + '</li>';
	window.scrollBy(0, 15);
});

irc.add_hook('pm_msg_hl', function(data)
{
	document.getElementById(data.chan).innerHTML += '<li class="highlight"><strong>' + data.nick + '</strong>: ' + html_clean(data.msg) + '</li>';
	window.scrollBy(0, 15);
});

/*
 chan_msg
 chan_msg_hl
 chan_notice
 chan_action
 chan_action_hl
 chan_nick
 chan_topic
 chan_usr_join
 chan_usr_part
 chan_usr_quit
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