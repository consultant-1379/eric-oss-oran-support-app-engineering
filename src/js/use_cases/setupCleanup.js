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
import { sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { PARAMS, HEADER, A1_SIM, A1_SVC } from "../utility/constants.js";

const deletePolicyInstanceCompletionTearDownTrend = Trend('DeletePolicyInstanceTearDownCompletedIn', true);
const deletePolicyTypeCompletionTearDownTrend = Trend('DeletePolicyTypeTearDownCompletedIn', true);
const deleteServiceCompletionTearDownTrend = Trend('DeleteServiceTearDownCompletedIn', true);
const deleteBulkPolicyInstanceCompletionTearDownTrend = Trend('DeleteBulkPolicyInstanceTearDownCompletedIn', true);

export default function () {
    let duration;
    const policyName = "policy1";
    /* Testcase to delete policy instance*/
    const deletePolicyInstance = http.del(`${A1_SVC}/policies/${policyName}`, null, PARAMS);
    console.log('deletePolicyInstance.status:', deletePolicyInstance.status);

    duration = deletePolicyInstance.timings.duration;
    deletePolicyInstanceCompletionTearDownTrend.add(duration);
    const deletePolicyInstanceResponse = check(deletePolicyInstance, {
        'Policy instance is deleted': (r) => r.status === 204 || r.status === 404,  // sometimes it deletes but give other than 204 response
    });

    /* Testcase to delete bulk policy instances*/
    sleep(10);
    let getPolicies = http.get(`${A1_SVC}/policies`, PARAMS);
    let policyInstances = getPolicies.json("policy_ids");
    console.log('policyInstances.length: ' + policyInstances.length);

    console.log('policyInstances:', policyInstances);
    console.log("Number of policy instances (SVC) to be deleted: " + policyInstances.length);

    if (policyInstances.length === 0) {
        getPolicies = http.get(`${A1_SIM}/a1-p/policytypes/456/policies`, PARAMS);
        policyInstances = JSON.parse(getPolicies.body);
        console.log('policyInstances:', policyInstances);
        console.log("Number of policy instances (SIM) to be deleted: " + policyInstances.length);
        const deleteAllPolicies = http.post(`${A1_SIM}/deleteinstances`, null, PARAMS);
        console.log('deleteAllPolicies:', deleteAllPolicies.status, deleteAllPolicies.body);
    } else {
        policyInstances.forEach(currentPolicyInstance => {
            const deleteBulkPolicyInstance = http.del(`${A1_SVC}/policies/${currentPolicyInstance}`, null, PARAMS);
            console.log('deleteBulkPolicyInstance.status >', deleteBulkPolicyInstance.status);
            duration = deleteBulkPolicyInstance.timings.duration;
            deleteBulkPolicyInstanceCompletionTearDownTrend.add(duration);
            const deleteBulkPolicyInstanceResponse = check(deleteBulkPolicyInstance, {
                'Bulk policy instances deleted': (r) => r.status === 204 || r.status === 404,
            });
        });
    }

    /* Testcase to delete service*/
    const deleteNewService = http.del(`${A1_SVC}/services/newservice`, null, PARAMS);
    console.log('deleteNewService.status:', deleteNewService.status);

    duration = deleteNewService.timings.duration;
    deleteServiceCompletionTearDownTrend.add(duration);
    const deleteNewServiceResponse = check(deleteNewService, {
        'Delete new service': (r) => r.status === 204,
    });

    /* Delete policy type*/
    let retry = true;
    let retryCount = 0;
    let deletepolicyType;
    while (retry && retryCount < 6) {
        sleep(10);
        deletepolicyType = http.del(`${A1_SIM}/a1-p/policytypes/456`, null, PARAMS);
        console.log('Retry #' + retryCount + ': deletepolicyType.status: ' + deletepolicyType.status);
        if (deletepolicyType.status === 204 || policyInstances.length === 0) { retry = false; }
        retryCount++;
    }

    duration = deletepolicyType.timings.duration;
    deletePolicyTypeCompletionTearDownTrend.add(duration);
    const resetSim = http.post(`${A1_SIM}/deleteall`, null, PARAMS);
    console.log('resetSim:', resetSim.status, resetSim.body);
    const removeSim = http.put(`${A1_SVC}/configuration`, JSON.stringify({config:{ric:[]}}), HEADER);
    console.log('removeSim:', removeSim.status);
}