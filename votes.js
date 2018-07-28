var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');

var port = process.env.PORT || 3001;
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

// TODO: Validate vote data server side
io.on('connection', function(socket){

    socket.on('vote', function(vote){
        vote["status"] = "pending";
        vote["likes"] = "0";
        vote["time"] = getTimestamp();

        var query = con.query('INSERT INTO votes SET ?', vote, function (error, results, fields) {
            if (error) throw error;

            io.emit('vote', vote);
        });
    });

    socket.on('joined', function (user) {
        // Send chat history to user
        con.query("SELECT * FROM votes ORDER BY time DESC LIMIT " + historyCount, function (err, result) {
            if (err) throw err;
            
            socket.emit('history', result);
        });
    });

    socket.on('disconnect', function () {
    });
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});