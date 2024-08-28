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
import { group } from 'k6';
import { Trend } from 'k6/metrics';
import { A1_URL } from "../utility/constants.js";

const deleteValidPolicyCompletionSetUpTrend = Trend('DeleteValidPolicyCompletedIn', true);
const getPoliciesAfterDeleteCompletionSetUpTrend = Trend('GetPoliciesAfterPolicyDeletionCompletedIn', true);
const deleteSecondPolicyCompletionSetUpTrend = Trend('DeleteSecondPolicyCompletedIn', true);

export default function (PARAMSCCF) {
	console.log('>>> Starting A1PolicyInstanceOperations_D >>>');
	const policyName = "mypolicy";
	group('DELETE A1 Policy Instance Operations', function () {
		group('Delete a policy: Positive testcase', function () {
			let duration, timeout;

			/* Testcase to delete policy with valid policy Id */
			const deleteValidPolicy = http.del(A1_URL + "/" + policyName, null, PARAMSCCF)
			console.log(deleteValidPolicy.status);

			duration = deleteValidPolicy.timings.duration;
			deleteValidPolicyCompletionSetUpTrend.add(duration);
			const deleteValidPolicyResponse = check(deleteValidPolicy, {
				'Policy instance is deleted': (r) => r.status === 204,
			});

			let getPoliciesAfterDelete = http.get(A1_URL, PARAMSCCF)
			const deletePolicyCheck = getPoliciesAfterDelete.body;
			console.log("Policy data after " + policyName + " is deleted " + getPoliciesAfterDelete.body);

			duration = getPoliciesAfterDelete.timings.duration;
			getPoliciesAfterDeleteCompletionSetUpTrend.add(duration);
			const deletePolicyCheckResponse = check(getPoliciesAfterDelete, {
				'Deleted policy instance is not present in the policydata': (r) => r.body.match(policyName) === null,
			});

			/* Testcase to delete second policy with valid policy Id */
			const deleteSecondPolicy = http.del(A1_URL + "/newpolicy", null, PARAMSCCF)
			console.log(deleteSecondPolicy.status);

			duration = deleteSecondPolicy.timings.duration;
			deleteSecondPolicyCompletionSetUpTrend.add(duration);
			const deleteSecondPolicyPolicyResponse = check(deleteSecondPolicy, {
				'Second policy instance is deleted': (r) => r.status === 204,
			});
		});
	});
	console.log('<<< Finished A1PolicyInstanceOperations_D <<<');
}
