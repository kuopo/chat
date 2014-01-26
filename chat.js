GHUB_PUBSUB_URL = 'https://pubsub.msghub.io';
var myname = "";

$(document).ready( function() {
    init_name_prompt();    
});

function htmlspecialchars(str) {
    return ("" + str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/ /g, '&nbsp;');
}

function init_name_prompt() {
    $("#cmd_line").html(
        "<span id='prompt' style='display:table-cell;'></span>" +
        "<span style='display:table-cell; width: 100%'><input id='user_name' type='text' style='width: 100%' onKeyDown='javascript:(function(){if (event.keyCode ==13) { get_name(); init_msg_prompt(); } })()'/></span>"
    );
    
    $("#user_name").focus();

    var prompt_msg = htmlspecialchars("Please enter your name: ");
    $("#prompt").html(prompt_msg);
}

function get_name() {
    myname = document.getElementById('user_name').value;
}

function init_msg_prompt() {
    $("#cmd_line").html(
        "<span id='prompt' style='display:table-cell;'></span>" +
        "<span style='display:table-cell; width: 100%'><input id='pub_msg' type='text' style='width: 100%' onKeyDown='javascript:(function(){if (event.keyCode ==13) { var msg = get_pub_msg(); send_chat(msg); } })()'/></span>"
    );
    
    var prompt_msg = htmlspecialchars("[" + (new Date()).toUTCString() + "] " + myname + "> ");
    $("#prompt").html(prompt_msg);
    $("#pub_msg").focus();
}

function get_pub_msg() {
    var msg = document.getElementById('pub_msg').value;
    $("#pub_msg").val("");
    
    return msg;
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

function send_chat(msg) {
    var name = myname;
    var timestamp = (new Date()).toUTCString();
    
    msghub.publish('chat', {'nickname': name, 'message': msg, 'timestamp': timestamp}, false);
    msghub.save('chat', {'nickname': name, 'message': msg, 'timestamp': timestamp});
}

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

