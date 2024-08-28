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
import { Trend } from 'k6/metrics';
import { A1_URL} from "../utility/constants.js";

const getPolicyStatusCompletionSetUpTrend = Trend('GetPolicyInstanceStatusCompletedIn', true);

export default function (PARAMSCCF) {
	console.log('>>> Starting A1PolicyInstanceStatus >>>');
	const policyName = "policy1";

	group('A1 Policy Instance Status', function () {
		group('Get Policy Instance Status: Positive testcases', function () {
			/* Get Policy Instance Status with valid policy id*/
			sleep(15);
			let getPolicyStatus = http.get(A1_URL + "/" + policyName + "/status", PARAMSCCF);

			console.log("getPolicyStatus.body: " + getPolicyStatus.body);
			console.log("getPolicyStatus.status: " + getPolicyStatus.status);

			let duration = getPolicyStatus.timings.duration;
			getPolicyStatusCompletionSetUpTrend.add(duration);

			const getPolicyStatusResponse = check(getPolicyStatus, {
				'Policy instance status is returned': (r) => r.status === 200,
				'Policy status is fetched with valid policyInstanceID': (r) => r.body.includes("status"),
				'policyInstanceID is correct': (r) => r.json(["status.created_at"]).includes(`${new Date().getFullYear()}`),
			});
		});
	});
	console.log('<<< Finished A1PolicyInstanceStatus <<<');
}
