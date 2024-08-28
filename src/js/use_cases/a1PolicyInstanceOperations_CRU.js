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
import { A1_URL } from "../utility/constants.js";

const putPolicyCompletionSetUpTrend = Trend('CreatePolicyInstanceCompletedIn',true);
const putPolicyValidDataCompletionSetUpTrend = Trend('CreateSecondPolicyInstanceCompletedIn',true);
const putPolicyIncorrectDataCompletionSetUpTrend = Trend('CreatePolicyInstanceWithIncorrectDataCompletedIn',true);
const putwithoutMandatoryDataCompletionSetUpTrend = Trend('CreatePolicyInstanceWithoutMandatoryDataCompletedIn',true);
const getPoliciesCompletionSetUpTrend = Trend('GetPoliciesCompletedIn',true);
const getPolicyDataIdCompletionSetUpTrend = Trend('GetPolicyDataWithPolicyIdCompletedIn',true);
const getPolicyDataPolicyTypeIdCompletionSetUpTrend = Trend('GetPolicyDataWithPolicyTypeIdCompletedIn',true);
const getPolicyDataRICIdCompletionSetUpTrend = Trend('GetPolicyDataWithRICIdCompletedIn',true);
const getPolicyDataServiceIdCompletionSetUpTrend = Trend('GetPolicyDataWithServiceIdCompletedIn',true);
const getPolicyDataPolicyTypeServiceIdCompletionSetUpTrend = Trend('GetPolicyDataWithPolicyTypeIdAndServiceIdCompletedIn',true);
const getPolicyDataRicIDServiceIdCompletionSetUpTrend = Trend('GetPolicyDataWithRICIdAndServiceIdCompletedIn',true);
const getPolicyDataPolicyTypeRicIdCompletionSetUpTrend = Trend('GetPolicyDataWithPolicyTypeIdAndRICIdCompletedIn',true);
const updatePolicyCompletionSetUpTrend = Trend('UpdatePolicyInstanceCompletedIn',true);
const getPolicyDataAfterUpdateCompletionSetUpTrend = Trend('GetPolicyDataAfterPolicyUpdateCompletedIn',true);
const updatePolicyWithIncorrectDataCompletionSetUpTrend = Trend('UpdatePolicyInstanceWithIncorrectDataCompletedIn',true);
const updatePolicyWithoutMandatoryDataCompletionSetUpTrend = Trend('UpdatePolicyInstanceWithoutMandatoryDataCompletedIn',true);

export default function (PARAMSCCF) {
	console.log('>>> Starting A1PolicyInstanceOperations_CRU >>>');
	const policyName = "mypolicy";

	group('CREATE A1 Policy Instance Operations', function () {
		group('Create a policy instance: Positive testcases', function () {
			/*Create a policy instance with valid data */
			sleep(15);
			const data = {
				policy_id: "mypolicy",
				policytype_id: "456",
				ric_id: "a1-simulator",
				policy_data: { name: "mypolicy-data", id: "125" },
				service_id: "myservice",
				transient: true,
				status_notification_uri: "http://echoserver:8080/policy-callback/",
			};

			let putPolicy;
			var attempt = 5;
			while (attempt > 0) {
				sleep(5);
				putPolicy = http.put(A1_URL, JSON.stringify(data), PARAMSCCF);
				if (putPolicy.status === 201) {
					console.log(putPolicy.status);
					const putPolicyResponse = check(putPolicy, {
						'New policy is created with valid data': (r) => r.status === 201,
					});
					attempt = 0;
				}
				else
					attempt--;
			}

			console.log('putPolicy: ' + putPolicy.status);
			let duration = putPolicy.timings.duration;
			putPolicyCompletionSetUpTrend.add(duration);

			/*Create a second policy instance with valid data */
			sleep(5);
			const validData = {
				policy_id: "newpolicy",
				policytype_id: "456",
				ric_id: "a1-simulator",
				policy_data: { name: "newpolicy-data", id: "789" },
				service_id: "myservice",
				transient: true,
				status_notification_uri: "http://echoserver:8080/policy-callback/",
			};
			sleep(Math.floor(Math.random() * 4) + 1)
			let putPolicyValidData = http.put(A1_URL, JSON.stringify(validData), PARAMSCCF);

			console.log(putPolicyValidData.status);
			console.log(putPolicyValidData.body);

			duration = putPolicyValidData.timings.duration;
			putPolicyValidDataCompletionSetUpTrend.add(duration);
			const putPolicyValidDataResponse = check(putPolicyValidData, {
				'Second policy instance is created with valid data': (r) => r.status === 201,
			});

		});

		group('Create a policy instance: Negative testcases', function () {
			console.log('************ Negative testcase: Create a policy instance with invalid data - start ************')
			/*Create a policy instance with invalid data */
			const incorrectData = {
				policy_id: "invalidpolicy",
				policytype_id: "456",
				ric_id: "a1-simultor",
				policy_data: { name: "mypolicy-data", id: "2" },
				service_id: "myservice",
				transient: true,
				status_notification_uri: "http://echoserver:8080/policy-callback/",
			  };
			  let putPolicyIncorrectData = http.put(
				A1_URL,
				JSON.stringify(incorrectData),
				PARAMSCCF
			  );
			console.log(putPolicyIncorrectData.status);
			console.log(putPolicyIncorrectData.body);

			let duration = putPolicyIncorrectData.timings.duration;
			putPolicyIncorrectDataCompletionSetUpTrend.add(duration);
			const putPolicyIncorrectDataResponse = check(putPolicyIncorrectData, {
				'Policy creation is failing with Near-RT RIC or policy type is not found error with invalid data': (r) => r.body.includes("Near-RT RIC or policy type not found"),
				'Policy creation status is failing with invalid data': (r) => r.status === 404,
			});

			/*Create a policy instance without mandatory fields */
			const withoutMandatoryData = {
				policy_id: "invalidpolicy",
				policytype_id: "",
				ric_id: "a1-simulator",
				policy_data: { name: "mypolicy-data", id: "2" },
				service_id: "myservice",
				transient: true,
				status_notification_uri: "http://echoserver:8080/policy-callback/",
			};
			let putwithoutMandatoryData = http.put(A1_URL, JSON.stringify(withoutMandatoryData), PARAMSCCF);
			console.log(putwithoutMandatoryData.status);
			console.log(putwithoutMandatoryData.body);

			duration = putwithoutMandatoryData.timings.duration;
			putwithoutMandatoryDataCompletionSetUpTrend.add(duration);
			const putwithoutMandatoryDataResponse = check(putwithoutMandatoryData, {
				'Policy creation is failing with Near-RT RIC or policy type is not found error without mandatory fields': (r) => r.body.includes("Near-RT RIC or policy type not found"),
				'Policy creation status is failing when mandatory fields are missing': (r) => r.status === 404,
			});
			console.log('************ Negative testcas end ************')
		});

	});

	group('READ A1 Policy Instance Operations', function () {
		group('Get policy data', function () {
			/* Get policy data */
			let getPolicies = http.get(A1_URL, PARAMSCCF)
			console.log(getPolicies.body);
			console.log(getPolicies.status);

			let duration = getPolicies.timings.duration;
			getPoliciesCompletionSetUpTrend.add(duration);

			const getPoliciesResponse = check(getPolicies, {
				'Get policy data status': (r) => r.status === 200,
				'All the created policies are fetched': (r) => r.json(["policy_ids"]).includes(policyName) ,
			});
		});

		group('Get policy data with policy id: Positive testcases', function () {
			/* Testcase to get policy data with valid policy id */
			let getPolicyDataId = http.get(A1_URL + "/" + policyName, PARAMSCCF)
			console.log('getPolicyDataId : ' + getPolicyDataId.status);
			console.log('getPolicyDataId.body: ' + getPolicyDataId.body);

			let  duration = getPolicyDataId.timings.duration;
			getPolicyDataIdCompletionSetUpTrend.add(duration);
			const getPolicyDataIdResponse = check(getPolicyDataId, {
				'Get policy data using valid policy Id is': (r) => r.status === 200,
				'Valid policy data is returned with policy_id': (r) => r.json(['policy_id']) === policyName,
			});
		});

		group('Get policy data with defined search criteria', function () {
			let duration;

			/* Testcase to get policy data with valid policytype_id */
			let getPolicyDataPolicyTypeId = http.get(A1_URL + "?policytype_id=456", PARAMSCCF)
			console.log("456" + getPolicyDataPolicyTypeId.body);
			console.log(getPolicyDataPolicyTypeId.status);

			duration = getPolicyDataPolicyTypeId.timings.duration;
			getPolicyDataPolicyTypeIdCompletionSetUpTrend.add(duration);
			const getPolicyDataPolicyTypeIdResponse = check(getPolicyDataPolicyTypeId, {
				'Get policy data using valid policytype Id is': (r) => r.status === 200,
				'Valid policy data is returned with policytype_id': (r) => r.json(["policy_ids"]).includes(policyName),
			});

			/* Testcase to get policy data with valid ric_id */
			let getPolicyDataRICId = http.get(A1_URL + "?ric_id=a1-simulator", PARAMSCCF)
			console.log('getPolicyDataRICId' + getPolicyDataRICId.body);
			console.log(getPolicyDataRICId.status);

			duration = getPolicyDataRICId.timings.duration;
			getPolicyDataRICIdCompletionSetUpTrend.add(duration);
			const getPolicyDataRICIdResponse = check(getPolicyDataRICId, {
				'Get policy data using valid ric_id is': (r) => r.status === 200,
				'Valid policy data is returned with ric_id': (r) => r.json(["policy_ids"]).includes(policyName),
			});

			/* Testcase to get policy data with valid service_id */
			let getPolicyDataServiceId = http.get(A1_URL + "?service_id=myservice", PARAMSCCF)
			console.log('getPolicyDataServiceId' + getPolicyDataServiceId.body);
			console.log(getPolicyDataServiceId.status);

			duration = getPolicyDataServiceId.timings.duration;
			getPolicyDataServiceIdCompletionSetUpTrend.add(duration);
			const getPolicyDataServiceIdResponse = check(getPolicyDataServiceId, {
				'Get policy data using valid service_id is': (r) => r.status === 200,
				'Valid policy data is returned with service_id': (r) => r.json(["policy_ids"]).includes(policyName),
			});


			/* Testcase to get policy data with valid policytype_id and service_id */
			let getPolicyDataPolicyTypeServiceId = http.get(A1_URL + "?policytype_id=456&service_id=myservice", PARAMSCCF)
			console.log('getPolicyDataPolicyTypeServiceId'+ getPolicyDataPolicyTypeServiceId.body);
			console.log(getPolicyDataPolicyTypeServiceId.status);

			duration = getPolicyDataPolicyTypeServiceId.timings.duration;
			getPolicyDataPolicyTypeServiceIdCompletionSetUpTrend.add(duration);
			const getPolicyDataPolicyTypeServiceIdResponse = check(getPolicyDataPolicyTypeServiceId, {
				'Get policy data using valid policytype_id and service_id is': (r) => r.status === 200,
				'Valid policy data is returned with service_id and policytype_id': (r) => r.json(["policy_ids"]).includes(policyName),
			});

			/* Testcase to get policy data with valid service_id and ric_id */
			let getPolicyDataRicIDServiceId = http.get(A1_URL + "?ric_id=a1-simulator&service_id=myservice", PARAMSCCF)
			console.log('getPolicyDataRicIDServiceId' + getPolicyDataRicIDServiceId.body);
			console.log(getPolicyDataRicIDServiceId.status);

			duration = getPolicyDataRicIDServiceId.timings.duration;
			getPolicyDataRicIDServiceIdCompletionSetUpTrend.add(duration);
			const getPolicyDataRicIDServiceIdResponse = check(getPolicyDataRicIDServiceId, {
				'Get policy data using valid ric_id and service_id is': (r) => r.status === 200,
				'Valid policy data is returned with ric_id and service_id': (r) => r.json(["policy_ids"]).includes(policyName),
			});

			/* Testcase to get policy data with valid policytype_id and ric_id */
			let getPolicyDataPolicyTypeRicId = http.get(A1_URL + "?ric_id=a1-simulator&policytype_id=456", PARAMSCCF)
			console.log('getPolicyDataPolicyTypeRicId ' + getPolicyDataPolicyTypeRicId.body);
			console.log(getPolicyDataPolicyTypeRicId.status);

			duration = getPolicyDataPolicyTypeRicId.timings.duration;
			getPolicyDataPolicyTypeRicIdCompletionSetUpTrend.add(duration);
			const getPolicyDataPolicyTypeRicIdResponse = check(getPolicyDataPolicyTypeRicId, {
				'Get policy data using valid ric_id and policytype_id is': (r) => r.status === 200,
				'Valid policy data is returned using policytype_id and ric_id': (r) => r.json(["policy_ids"]).includes(policyName),
			});
		});

	});

	group('UPDATE A1 Policy Instance Operations', function () {
		group('Update a policy: Positive testcases', function () {
			/* Testcase to update policy data with valid policy id */
			const updateData = {
				policy_id: "mypolicy",
				policytype_id: "456",
				ric_id: "a1-simulator",
				policy_data: { name: "mypolicy-data-update", id: "9" },
				service_id: "myservice",
				transient: true,
				status_notification_uri: "http://echoserver:8080/policy-callback/",
			};
			let updatePolicy = http.put(A1_URL, JSON.stringify(updateData), PARAMSCCF);
			console.log(updatePolicy.status);
			console.log(updatePolicy.body);

			let duration = updatePolicy.timings.duration;
			updatePolicyCompletionSetUpTrend.add(duration);
			const updatePolicyResponse = check(updatePolicy, {
				'Policy is updated': (r) => r.status === 200,
			});

			/* Testcase to get policy data after policy is updated */
			let getPolicyDataAfterUpdate = http.get(A1_URL + "/" + policyName, PARAMSCCF)
			console.log(getPolicyDataAfterUpdate.body);
			console.log(getPolicyDataAfterUpdate.status);

			duration = getPolicyDataAfterUpdate.timings.duration;
			getPolicyDataAfterUpdateCompletionSetUpTrend.add(duration);
			const getPolicyDataAfterUpdateResponse = check(getPolicyDataAfterUpdate, {
				'Get policy data using valid policy Id is': (r) => r.status === 200,
				'Updated policy data is returned': (r) => r.body.match("mypolicy-data-update"),
			});
		});

		group('Update a policy: Negative testcases', function () {
			console.log('************ Negative testcase: Update - start ************')
			/* Testcase to update policy data with invalid policy data */
			const updateIncorrectData = {
				policy_id: "mypolicy",
				policytype_id: "456",
				ric_id: "a1-simlator",
				policy_data: { name: "mypolicy-data-update", id: "9" },
				service_id: "myservice",
				transient: true,
				status_notification_uri: "http://echoserver:8080/policy-callback/",
			};
			let updatePolicyWithIncorrectData = http.put(A1_URL, JSON.stringify(updateIncorrectData), PARAMSCCF);
			console.log(updatePolicyWithIncorrectData.status);
			console.log(updatePolicyWithIncorrectData.body);

			let duration = updatePolicyWithIncorrectData.timings.duration;
			updatePolicyWithIncorrectDataCompletionSetUpTrend.add(duration);
			const updatePolicyWithIncorrectDataResponse = check(updatePolicyWithIncorrectData, {
				'Policy update is failing with Near-RT RIC or policy type is not found error with incorrect data': (r) => r.body.includes("Near-RT RIC or policy type not found"),
				'Policy update is failing with incorrect data': (r) => r.status === 404,
			});

			/* Testcase to update policy data without mandatory fields */
			const updateWithoutMandatoryData = {
				policy_id: "mypolicy",
				policytype_id: "",
				ric_id: "a1-simulator",
				policy_data: { name: "mypolicy-data-update", id: "9" },
				service_id: "myservice",
				transient: true,
				status_notification_uri: "http://echoserver:8080/policy-callback/",
			};
			let updatePolicyWithoutMandatoryData = http.put(A1_URL, JSON.stringify(updateWithoutMandatoryData), PARAMSCCF);
			console.log(updatePolicyWithoutMandatoryData.status);
			console.log(updatePolicyWithoutMandatoryData.body);

			duration = updatePolicyWithoutMandatoryData.timings.duration;
			updatePolicyWithoutMandatoryDataCompletionSetUpTrend.add(duration);
			const updatePolicyWithoutMandatoryDataResponse = check(updatePolicyWithoutMandatoryData, {
				'Policy update is failing with Near-RT RIC or policy type is not found error without mandatory fields': (r) => r.body.includes("Near-RT RIC or policy type not found"),
				'Policy update is failing when mandatory fields are missing': (r) => r.status === 404,
			});
			console.log('************ Negative testcase ended ************')
		});
	});
	console.log('<<< Finished A1PolicyInstanceOperations_CRU <<<');
}