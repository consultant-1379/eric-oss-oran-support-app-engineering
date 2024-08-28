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

import * as http from "../modules/k6extra/http.js";
import check from "../modules/k6extra/check.js";
import { group, sleep } from 'k6';
import { vu } from 'k6/execution';
import { Trend } from 'k6/metrics';
import { A1_URL } from "../utility/constants.js";

const bulkuPolicyInstanceUpdateCompletionTrend = Trend('PolicyInstanceUpdateCompletedIn', true);

export default function (PARAMSCCF) {
    group('A1 Policy Instance Bulk Operations', function () {
        group('UPDATE multiple policy instances', function () {
            sleep(5);
            const unique_id = `${vu.idInTest}-${vu.iterationInInstance}`;
            const payload = {
                "policy_id": `mypolicyinstance${unique_id}`,
                "policytype_id": "456",
                "ric_id": "a1-simulator",
                "policy_data": {
                    "name": `mypolicy-new-data-${unique_id}`,
                    "id": `${100 + unique_id}`,
                },
                "service_id": "newservice",
                "transient": true,
                "status_notification_uri": "http://echoserver:8080/policy-callback/"
            }
            console.log("payload: ", JSON.stringify(payload));
            let putBulkPolicy = http.put(A1_URL, JSON.stringify(payload), PARAMSCCF)
            let duration = putBulkPolicy.timings.duration;
            bulkuPolicyInstanceUpdateCompletionTrend.add(duration);

            console.log("policy_id: ", payload.policy_id);
            console.log("policy_data.id: ", payload.policy_data.id);
            console.log("policy_data.name: ", payload.policy_data.name);
            console.log("policies are getting updated bulk(status): ", putBulkPolicy.status);
            console.log("policies are getting updated bulk(body): ", putBulkPolicy.body);

            const putBulkPolicyResponse = check(putBulkPolicy, {
                'Policies are getting updated': (r) => r.status === 200,
            });
        });
    });
}