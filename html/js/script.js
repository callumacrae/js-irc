var socket = new io.Socket('127.0.0.1', {port:1337}); 
socket.connect();
socket.on('message', function(data)
{
	info = /:([0-9a-zA-Z\[\]\\`_^{|}]+)![0-9a-zA-Z\[\]\\`_^{|}]+@[0-9a-zA-Z.-]+ JOIN :(.+)/.exec(data)
	if (info)
	{
		alert('You have joined ' + info[2])
		return;
	}
	      
	info = /:([0-9a-zA-Z\[\]\\`_^{|}]+)![0-9a-zA-Z\[\]\\`_^{|}]+@[0-9a-zA-Z.-]+ PRIVMSG (.+) :(.+)/.exec(data)
	if (info)
	{
		document.getElementById(info[2]).innerHTML += '<li><strong>' + info[1] + '</strong>: ' + info[3] + '</li>';
		window.scrollBy(0, 15);
		return;
	}
})

socket.on('disconnect', function()
{
	document.getElementById('lynxphp').innerHTML += '<li><strong>Error</strong>: Disconnected, please reconnect.</li>';
})

function send_msg(form)
{
	socket.send({msg:form.msg.value, chan:form.chan.value})
	form.msg.value = ''
	return false
}