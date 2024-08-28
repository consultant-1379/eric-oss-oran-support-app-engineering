/*------------------------------------------------------------------------------
*******************************************************************************
* COPYRIGHT Ericsson 2024
* The copyright to the computer program(s) herein is the property of
* Ericsson Inc. The programs may be used and/or copied only with written
* permission from Ericsson Inc. or in accordance with the terms and
* conditions stipulated in the agreement/contract under which the
* program(s) have been supplied.
*******************************************************************************
*----------------------------------------------------------------------------*/

import { Trend } from 'k6/metrics';
import { sleep } from 'k6';
import { vu } from 'k6/execution';
import A1PolicyTypeOperations from "./use_cases/a1PolicyTypeOperations.js";
import A1PolicyInstanceOperations_CRU from "./use_cases/a1PolicyInstanceOperations_CRU.js";
import A1PolicyInstanceStatus from "./use_cases/a1PolicyInstanceStatus.js";
import A1PolicyInstanceOperations_D from "./use_cases/a1PolicyInstanceOperations_D.js";
import NegativeTestcases from "./use_cases/negativeTestcases.js";
import BulkPoliciesCreation from "./use_cases/bulkPoliciesCreation.js";
import SetupCleanup from "./use_cases/setupCleanup.js";
import BulkPoliciesUpdate from "./use_cases/bulkPoliciesUpdate.js";
import ScrapePoolsStatus from "./use_cases/scrapePoolsStatus.js";
import testReadOnlyRole from './use_cases/testReadOnlyRole.js';
import checkTracing from './use_cases/checkTracing.js';
import {
  A1_SIM,
  A1_SVC,
  HEADER,
  PARAMS,
  EIC_HOSTNAME,
  GAS_HOSTNAME,
  IAM_HOSTNAME,
  SEF_STATUS,
  HOSTNAME,
  CLIENT_ID_OSSADMIN,
  CLIENT_ROLES_OSSADMIN,
  CLIENT_ID_RW,
  CLIENT_ROLES_RW,
  CLIENT_ID_READONLY,
  CLIENT_ROLES_READONLY
} from "./utility/constants.js";
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import * as http from "./modules/k6extra/http.js";
import check from "./modules/k6extra/check.js";
import { startFrame, endLine } from './utility/utility.js';
import * as auth from './utility/auth.js';

const policyTypeCreationCompletionSetUpTrend = Trend('PolicyTypeCreationCompletionSetUpDuration', true);
const serviceCreationCompletionSetUpTrend = Trend('ServiceCreationCompletionSetUpDuration', true);
const policyInstanceCreationCompletionSetUpTrend = Trend('PolicyInstanceCreationCompletionSetUpDuration', true);
const getPoliciesCompletionSetUpTrend = Trend('Policyisfetchedin', true);

export function setup() {
    startFrame('Starting Setup');
    console.log("test 59");
    console.log('SEF_STATUS: ' + SEF_STATUS);
    console.log('EIC_HOSTNAME: ' + EIC_HOSTNAME);
    console.log('GAS_HOSTNAME: ' + GAS_HOSTNAME);
    console.log('IAM_HOSTNAME: ' + IAM_HOSTNAME);
    console.log('HOSTNAME: ' + HOSTNAME);

    let getPolicyTypes;
    let attempt = 7;
    while (attempt > 0) {
        sleep(5)

        getPolicyTypes = http.get("http://a1-simulator:8085/a1-p/policytypes", HEADER);
        if (getPolicyTypes.status < 200 || getPolicyTypes.status >= 300) {
            console.log("Error: retrying request");
            console.log(getPolicyTypes.status);
            console.log(getPolicyTypes.body);

            attempt--;
        }
        else {
            attempt = 0;
            console.log("A1-simulator is up");
            console.log(getPolicyTypes.status);
            console.log(getPolicyTypes.body);
        }
    }
    console.log("ricConfigurationCreation");
    ricConfigurationCreation();
    // the sleep 60 here is mandatory in production for pipeline !!!
    sleep(60);

    const accessToken = authorizeCCF(CLIENT_ID_RW, CLIENT_ROLES_RW);
    const PARAMSCCF = {
        headers: {
          Authorization: 'Bearer ' + accessToken.accessToken,
          'Content-Type': 'application/json',
          'tenantName': 'master'
        },
    };
    const resp = http.get(`${HOSTNAME}/a1/a1-policy/v2/status`, PARAMSCCF);
    console.log('>>> Get A1 status with CCF >>>');
    console.log('Response >');
    console.log('Status: ' + resp.status);
    console.log('Body: ' + resp.body);
    console.log('<<< Get status completed <<<');

    console.log(">>> policyTypeCreation >>>");
    policyTypeCreation();
    console.log(">>> serviceCreation >>>");
    serviceCreation();
    console.log(">>> policyInstanceCreation");
    policyInstanceCreation();

    endLine("Setup completed");
    return PARAMSCCF;
}

function policyTypeCreation() {
  /*Create a new policy type*/
  const policyTypeData = {
    name: "pt1",
    description: "pt1 policy type",
    policy_type_id: 1,
    create_schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "OSC_PT1_0.1.0",
      description: "QoS policy type",
      type: "object",
      properties: {
        scope: {
          type: "object",
          properties: {
            ueId: {
              type: "string",
            },
            qosId: {
              type: "string",
            },
          },
          additionalProperties: false,
          required: ["ueId", "qosId"],
        },
        statement: {
          type: "object",
          properties: {
            priorityLevel: {
              type: "number",
            },
          },
          additionalProperties: false,
          required: ["priorityLevel"],
        },
      },
    },
  };
  sleep(Math.floor(Math.random() * 4) + 1);
  let putPolicyType = http.put(`${A1_SIM}/a1-p/policytypes/456`, JSON.stringify(policyTypeData), HEADER);

  console.log("putPolicyType.status " + putPolicyType.status);

  let duration = putPolicyType.timings.duration;
  policyTypeCreationCompletionSetUpTrend.add(duration);
  const putPolicyTypeResponse = check(putPolicyType, {
    "New policy type is created": (r) => r.status === 201,
  });
}

function serviceCreation() {
  sleep(Math.floor(Math.random() * 4) + 1);
  const serviceData = {
    service_id: "newservice",
    keep_alive_interval_seconds: 0,
    callback_url: "http://echoserver:8080/service-callback",
  };
  let putService = http.put(`${A1_SVC}/services`, JSON.stringify(serviceData), HEADER);

  console.log("putService.status should be created " + putService.status);
  sleep(5);
  let duration = putService.timings.duration;
  serviceCreationCompletionSetUpTrend.add(duration);
  const putServiceResponse = check(putService, {
    "New service is created": (r) => r.status === 201 || r.status === 200,
  });
}

function policyInstanceCreation() {
    /*Create a policy instance with valid data */
    sleep(30);
    const data = {
      policy_id: "policy1",
      policytype_id: "456",
      ric_id: "a1-simulator",
      policy_data: { name: "policy1-data", id: "589" },
      service_id: "newservice",
      transient: true,
      status_notification_uri: "http://echoserver:8080/policy-callback/",
    };

    let putPolicy;
    var attempt = 5;
    while (attempt > 0) {
        sleep(5)

        putPolicy = http.put(`${A1_SVC}/policies`, JSON.stringify(data), HEADER);
        if (putPolicy.status === 201) {
            let duration = putPolicy.timings.duration;
            policyInstanceCreationCompletionSetUpTrend.add(duration);
                            const putPolicyResponse = check(putPolicy, {
                'New policy is created with valid data': (r) => r.status === 201 || r.status === 200,
            });
            attempt = 0;
        }
        else
            attempt--;
    }

    console.log('putPolicy.status: ' + putPolicy.status);
    /* Get policy data */
    let getPolicies = http.get(`${A1_SVC}/policies`, PARAMS)

    let duration = getPolicies.timings.duration;
    getPoliciesCompletionSetUpTrend.add(duration);

    const getPoliciesResponse = check(getPolicies, {
        'Get policy status': (r) => r.status === 200,
        'Policy is fetched': (r) => r.json(["policy_ids"]).includes("policy1"),
    });
}

function ricConfigurationCreation() {
    const data = {
      config: {
        ric: [
          {
            name: "a1-simulator",
            baseUrl: "http://a1-simulator:8085/",
            managedElementIds: ["kista_1", "kista_2"],
          },
        ],
      },
    };

    let putricConf;
    var attempt = 5;
    while (attempt > 0) {
        sleep(5)
        putricConf = http.put(`${A1_SVC}/configuration`, JSON.stringify(data), HEADER);
        if (putricConf.status === 201 || putricConf.status === 200) {
            console.log(putricConf.status);
            const putricConfResponse = check(putricConf, {
                'New ric configuration is created with valid data': (r) => [200, 201].includes(r.status),
            });
            attempt = 0;
        }
        else
            attempt--;
    }

    console.log('Create ric configuration status: ',putricConf.status);
    /* Get policy data */
    let getConfig = http.get(`${A1_SVC}/configuration`, PARAMS);
    console.log('getConfig.body :>> ', getConfig.body);
    console.log('getConfig.status :>> ', getConfig.status);
    const getConfigResponse = check(getConfig, {
        'Get config status': (r) => r.status === 200,
    });
}

export function testScrapePoolsAndTracing() {
  const accessTokenOSS = authorizeCCF(CLIENT_ID_OSSADMIN, CLIENT_ROLES_OSSADMIN);
  const OSS_PARAMS = {
    headers: {
      Authorization: "Bearer " + accessTokenOSS.accessToken,
      "Content-Type": "application/json",
      tenantName: "master",
    },
  };
  ScrapePoolsStatus(OSS_PARAMS);
  checkTracing(OSS_PARAMS);
}

export function readonlyTests() {
  const accessTokenRO = authorizeCCF(CLIENT_ID_READONLY, CLIENT_ROLES_READONLY);
  testReadOnlyRole(accessTokenRO.accessToken);
}

export default function (PARAMSCCF) {
    startFrame('Starting Default');
    A1PolicyTypeOperations(PARAMSCCF);
    sleep(1);
    A1PolicyInstanceOperations_CRU(PARAMSCCF);
    sleep(1);
    A1PolicyInstanceStatus(PARAMSCCF);
    sleep(1);
    A1PolicyInstanceOperations_D(PARAMSCCF);
    sleep(1);
    NegativeTestcases(PARAMSCCF);
    endLine('Default completed');
}

export function bulkActions(PARAMSCCF) {
    console.log('>>> Starting bulkActions ' + vu.idInTest + ' >>>');
    BulkPoliciesCreation(PARAMSCCF);
    BulkPoliciesUpdate(PARAMSCCF);
    console.log('<<< Finished bulkActions ' + vu.idInTest + ' <<<');
}

function authorizeCCF(clientIdName, clientIdRoles) {
  console.log(">>> Starting authorizeCCF >>>");
  const keycloakTokenResponse = auth.getKeycloakToken();
  check(keycloakTokenResponse, {
    "Get keycloak token status should be 200": () => keycloakTokenResponse.status === 200
  });

  const keycloakToken = JSON.parse(keycloakTokenResponse.body).access_token;
  const setTokenDurationResponse = auth.setKeycloakTokenDuration(keycloakToken);
  check(setTokenDurationResponse, {
    "Set token duration on Keycloak status should be 204": () => setTokenDurationResponse.status === 204
  });

  let getClientIdListResponse = auth.getClientIdList(keycloakToken, clientIdName);
  if (getClientIdListResponse.status === 200) {
    let clientIdList = JSON.parse(getClientIdListResponse.body);
    if (clientIdList.length > 0) {
      console.log("Client already exists");
      const clientId = clientIdList[0].id;
      const deleteRappClientResponse = auth.deleteRappClient(clientId, keycloakToken);
      check(deleteRappClientResponse, {
        "k6test client deleted successfully": () => deleteRappClientResponse.status === 204,
      });
    }
  }

  const createRappClientResponse = auth.createRappClient(keycloakToken, clientIdName);
  check(createRappClientResponse, {
    "Create rApp client name on Keycloak status should be 201": () => createRappClientResponse.status === 201
  });

  getClientIdListResponse = auth.getClientIdList(keycloakToken, clientIdName);
  check(getClientIdListResponse, {
    "Get ClientID list status should be 200": () => getClientIdListResponse.status === 200
  });

  const clientId = JSON.parse(getClientIdListResponse.body)[0].id;
  const getServiceRolesIdResponse = auth.getServiceRolesId(keycloakToken, clientId);
  check(getServiceRolesIdResponse, {
    "Get Service Role id status should be 200": () => getServiceRolesIdResponse.status === 200
  });

  const serviceRolesId = JSON.parse(getServiceRolesIdResponse.body).id;
  const getServiceRolesIdListResponse = auth.getServiceRolesIdList(keycloakToken, serviceRolesId);
  check(getServiceRolesIdListResponse, {
    "Get Service roles list status should be 200": () => getServiceRolesIdListResponse.status === 200
  });

  const getServiceRolesIdListResponseBody = JSON.parse(getServiceRolesIdListResponse.body);
  const rolesWithIds = clientIdRoles.map((role) => {
    const id = getServiceRolesIdListResponseBody.find(
      (roleId) => roleId.name === role
    ).id;
    const name = role;
    return {
      id,
      name
    };
  });
  rolesWithIds.forEach((roleWithId) => {
    const response = auth.setServiceRoles(keycloakToken, serviceRolesId, [
      roleWithId,
    ]);
     check(response, {
      [`Set role ${roleWithId.name} on Keycloak status should be 204`]: () => response.status === 204
    });
  });
  const regenerateClientSecretResponse = auth.regenerateClientSecret(
    clientId,
    keycloakToken
  );
  check(regenerateClientSecretResponse, {
    "Change Client secret status should be 200": () =>
      regenerateClientSecretResponse.status === 200,
  });
  const clientSecret = JSON.parse(regenerateClientSecretResponse.body).value;
  const getKeyCloakTokenSecretResponse =
    auth.getKeycloakTokenSecret(clientSecret, clientIdName);
  check(getKeyCloakTokenSecretResponse, {
    "Get keycloak token secret status should be 200": () =>
      getKeyCloakTokenSecretResponse.status === 200,
  });
  const accessToken = JSON.parse(
    getKeyCloakTokenSecretResponse.body
  ).access_token;
  const refreshToken = JSON.parse(
    getKeyCloakTokenSecretResponse.body
  ).refresh_token;
  console.log("TOKEN is HERE: " + accessToken);
  console.log("<<< Completed authorizedCCF <<<");
  return {
    accessToken,
    clientId,
    clientSecret,
    refreshToken
  };
}

export function handleSummary(data) {
  return {
    "/reports/summary.json": JSON.stringify(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

export function teardown() {
  startFrame("Executing the teardown");
  SetupCleanup();
  endLine("Teardown finished");
}
