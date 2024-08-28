import { group } from 'k6'
import * as http from '../modules/k6extra/http.js'
import check from '../modules/k6extra/check.js'
import { startFrame, endLine } from '../utility/utility.js'
import { HOSTNAME } from '../utility/constants.js'

export default function(accessToken) {
    startFrame('Starting ReadOnlyRole tests');

    group('A1 policy manager tests with readonly role', function() {
        const PARAMSCCF = {
            headers: {
              Authorization: 'Bearer ' + accessToken,
              'Content-Type': 'application/json',
              'tenantName': 'master'
            }
        };

        check(accessToken, {
            "Access token should not be empty": () => accessToken !== null || accessToken !== undefined || accessToken !== ""
        });

        let policies;
        group('Positive tests', function(){
            console.log('>>> Get A1 status >>>');
            const respStatus = http.get(`${HOSTNAME}/a1/a1-policy/v2/status`, PARAMSCCF);
            console.log('Response status: ' + respStatus.status);
            console.log('Response body: ' + respStatus.body);
            check(respStatus, {
                "Read status (GET) response should be 200 OK": () => respStatus.status === 200
            });
            console.log('<<< Get A1 status completed <<<');

            console.log('>>> Get policies >>>');
            const respPolicies = http.get(`${HOSTNAME}/a1/a1-policy/v2/policies`, PARAMSCCF);
            console.log('Response status: ' + respPolicies.status);
            console.log('Response body: ' + respPolicies.body);
            check(respPolicies, {
                "Read policies (GET) response should be 200 OK": () => respPolicies.status === 200
            });
            console.log('<<< Get policies completed <<<');
            policies = JSON.parse(respPolicies.body).policy_ids;
        });

        group('Negative tests', function(){
            console.log('************ Negative testcases start ************');

            const data = {
				ric_id: "a1-simulator",
				policy_id: "readonly-test-policy",
				service_id: "myservice",
				policy_data: { name: "mypolicy-data", id: "125" },
				policytype_id: "456",
				status_notification_uri: "http://echoserver:8080/policy-callback/"
			};

            console.log('>>> Create policies >>>');
            const respCreate = http.put(`${HOSTNAME}/a1/a1-policy/v2/policies`, JSON.stringify(data), PARAMSCCF);
            console.log('Response status: ' + respCreate.status);
            console.log('Response body: ' + respCreate.body);
            check(respCreate, {
                "Create (PUT) policy should be 403 FORBIDDEN": () => respCreate.status === 403
            });
            console.log('<<< Create policies completed <<<');

            console.log('>>> Delete policies >>>');
            const respDelete = http.del(`${HOSTNAME}/a1/a1-policy/v2/policies/${policies[0]}`, null, PARAMSCCF);
            console.log('Response status: ' + respDelete.status);
            console.log('Response body: ' + respDelete.body);
            check(respDelete, {
                "Delete (DEL) policy should be 403 FORBIDDEN": () => respDelete.status === 403
            });
            console.log('<<< Delete policies completed <<<');

            console.log('************ Negative testcases end ************');
        });
    });

    endLine('Finished ReadOnlyRole tests');
}