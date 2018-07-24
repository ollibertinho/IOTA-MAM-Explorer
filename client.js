toastr.options = {
	  "closeButton": true,
	  "debug": false,
	  "newestOnTop": true,
	  "progressBar": false,
	  "positionClass": "toast-bottom-right",
	  "preventDuplicates": false,
	  "onclick": null,
	  "showDuration": "300",
	  "hideDuration": "1000",
	  "timeOut": "5000",
	  "extendedTimeOut": "1000",
	  "showEasing": "swing",
	  "hideEasing": "linear",
	  "showMethod": "fadeIn",
	  "hideMethod": "fadeOut"
}

var port = location.protocol === 'https:' ? 8443 : 8081;
//var connString = location.protocol+"//mam.tangle.army";
var connString = "http://localhost:8081";

var iota = new IOTA({ provider: 'http://localhost:14265' })	
var simpleOut = true;
var data = [];
var autoScroll = true;
var prettyPrint = true;
var syntaxHighlight = true;
var active = false;
var isRestricted = false;

$(document).ready(function() {	
	
	console.log("trying to connect to "+connString);
	var socket = io.connect(connString);		
	$('#loader').hide();			
	
	socket.on('connect', function() { 
		console.log('connected');
		getCurrentlyConnected();
		showHint("success", "INFO", "Successfully connected...");
		var addr = getUrlParameter('address');
		var sidekey = getUrlParameter('key');
		if(addr != null) {
			doFetch(addr, sidekey);
		}
	});
	
	socket.on('error', function(exception){
		showHint("error", "ERROR", 'Exception:' + exception);
		console.log('exception: ' + exception);
		stopFetching();
	});

	socket.on('disconnect', function(){
		console.log('disconnected');
		showHint("info", "INFO", "Disconnected...");
	});	
	
	socket.on('fetch', function(msg)
	{
    	console.log(fetch, msg);
	    try 
        {
			$('#loader').hide();
			pageScroll();
			data.push(msg);
			var toAppend;
								
			if(msg.type=="json") {
			
				if($('#prettyPrint')[0].checked) {
					toAppend = JSON.stringify(msg.data,null,'\t');
				}
				else {
					toAppend = JSON.stringify(msg.data);
				}
				
				if($('#syntaxHighlight')[0].checked) {
					toAppend = $('<pre></pre>').html(doSyntaxHighlight(toAppend));
				}
				else {
					toAppend = $('<pre></pre>').html(toAppend);
				}
			} else {
				toAppend = $('<pre></pre>').html(msg.data);
			}
			
			$('#messages').append(toAppend);		
        } catch(e) {
			console.log(e);
            showHint('error', "ERROR", e.message);
			stopFetching();
        }
	});
	
	socket.on('getCurrentlyConnected', function(cnt) {
	    var curConnClients = 'currently connected clients: '+cnt;
	    console.log(curConnClients);
	    $('#clientsConnected').html(curConnClients);
	});
	
	function getCurrentlyConnected() {
	    socket.emit('getCurrentlyConnected', null);
	}
	
	setInterval(getCurrentlyConnected, 5000);
    
	function getUrlParameter(sParam) {
		var sPageURL = decodeURIComponent(window.location.search.substring(1)),
			sURLVariables = sPageURL.split('&'),
			sParameterName,
			i;

		for (i = 0; i < sURLVariables.length; i++) {
			sParameterName = sURLVariables[i].split('=');

			if (sParameterName[0] === sParam) {
				return sParameterName[1] === undefined ? true : sParameterName[1];
			}
		}
	};

    $("#sidekey").hide();

	$("#setrestricted").click(function() {
		isRestricted=true;
		$("#sidekey").show();
		$("#restrictionType").html('Restricted');	
	});
	
	$("#setpublic").click(function() {
		isRestricted=false;
		$("#sidekey").hide();
		$("#restrictionType").html('Public');				
	});
	
	//sticky icky icky
    var footerHeight = $(".footer").height();
    $("body").css("margin-bottom", footerHeight);
    $(".footer").css("margin-top", -footerHeight);

	$('[data-toggle="tt_fetch"]').tooltip();
	$('[data-toggle="tt_cancel"]').tooltip();
	 		
	$('#btnStopFetching').prop('disabled', true);
	$('#donationAddress').css('cursor','hand');
	
 	function pageScroll() 
	{
		if(autoScroll==true) 
		{
			var elem = document.getElementById('messages');
			elem.scrollTop = elem.scrollHeight;
			scrolldelay = setTimeout(pageScroll,10);
		}
	}

	function doFetch(root, key) {
		if(root=='') 
		{			
			showHint('error', "ERROR", "You have to specify a root address!");
			return;
		}
		if(iota.valid.isAddress(root)==false)
		{
			showHint('error', "ERROR", "Invalid root address! Check your input.");
			return;
		}
		if(isRestricted && key=='') 
		{			
			showHint('error', "ERROR", "You have to specify a side-key if you choose a restricted MAM-Channel.");
			return;
		}
		$('#loader').show();
		$('#messages').html("");
		showHint("info", "INFO", "Start fetching data from "+root);
	
		$('[data-toggle="tt_cancel"]').tooltip('dispose');
		$('[data-toggle="tt_fetch"]').tooltip('dispose');

		$('#btnStopFetching').prop('disabled', false);
		$('#prettyPrint').prop('disabled', true);
		$('#syntaxHighlight').prop('disabled', true);
		$('#restrictionType').prop('disabled', true);
		$('#btnFetch').prop('disabled', true);
				
		socket.emit('fetch', { "root":root, "sidekey":key });
	}

	$('#btnFetch').click(function()
	{
	    try 
	    {
	        var root = $('#m').val();
	        var key = $('#sidekey').val();
			doFetch(root, key);
			$('#m').val('');
	    }
	    catch(e) {
	        showHint('error', "ERROR", e.message);
			stopFetching();
			return;
	    }
		return false;
	});
	
	$('#autoscroll').click(function()
	{
		autoScroll=$('#autoscroll')[0].checked;
	});
	
	$('#btnStopFetching').click(stopFetching);
	
	function stopFetching()
	{
	    $('[data-toggle="tt_cancel"]').tooltip();
		$('[data-toggle="tt_fetch"]').tooltip();
		$("#prettyPrint").prop('disabled', false);
		$('#syntaxHighlight').prop('disabled', false);
		$('#restrictionType').prop('disabled', false);
		$('#btnFetch').prop('disabled', false);
		$('#loader').hide();
		socket.emit('stopFetching', null);
		data = [];
		$('#btnStopFetching').prop('disabled', true);
		return false;
	}
	
	$('#donationAddress').click(function()
	{
	   copyToClipboard($('#donationAddress'));
	   showHint("success", "Address copied to clipboard", $('#donationAddress').html());
	});
	
	function showHint(type, title, text) 
	{
		console.log(text);
		toastr[type](text, title);
	}
	
	function doSyntaxHighlight(json) {
		json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) 
		{
			var cls = 'number';
			if (/^"/.test(match)) {
				if (/:$/.test(match)) {
					cls = 'key';
				} else {
					cls = 'string';
				}
			} else if (/true|false/.test(match)) {
				cls = 'boolean';
			} else if (/null/.test(match)) {
				cls = 'null';
			}
			return '<span class="' + cls + '">' + match + '</span>';
		});
	}
	
	function copyToClipboard(element) {
      var $temp = $("<input>");
      $("body").append($temp);
      $temp.val($(element).text()).select();
      document.execCommand("copy");
      $temp.remove();
    }
});