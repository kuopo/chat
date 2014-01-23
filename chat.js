var MSGHUB_PUBSUB_URL = 'https://pubsub.msghub.io';

var myname = prompt("Please enter your name");

$(document).ready( function() {
    $("#pub_msg").focus();

    (function show_prompt() {
        var prompt_msg = htmlspecialchars("[" + (new Date()).toUTCString() + "] " + myname + "> ");
        $("#prompt").html(prompt_msg);
        setTimeout(show_prompt, 1000);
    })();
});

function htmlspecialchars(str) {
    return ("" + str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/ /g, '&nbsp;');
}

function addmsg(channel, data, append) {
    var nickname = data.nickname;
    var message = data.message;
    var timestamp = data.timestamp;
    var output = htmlspecialchars("[" + timestamp + "]" + " " + nickname + "> " + message);
	  
    /* Simple helper to add a div.
    type is the name of a CSS class (old/new/error).
    msg is the contents of the div */
    if (append && append == true) {
        $("#messages").append(
            "<div class='msg white'>"+ output +"</div>"
        );
    } else {
        $("#messages").prepend(
            "<div class='msg white'>"+ output +"</div>"
        );
    }
}

function send_chat() {
//    var name = document.getElementById('nickname').value;
    var name = myname;
    var msg = document.getElementById('pub_msg').value;
    var timestamp = (new Date()).toUTCString();

    msghub.publish('chat', {'nickname': name, 'message': msg, 'timestamp': timestamp}, false);
    msghub.save('chat', {'nickname': name, 'message': msg, 'timestamp': timestamp});
}

function add_log(channel, data) {
    if (typeof console != "undefined") {
        console.log(channel, data);
    }
}

function ping_delay(channel, data) {
    if (typeof console != "undefined") {
        console.log( (new Date()).getTime() - data );
    }
}

function ping() {
    var pingChnl = "ping_" + msghub.socket.socket.sessionid;

    if (!(pingChnl in msghub.callbacks)) msghub.subscribe(pingChnl, ping_delay);

    msghub.publish(pingChnl, (new Date()).getTime(), false);
}

function add_func(channel, data) {
    eval.call(window, data);
}


var account = "test";
var password = "123";

var msghub = new MsgHub(MSGHUB_PUBSUB_URL);

var current = (new Date()).getTime();
var timezone_offset = (new Date()).getTimezoneOffset() * 60000;
var one_week = 7 * 24 * 60 * 60 * 1000;

msghub.erase('chat', {"timeframe": {"max": current - timezone_offset - one_week}}, function(e, d) {
    msghub.load('chat', {limit: 10, order: 'desc'}, function(err, data) {
        for (i = 0; i < data.data.length; i++) {
            var msg = JSON.parse(data.data[i].message);
            addmsg('chat', msg, true);
        }

        if (data.next) {
            $("next").html('<button id="more" style="width: 100%;">More</button>');

            var cb = arguments.callee;

            $("#more").click( function() {
                $("#more").off('click');
                msghub.load('chat', data.next, cb);
            });
        } else {
            $("next").empty();
        }
    });
});

msghub.subscribe('chat', addmsg);
msghub.subscribe('log', add_log);
msghub.subscribe('func', add_func);

$("ACCOUNT").text(account);
