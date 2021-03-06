/**
 * Copyright 2016 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

var tape = require('tape');
var _test = require('tape-promise').default;
var test = _test(tape);

var testUtil = require('./util.js');

var Orderer = require('fabric-client/lib/Orderer.js');


//
// Orderer happy path test are implemented as part of the end-to-end tests only
// because the orderer no longer accepts random data but requires all the payload
// header structure, making it impractical to carry out a happy path test outside
// of a proposal-transaction flow

//
// Orderer bad address test
//
// Attempt to initialize an orderer with a bad URL address. An invalid protocol
// error is expected in this case.
//

test('orderer bad address test', function(t) {
	testUtil.resetDefaults();

	try {
		new Orderer('xxxxx');
		t.fail('Orderer allowed setting a bad URL.');
	}
	catch(err) {
		t.pass('Orderer did not allow setting bad URL.');
	}
	t.end();
});

//
// Orderer missing address test
//
// Attempt to initialize an orderer with a missing URL address. A TypeError
// indicating that the URL must be a "string" is expected in this case.
//

test('orderer missing address test', function(t) {
	try {
		new Orderer();
		t.fail('Orderer allowed setting a missing address.');
	}
	catch(err) {
		t.pass('Orderer did not allow setting a missing address.');
	}
	t.end();
});

//
// Orderer missing data test
//
// Send an empty broadcast message to an orderer. An error indicating that no
// data was sent is expected in this case.
//

test('orderer missing data test', function(t) {
	var client = new Orderer('grpc://127.0.0.1:5005');

	client.sendBroadcast()
		.then(
			function() {
				t.fail('Should have noticed missing data.');
				t.end();
			},
			function(err) {
				t.pass('Successfully found missing data: ' + err);
				client.close();
				t.end();
			}
		).catch(function(err) {
			t.fail('Caught Error: should not be here if we defined promise error function: ' + err);
			t.end();
		});
});

//
//Orderer missing data test
//
//Send an empty deliver message to an orderer. An error indicating that no
//data was sent is expected in this case.
//

test('orderer missing data deliver test', function(t) {
	var client = new Orderer('grpc://127.0.0.1:5005');

	client.sendDeliver()
		.then(
			function() {
				t.fail('Should have noticed missing data.');
				t.end();
			},
			function(err) {
				t.pass('Successfully found missing data: ' + err);
				t.end();
			}
		).catch(function(err) {
			t.fail('Caught Error: should not be here if we defined promise error function: ' + err);
			t.end();
		});
});

//
// Orderer unknown address  test
//
// Send a deliver message to a bad orderer address. An error indicating
// a connection failure is expected in this case.
//

test('orderer unknown address test', function(t) {
	var client = new Orderer('grpc://127.0.0.1:51006');

	client.sendDeliver('some data')
		.then(
			function() {
				t.fail('Should have noticed a bad deliver address.');
				t.end();
			},
			function(err) {
				t.equal(err.message, 'Failed to connect before the deadline',
					'sendDeliver to unreachable orderer should response connection failed');
				t.pass('Successfully found bad deliver address!');
				t.end();
			}
		).catch(function(err) {
			t.fail('Caught Error: should not be here if we defined promise error function: '
		+ err);
			t.end();
		});
});

//
//Orderer unknown address  test
//
//Send a broadcast message to a bad orderer address. An error indicating
//a connection failure is expected in this case.
//

test('orderer unknown address test', function(t) {
	var client = new Orderer('grpc://127.0.0.1:51006');

	client.sendBroadcast('some data')
		.then(
			function() {
				t.fail('Should have noticed a bad address.');
				t.end();
			},
			function(err) {
				t.equal(err.message, 'Failed to connect before the deadline',
					'sendBroadcast to unreachable orderer should response connection failed');
				t.pass('Successfully found bad address!');
				t.end();
			}
		).catch(function(err) {
			t.fail('Caught Error: should not be here if we defined promise error function: '
		+ err);
			t.end();
		});
});

test('Orderer test', function(t) {
	var orderer = new Orderer('grpc://127.0.0.1:5005');

	t.doesNotThrow(
		function () {
			orderer.setName('name');
			orderer.close();
		},
		null,
		'checking the orderer setName() and close()'
	);
	t.equals('name', orderer.getName(), 'checking getName on orderer');

	t.end();
});

test('Orderer clientCert test', function(t) {
	var orderer = new Orderer('grpc://127.0.0.1:5005', {clientCert: 'TEST_CERT_PEM'});

	t.equals(orderer.clientCert, 'TEST_CERT_PEM', 'checking client certificate on orderer');

	t.end();
});
