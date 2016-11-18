/*
 todo: we are currently limited to http only connections for sockets due to the http URL. If the
 URL is changed to https connections are still broke. We need to transition to a more robust way
 to communicate between the server and client side.
 */
var socket = io.connect('http://' + document.domain + ':' + location.port);

socket.on('connect', function (data) {
    socket.emit("get_all_friends")
});

// Handle search for new friends
var inputBox = document.getElementById('sfriends');

socket.on('names', function (data) {
    Object.keys(data).forEach(function (key) {
        var users = document.getElementById('search-list');
        users.innerHTML = "";
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var val = data[key];
                var entry = document.createElement('li');
                var button = document.createElement('button');
                button.id = "myButton" + key;
                button.className = "btn btn-primary pull-right";
                button.autocomplete = "off";
                button.setAttribute('onclick', "socket.emit('add', {add: " + key + "})");
                button.innerHTML = '<i class="fa fa-user-plus" aria-hidden="true"></i>';
                entry.className = "list-group-item";
                entry.id = key;
                entry.appendChild(document.createTextNode(val));
                entry.appendChild(button)
                users.appendChild(entry);

            }
        }
    });
});

if(inputBox){
    inputBox.onkeyup = function () {
        socket.emit('search', {search: inputBox.value});
    }
};
// Handle display current friends
var friend_list_box = document.getElementById('current_friends');

socket.on('my_friends', function (data) {
    Object.keys(data).forEach(function (key) {
        var users = document.getElementById('friends-list');
        users.innerHTML = "";
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var val = data[key];
                var entry = document.createElement('li');
                entry.className = "list-group-item";
                entry.id = key;
                entry.appendChild(document.createTextNode(val));
                users.appendChild(entry);

            }
        }
    });
});

if(friend_list_box)
{
   friend_list_box.onkeyup = function () {
    socket.send('get_friend');
    }
}
