/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

// @ts-check

/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
const { runSetup } = require('@aws-ee/api-testing-framework');
const _ = require('lodash');
const os = require('os');
const axios = require('axios').default;
const generate = require('oauth-signature').generate;
const uuid = require('uuid');
const { createWaitImage } = require('../../support/complex/create-wait-image');
const { settingKeys, getSetting } = require('../../support/helpers/get-setting');

describe('Post appstream-links scenarios', () => {
  let setup;
  let adminSession;
  let fleetName;
  let ltiEndpoint;
  let envName;
  let solutionName;
  let awsRegionShortName;
  let cf;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
    // we will need a running fleet to successfully complete these tests.
    await createWaitImage(adminSession, getSetting(setup, settingKeys.defaultTestImage));
    fleetName = getSetting(setup, settingKeys.defaultTestFleet);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const fleets = await adminSession.resources.fleets.get();
      const engineeringTestFleet = _.find(fleets, (fleet) => fleet.name === fleetName);

      if (engineeringTestFleet.state === 'RUNNING') {
        break;
      }

      if (engineeringTestFleet.state === 'STOPPED') {
        await adminSession.resources.fleets.update({ fleetName }, {}, { api: '/api/appstream-fleets/start' });
      }

      // eslint-disable-next-line no-console
      console.log(`${engineeringTestFleet.name} currently in ${engineeringTestFleet.state} state. Waiting...`);
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }

    envName = getSetting(setup, 'envName');
    awsRegionShortName = getSetting(setup, 'awsRegionShortName');
    solutionName = getSetting(setup, 'solutionName');

    const ltiStackName = `${envName}-${awsRegionShortName}-${solutionName}-lti`;
    cf = await setup.aws.services.cloudFormation();
    ltiEndpoint = await cf.getStackOutputValue(ltiStackName, 'ServiceEndpoint');
  });

  describe('Create Appstream streaming link with unsigned request', () => {
    it('should fail', async () => {
      const headers = { 'Content-Type': 'application/json', 'Origin': `https://${os.hostname()}` };
      const axiosClient = axios.create({
        baseURL: ltiEndpoint,
        timeout: 30000,
        headers,
      });

      let status;
      try {
        const response = await axiosClient.post('/api/appstream-links/prepare-link', {});
        status = response.status;
      } catch (err) {
        if (err.response) {
          const response = err.response;
          status = _.get(response, 'status');
        }
      }
      expect(status).toEqual(500);
    });
  });

  // if these test fail, ensure the LTIHandler IAM Role has Appstream:CreateStreamingLink
  // permissions allowed on the fleet.
  describe('Create Appstream streaming link with signed request', () => {
    const secrets = ['LTIConsumerSecretPrimary', 'LTIConsumerSecretSecondary'];

    it.each(secrets)('should succeed for a "%s"', async (secret) => {
      const imageBuilderStackName = `${envName}-${awsRegionShortName}-${solutionName}-image-builder`;
      const sut = await cf.getStackOutputValue(imageBuilderStackName, secret);
      const sm = await setup.aws.services.secretsManager();
      const secretValue = await sm.getSecretValue(sut);
      const consumerKey = secretValue.ltiConsumerKey;
      const consumerSecret = secretValue.ltiConsumerSecret;
      const headers = {
        'Content-Type': 'application/json',
        'Origin': `https://${os.hostname()}`,
      };
      const axiosClient = axios.create({
        baseURL: ltiEndpoint,
        timeout: 30000,
        headers,
      });

      const params = {
        oauth_version: '1.0',
        oauth_nonce: uuid.v1(),
        oauth_timestamp: Math.floor(Date.now() / 1000),
        oauth_consumer_key: consumerKey,
        // currently required by the LTI handler - the user for whom this will launch
        ext_user_username: adminSession.user.username,
        oauth_callback: 'about:blank',
        ext_lms: 'API Testing',
        // these three are required by ims-lms in min params
        lti_version: 'LTI-1p0',
        lti_message_type: 'basic-lti-launch-request',
        resource_link_id: '4',
        // required by the LIT handler - the fleet name to launch
        custom_fleet: fleetName,
        roles: 'Instructor,urn:lti:sysrole:ims/lis/Administrator,urn:lti:instrole:ims/lis/Administrator',
      };

      const signature = generate(
        'POST',
        `${ltiEndpoint}/api/appstream-links/prepare-link`,
        params,
        consumerSecret,
        undefined,
        { encodeSignature: false },
      );
      params.oauth_signature = signature;
      let status;
      let method;
      let responseUrl;
      try {
        const response = await axiosClient.post('/api/appstream-links/prepare-link', JSON.stringify(params));
        status = response.status;
      } catch (err) {
        status = err.response.status;
        responseUrl = _.get(err, 'response.request.res.responseUrl');
        method = _.get(err, 'response.request.method');
      }
      // expect a 404 error here because Axios doesn't handle the redirect on POST.
      expect(status).toBe(404);
      // but the responseUrl in the request resolution should reference the requested fleet.
      expect(responseUrl).toContain(`reference=fleet%2F${fleetName}`);
      // and the expected method to call the responseUrl should be GET.
      expect(method).toBe('GET');
    });
  });
});
