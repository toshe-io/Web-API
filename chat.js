var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');

var port = process.env.PORT || 3000;
var historyCount = 100;

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
    return {"user": user, "text": text, "time": getTimestamp()};
}

// TODO: Filter msg, SQL Injection
io.on('connection', function(socket){
    
    socket.on('chat', function(msg){
        msg["time"] = getTimestamp();

        var query = con.query('INSERT INTO chat SET ?', msg, function (error, results, fields) {
            if (error) throw error;

            io.emit('chat', msg);
        });
    });

    socket.on('joined', function (user) {
        // Send joined message
        io.emit('joined', message(user, "Joined the chat"));

        // Send chat history to user
        con.query("SELECT * FROM chat ORDER BY time DESC LIMIT " + historyCount, function (err, result) {
            if (err) throw err;

            socket.emit('history', result);
        });
    });

    socket.on('disconnect', function () {
        // Send left message to others
        io.emit('left', message("SOMEONE", "Left the chat"));
    });
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});