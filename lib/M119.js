var http = require('http');
var https = require('https');
var querystring = require('querystring');
var _ = require('underscore');
var url = require('url');
var fs = require('fs');
var crypto = require('crypto')

var M119 = {

	config: {
		port: -1
	},

	// Initialize server
	connect: function() {
		if(M119.config.port === -1) {
			console.log('Please setup M119.config.port first');
		} else {
			// var privateKey = fs.readFileSync('certs/privatekey.pem').toString();
			// var certificate = fs.readFileSync('certs/certificate.pem').toString();
			// var credentials = crypto.createCredentials({key: privateKey, cert: certificate});

			var server = http.createServer(function(req, res) {
				M119.getDataForRequest(req, function(err, data) {
					M119.fetch(M119.createRequest(req), data, function(err, response) {
						if(err) console.log(err);
						else {
							res.writeHead(response.code, response.headers);
							res.end(response.data);
						}
					});
				});
			});
			server.listen(M119.config.port);
			console.log('Listening on ' + M119.config.port);
		}
	},

	getDataForRequest: function(req, callback) {
		var data = '';
		if('POST' === req.method.toUpperCase()) {
			req.on('data', function(chunk) {
				data += chunk;
			});
			req.on('end', function() {
				callback(null, querystring.parse(data) );
			});
		} else {
			callback(null, data);
		}
	},

	createRequest: function(req) {
		var Q = url.parse(req.url, true);
		Q.query._host = 'data.in.bookmyshow.com';
		var options = {
			hostname: Q.query._host,
			port: Q.query._port || 80,
			path: req.url,
			method: req.method,
			headers: {}
		};
		var keys = _.keys(req.headers);
		for(x in keys) {
			var remove = ['host', 'content-length', 'accept-encoding'];
			if( !_.contains(remove, keys[x]) ) {
				options.headers[ keys[x] ] = req.headers[ keys[x] ];
			}
		}
		return options;
	},

	fetch: function(options, postData, callback) {
		console.log(options);
		var rr = http.request(options, function(response) {
			var data = '';
			response.setEncoding('utf8');
			response.on('data', function(chunk) {
				data += chunk;
			});
			response.on('end', function() {
				callback(null, { code: response.statusCode, headers: response.headers, data: data } );
			});
		});

		rr.on('error', function(e) {
			callback(e);
		});

		if('POST' === options.method.toUpperCase()) {
			rr.write(data);
		}

		rr.end();
	}

}

module.exports = M119;
