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

// TODO: Validate proposal data server side
io.on('connection', function(socket){

    socket.on('proposal', function(proposal){
        proposal["status"] = "pending";
        proposal["likes"] = "0";
        proposal["time"] = getTimestamp();

        var query = con.query('INSERT INTO proposals SET ?', proposal, function (error, results, fields) {
            if (error) throw error;

            io.emit('proposal', proposal);
        });
    });

    socket.on('joined', function (user) {
        // Send chat history to user
        con.query("SELECT * FROM proposals ORDER BY time DESC LIMIT " + historyCount, function (error, results) {
            if (error) throw error;

            socket.emit('history', results);
        });
    });

    socket.on('like', function (like) {
        proposalID = like["id"];

        con.query("SELECT * FROM proposals WHERE id = ?", [proposalID], function (error, results, fields) {
            if (error) throw error;

            if (results.length > 0 && typeof results[0]!= 'undefined') {
                var proposal = results[0];
                proposal["likes"]++;

                con.query('UPDATE proposals SET likes = ? WHERE id = ?', [proposal["likes"], proposal["id"]], function (error, results, fields) {
                    if (error) throw error;
                    
                    io.emit('update_proposal', proposal);
                });
            }
        });
    });
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});