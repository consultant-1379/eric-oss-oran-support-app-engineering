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
import { A1_URL, A1_SU } from "../utility/constants.js";

const deleteInvalidPolicyCompletionSetUpTrend = Trend('DeleteInvalidPolicyCompletedIn', true);
const getPolicyDataInvalidIdCompletionSetUpTrend = Trend('GetPolicyDataWithInvalidIdCompletedIn', true);
const getPolicyStatusInvalidIdCompletionSetUpTrend = Trend('GetPolicyStatusWithInvalidIdCompletedIn', true);
const deleteServiceCompletionSetUpTrend = Trend('DeleteServiceCompletedIn', true);

export default function (PARAMSCCF) {
	console.log('************ Negative testcases start ************')
	const policyName = "mypolicy";

	group('DELETE  Negative testcases: A1 Policy Instance Operations', function () {
		group('Delete a policy: Negative testcases', function () {
			/* Testcase to delete policy with invalid policy Id */
			const deleteInvalidPolicy = http.del(A1_URL + "/" + policyName, null, PARAMSCCF)
			console.log(deleteInvalidPolicy.status);

			let duration = deleteInvalidPolicy.timings.duration;
			deleteInvalidPolicyCompletionSetUpTrend.add(duration);

			console.log('deleteInvalidPolicy.status (404) ' + deleteInvalidPolicy.status);
			const deletePoliciesResponse = check(deleteInvalidPolicy, {
				'Policy deletion is failing with invalid policy instance Id': (r) => r.status === 404,
			});
		});
		group('Get policy data with policy id: Negative testcases', function () {
			/* Testcase to get policy data with invalid policy id */
			let getPolicyDataInvalidId = http.get(A1_URL + "/" + policyName, PARAMSCCF)
			console.log(getPolicyDataInvalidId.body);
			console.log(getPolicyDataInvalidId.status);

			let duration = getPolicyDataInvalidId.timings.duration;
			getPolicyDataInvalidIdCompletionSetUpTrend.add(duration);

			console.log('getPolicyDataInvalidId.status (404) ' + getPolicyDataInvalidId.status);
			const getPolicyDataInvalidIdResponse = check(getPolicyDataInvalidId, {
				'Policy data is not returned with invalid policy_id': (r) => r.status === 404,
			});
		});
	});
	group('A1 Policy Instance Status', function () {
		group('Get Policy Instance Status: Negative testcases', function () {
			/* Get policy status with invalid policy Id */
			let getPolicyStatusInvalidId = http.get(A1_URL + "/" + policyName + "/status", PARAMSCCF)

			let duration = getPolicyStatusInvalidId.timings.duration;
			getPolicyStatusInvalidIdCompletionSetUpTrend.add(duration);

			console.log('getPolicyStatusInvalidId.status (404) ' + getPolicyStatusInvalidId.status);
			const getPolicyStatusInvalidIdResponse = check(getPolicyStatusInvalidId, {
				'Policy status is not returned with invalid policy_id': (r) => r.status === 404,
			});
		});
	});

	//Delete service
	const deleteService = http.del(A1_SU + "/myservice", null, PARAMSCCF)
	console.log(deleteService.status);

	let duration = deleteService.timings.duration;
	deleteServiceCompletionSetUpTrend.add(duration);

	const deleteServiceResponse = check(deleteService, {
		'Delete service': (r) => r.status === 204,
	});
	console.log('************ Negative testcases end ************')
}