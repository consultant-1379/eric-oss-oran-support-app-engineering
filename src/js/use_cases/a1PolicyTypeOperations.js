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
import { A1_SU, HOSTNAME } from "../utility/constants.js";

const getPolicyTypeDataIdCompletionSetUpTrend = Trend('GetPolicyTypeDataCompletedIn', true);
const getPolicyTypesCompletionSetUpTrend = Trend('GetPolicyTypesCompletedIn', true);
const serviceCreationCompletionSetUpTrend = Trend('ServiceCreationCompletedIn', true);

export default function (PARAMSCCF) {
	console.log('>>> Starting A1PolicyTypeOperations >>>');
	const policy_type_id = "456";
    console.log('Create a new service in a1PolicyTypeOperations');
	sleep(Math.floor(Math.random() * 4) + 1)
	/** https://docs.onap.org/projects/onap-ccsdk-oran/en/latest/offeredapis/pms-api.html#tag/Service-Registry-and-Supervision/operation/putService */
	const serviceData = { "service_id": "myservice", "keep_alive_interval_seconds": 0, "callback_url": "http://echoserver:8080/service-callback" };
	let putService = http.put(A1_SU, JSON.stringify(serviceData), PARAMSCCF);

	console.log(putService.status);
	sleep(5);
	let duration = putService.timings.duration;
	serviceCreationCompletionSetUpTrend.add(duration);

	const putServiceResponse = check(putService, {
		'New service is created': (r) => r.status === 201 || r.status === 200,
	});

	group('A1 policy type operations', function () {
		group('Get policy type data', function () {
			/* Get policy type data */
			sleep(20);
			const A1_PT = HOSTNAME.concat("/a1/a1-policy/v2/policy-types");
			const getPolicyTypes = http.get(A1_PT, PARAMSCCF)

			console.log('getPolicyTypes body: ' + getPolicyTypes.body);
			console.log('getPolicyTypes status: ' + getPolicyTypes.status);
			let duration = getPolicyTypes.timings.duration;
			getPolicyTypesCompletionSetUpTrend.add(duration);
			const getPolicyTypesResponse = check(getPolicyTypes, {
				'Policy type status is retuned': (r) => r.status === 200,
				'All the created policy types are available': (r) => r.body.includes("policytype_ids"),
				'Policy Types body includes ID': (r) => r.json(["policytype_ids"]).includes(policy_type_id),
			});
		});
		group('Get policy type definition', function () {
			/* Testcase to get policy type data with valid policy type id */
			sleep(10)
			const A1_PTD = HOSTNAME.concat("/a1/a1-policy/v2/policy-types/" + policy_type_id);
			let getPolicyTypeDataId = http.get(A1_PTD, PARAMSCCF)
			console.log('getPolicyTypeDataId ' + getPolicyTypeDataId.body);
			console.log('getPolicyTypeDataId status ' + getPolicyTypeDataId.status);
			sleep(5)
			const res = JSON.parse(getPolicyTypeDataId.body);
			let duration = getPolicyTypeDataId.timings.duration;
			getPolicyTypeDataIdCompletionSetUpTrend.add(duration);

			const getPolicyTypeDataIdResponse = check(getPolicyTypeDataId, {
				'Policy type data is returned succssfully with policyTypeId': (r) => r.status === 200,
				'Correct policy type data is returned with policytype_id': (r) => r.body.match("policy_schema"),
				'Includes title' : (r) => res["policy_schema"]["title"].includes(policy_type_id),
			});
		});
	});
	console.log('<<< Finished A1PolicyTypeOperations <<<');
}
