/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

let utils = require('fabric-client/lib/utils.js');
let logger = utils.getLogger('integration.ca.identity-service');

let tape = require('tape');
let _test = require('tape-promise').default;
let test = _test(tape);
const path = require('path');
let FabricCAServices = require('../../fabric-ca-client');
const { HFCAIdentityAttributes, HFCAIdentityType } = require('../../fabric-ca-client/lib/IdentityService');

const User = require('../../fabric-ca-client/lib/User');

let userOrg1 = 'org1';
let userOrg2 = 'org2';
let tlsOptions = {
	trustedRoots: [],
	verify: false
};

let ORGS;

test('\n\n ** FabricCAServices - IdentityService Test **\n\n', async (t) => {

	FabricCAServices.addConfigFile(path.join(__dirname, 'e2e', 'config.json'));
	ORGS = FabricCAServices.getConfigSetting('test-network');

	const fabricCAEndpoint1 = ORGS[userOrg1].ca.url;
	const fabricCAEndpoint2 = ORGS[userOrg2].ca.url;

	FabricCAServices.getConfigSetting('crypto-keysize', '256'); //force for gulp test
	FabricCAServices.setConfigSetting('crypto-hash-algo', 'SHA2'); //force for gulp test

	let caService1 = new FabricCAServices(fabricCAEndpoint1, tlsOptions, ORGS[userOrg1].ca.name);
	let caService2 = new FabricCAServices(fabricCAEndpoint2, tlsOptions, ORGS[userOrg2].ca.name);

	let bootstrapUser = {
		enrollmentID: 'admin',
		enrollmentSecret: 'adminpw'
	};

	let admin1;
	let admin2;
	let testIdentity = {
		enrollmentID: 'user_' + Math.random().toFixed(3).toString(),
		enrollmentSecret: 'userpw',
		affiliation: 'org1',
		// set this identity can manage identities of the role client
		attrs: [{ name: HFCAIdentityAttributes.HFREGISTRARROLES, value: HFCAIdentityType.CLIENT }]
	};

	// update the enrollment secret for testIdentity
	let update = {
		enrollmentSecret: 'mysecret'
	};
	let hfcaIdentityService1;
	let hfcaIdentityService2;

	try {
		const enrollment1 = await caService1.enroll(bootstrapUser);
		t.pass('Successfully enrolled admin at ca_Org1');

		const enrollment2 = await caService2.enroll(bootstrapUser);
		t.pass('Successfully enrolled admin at ca_Org2');

		admin1 = new User('admin');
		await admin1.setEnrollment(enrollment1.key, enrollment1.certificate, 'Org1MSP');
		t.pass('Successfully set enrollment for user admin1');

		admin2 = new User('admin2');
		await admin2.setEnrollment(enrollment2.key, enrollment2.certificate, 'Org2MSP');
		t.pass('Successfully set enrollment for user admin2');

		hfcaIdentityService1 = caService1.newIdentityService();
		hfcaIdentityService2 = caService2.newIdentityService();

		// create a new Identity with admin1
		let resp = await hfcaIdentityService1.create(testIdentity, admin1);
		t.equal(resp, testIdentity.enrollmentSecret);
		t.pass('Successfully created new Identity %s by admin1', testIdentity.enrollmentID);

		let enrollment;
		let identity;
		// enroll the new created user at ca_Org1
		enrollment = await caService1.enroll({ enrollmentID: testIdentity.enrollmentID, enrollmentSecret: testIdentity.enrollmentSecret });
		t.pass(`Successfully enrolled ${testIdentity.enrollmentID} at ca_Org1`);
		identity = new User(testIdentity.enrollmentID);
		await identity.setEnrollment(enrollment.key, enrollment.certificate, 'Org1MSP');

		// should throw error if we enroll this new identity at ca_Org2
		try {
			enrollment = await caService2.enroll({ enrollmentID: testIdentity.enrollmentID, enrollmentSecret: testIdentity.enrollmentSecret });
			t.fail('should throw error if we enroll this new identity at ca_Org2');
			t.end();
		} catch (e) {
			t.equal(e.message.indexOf('"message":"Authorization failure"') >= 0, true);
			t.pass('should throw error if we enroll this new identity at ca_Org2');
		}

		// get this Identity from ca_Org1 by identity
		resp = await hfcaIdentityService1.getOne(testIdentity.enrollmentID, identity);
		t.pass(`Successfully get indentity ${testIdentity.enrollmentID}`);
		t.equal(resp.success, true);
		t.equal(resp.result.id, testIdentity.enrollmentID);
		t.equal(resp.result.affiliation, testIdentity.affiliation);

		// get this Identity from ca_Org1 by admin1
		resp = await hfcaIdentityService1.getOne(testIdentity.enrollmentID, admin1);
		t.equal(resp.success, true);

		// identity can only find itself
		resp = await hfcaIdentityService1.getAll(identity);
		t.equal(resp.success, true);
		t.equal(resp.result.identities.length, 1);

		// admin of ca1 can find two identities
		resp = await hfcaIdentityService1.getAll(admin1);
		t.equal(resp.success, true);
		t.equal(resp.result.identities.length, 2);

		// admin of ca2 can only find 1 identity
		resp = await hfcaIdentityService2.getAll(admin2);
		t.equal(resp.success, true);
		t.equal(resp.result.identities.length, 1);

		// update test identity with admin1
		resp = await hfcaIdentityService1.update(identity._name, update, admin1);
		t.equal(resp.result.secret, update.enrollmentSecret);
		t.pass('Successfully updated indentity ' + identity._name);

		// identity delete itself
		resp = await hfcaIdentityService1.delete(identity._name, identity, true);
		t.equal(resp.success, true);
		t.equal(resp.result.id, identity._name);
		t.pass('Successfully deleted identity ' + identity._name);
		t.end();
	} catch (e) {
		t.fail(e);
		t.end();
	}
});
