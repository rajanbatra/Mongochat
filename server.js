var mongo = require('mongodb').MongoClient;
var client = require('socket.io').listen(4000).sockets;
var mongoose = require('mongoose');


// Connect to mongodb
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db) {
	if(err) {
		throw err;
	}

	console.log('Mongodb connected');

	//connect tp Socket.io
	client.on('connection', function(socket) {
		let chat = db.collection('chats');

		// create function to send status
		sendStatus = function(s) {
			socket.emit('status', s);
		}

		//Get chats from mongo collection
		chat.find().limit(100).sort({_id:1}).toArray(function(err, res) {
			if(err) {
				throw err;
			}

			//Emit the messages
			socket.emit('output', res);
		});

		// Handle input events
		socket.on('input', function(data) {
			let name = data.name;
			let message = data.message;

			// Check for name and message
			if(name == '' || message == '') {
				//Send error status
				sendStatus('Please enter a name and a message');
			} else {
				//insert message
				chat.insert({name: name, message: message}, function() {
					client.emit('output', [data]);

					// send status object
					sendStatus({
						message: 'Message sent',
						clear: true
					});
				});
			}
		});

		//Handle clear
		socket.on('clear', function(data) {
			// remove all chats from collection
			chat.remove({}, function() {
				// Emit cleared
				socket.emit('cleared');
			})
		})
	});

});