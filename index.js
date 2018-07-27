var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');

var port = process.env.PORT || 3000;

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "toshe-api"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("MySQL connected!");
});

var getTimestamp = function() {
	return Math.floor(new Date().getTime()/1000);
}

var message = function(user, text) {
    return {"user": user, "text": text, "time": 222222};
}

// TODO: Filter msg, SQL Injection
io.on('connection', function(socket){
    
    socket.on('chat', function(msg){
        io.emit('chat', msg);

        var query = "INSERT INTO chat (user, text, time) VALUES ('" + msg["user"] + "', '" + msg["text"] + "', " + getTimestamp() + ");"

        con.query(query, function (err, result) {
            if (err) throw err;
            console.log(result);
        });
        //INSERT INTO chat (user, message, time) VALUES ('Cardinal', 'Tom', 2222);
    });

    socket.on('joined', function (user) {
        // Send joined message
        io.emit('joined', message(user, "Joined the chat", getTimestamp()));

        // Send chat history to users
        con.query("SELECT * FROM chat", function (err, result) {
            if (err) throw err;
            for(var i = 0;i < result.length;i++) {
                socket.emit('chat', result[i]);
            }
            console.log(result.length);
        });
        console.log('connect');
    });

    socket.on('disconnect', function () {
        // Send left message to others
        io.emit('left', message("SOMEONE", "Left the chat", getTimestamp()));
        console.log('disconnect');
    });
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});