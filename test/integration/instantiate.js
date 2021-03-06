/**
 * Copyright 2017 Hitachi America Ltd. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

var tape = require('tape');
var _test = require('tape-promise').default;
var test = _test(tape);

var path = require('path');
var fs = require('fs');
var util = require('util');

var Client = require('fabric-client');
var utils = require('fabric-client/lib/utils.js');
var e2eUtils = require('./e2e/e2eUtils.js');
var testUtil = require('../unit/util.js');
var logger = utils.getLogger('instantiate-chaincode');

var e2e = testUtil.END2END;
var version = 'v0';

test('\n\n **** E R R O R  T E S T I N G : instantiate call fails with non-existent Chaincode version', (t) => {
	var request = {
		chaincodeId: e2e.chaincodeId,
		chaincodeVersion: 'v333333333',
		fcn: 'init',
		args: ['a', '500', 'b', '600'],
		txId: ''
	};

	var error_snip = 'cannot get package for chaincode';
	instantiateChaincodeForError(request, error_snip, t);
});

test('\n\n **** E R R O R  T E S T I N G : instantiate call fails with non-existent Chaincode name', (t) => {
	var request = {
		chaincodeId: 'dummy',
		chaincodeVersion: version,
		fcn: 'init',
		args: ['a', '500', 'b', '600'],
		txId: ''
	};

	var error_snip = 'cannot get package for chaincode';
	instantiateChaincodeForError(request, error_snip, t);
});

test('\n\n***** End-to-end flow: instantiate chaincode *****\n\n', (t) => {
	e2eUtils.instantiateChaincode('org1', testUtil.CHAINCODE_PATH, 'v0', 'golang', false, false, t)
	.then((result) => {
		if(result){
			t.pass('Successfully instantiated chaincode on the channel');

			return e2eUtils.sleep(5000);
		}
		else {
			t.fail('Failed to instantiate chaincode ');
			t.end();
		}
	}, (err) => {
		t.fail('Failed to instantiate chaincode on the channel. ' + err.stack ? err.stack : err);
		t.end();
	}).then(() => {
		logger.debug('Successfully slept 5s to wait for chaincode instantiate to be completed and committed in all peers');
		t.end();
	}).catch((err) => {
		t.fail('Test failed due to unexpected reasons. ' + err);
		t.end();
	});
});

test('\n\n **** E R R O R  T E S T I N G : instantiate call fails by instantiating the same Chaincode twice', (t) => {
	var request = {
		chaincodeId : e2e.chaincodeId,
		chaincodeVersion : version,
		fcn: 'init',
		args: ['a', '500', 'b', '600'],
		txId: ''
	};

	var error_snip = 'already exists';
	instantiateChaincodeForError(request, error_snip, t);
});

function instantiateChaincodeForError(request, error_snip, t) {

	Client.addConfigFile(path.join(__dirname, './e2e/config.json'));
	var ORGS = Client.getConfigSetting('test-network');

	var caRootsPath = ORGS.orderer.tls_cacerts;
	let data = fs.readFileSync(path.join(__dirname, '/test', caRootsPath));
	let caroots = Buffer.from(data).toString();

	var tx_id = null;
	var the_user = null;

	var userOrg = 'org1';
	var client = new Client();
	var channel_name = Client.getConfigSetting('E2E_CONFIGTX_CHANNEL_NAME', testUtil.END2END.channel);
	logger.debug(' channel_name %s', channel_name);
	var channel = client.newChannel(channel_name);
	var orgName = ORGS[userOrg].name;
	var tlsInfo = null;

	e2eUtils.tlsEnroll(userOrg)
	.then((enrollment) => {
		t.pass('Successfully retrieved TLS certificate');
		tlsInfo = enrollment;
		client.setTlsClientCertAndKey(tlsInfo.certificate, tlsInfo.key);
		return Client.newDefaultKeyValueStore({path: testUtil.storePathForOrg(orgName)});
	}).then((store) => {
		client.setStateStore(store);
		return testUtil.getSubmitter(client, t, true /* use peer org admin */, userOrg);
	}).then((admin) => {
		t.pass('Successfully enrolled user \'admin\'');
		the_user = admin;

		channel.addOrderer(
			client.newOrderer(
				ORGS.orderer.url,
				{
					'pem': caroots,
					'clientCert': tlsInfo.certificate,
					'clientKey': tlsInfo.key,
					'ssl-target-name-override': ORGS.orderer['server-hostname']
				}
			)
		);

		var targets = [];
		for (let org in ORGS) {
			if (ORGS[org].hasOwnProperty('peer1')) {
				let key = 'peer1';
				let data = fs.readFileSync(path.join(__dirname, '/test', ORGS[org][key]['tls_cacerts']));
				logger.debug(' create new peer %s', ORGS[org][key].requests);
				let peer = client.newPeer(
					ORGS[org][key].requests,
					{
						pem: Buffer.from(data).toString(),
						'clientCert': tlsInfo.certificate,
						'clientKey': tlsInfo.key,
						'ssl-target-name-override': ORGS[org][key]['server-hostname']
					}
				);
				targets.push(peer);
				channel.addPeer(peer);
			}
		}

		return channel.initialize();
	}, (err) => {
		t.fail('Failed to enroll user \'admin\'. ' + err);
		throw new Error('Failed to enroll user \'admin\'. ' + err);
	}).then((nothing) => {
		t.pass('Successfully initialized channel');
		request.txId = client.newTransactionID();
		return channel.sendInstantiateProposal(request);
	}, (err) => {
		t.fail(util.format('Failed to initialize the channel. %s', err.stack ? err.stack : err));
		throw new Error('Failed to initialize the channel');
	}).then((results) => {
		testUtil.checkResults(results, error_snip, t);
		t.end();
	}, (err) => {
		t.fail('Failed to send instantiate proposal due to error: ' + err.stack ? err.stack : err);
		throw new Error('Failed to send instantiate proposal due to error: ' + err.stack ? err.stack : err);
	}).catch((err) => {
		t.fail('Test failed due to unexpected reasons. ' + err);
		t.end();
	});
}
