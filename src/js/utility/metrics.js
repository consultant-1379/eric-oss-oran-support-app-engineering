import { vu } from 'k6/execution';

export const METRICS = new Map();
// these 2 should be the same:
METRICS.set('ServiceCreationCompletionSetUpDuration', 600); //296 447 379 400 503
METRICS.set('ServiceCreationCompletedIn', 1540); // 1388ms,

METRICS.set('DeleteBulkPolicyInstanceTearDownCompletedIn', 202);
METRICS.set('DeleteInvalidPolicyCompletedIn', 360);  // 300
METRICS.set('DeletePolicyTypeTearDownCompletedIn', 73);
METRICS.set('UPDATEMultiplePolicyInstances', 520);
METRICS.set('GetPolicyInstanceStatusCompletedIn', 650); //550ms
METRICS.set('GetPolicyTypeDataCompletedIn', 320);
METRICS.set('GetPolicyStatusWithInvalidIdCompletedIn', 72); // on product cluster higher: 60 instead of 25ms
METRICS.set('PolicyTypeCreationCompletionSetUpDuration', 99);
METRICS.set('CreatePolicyInstanceWithoutMandatoryDataCompletedIn', 110);
METRICS.set('UpdatePolicyInstanceWithIncorrectDataCompletedIn', 115); //104
METRICS.set('PolicyInstanceCreationCompletionSetUpDuration', 800); //416 // once measured 1480ms, later 5233ms (~2 times out of 500), 673
METRICS.set('UpdatePolicyInstanceCompletedIn', 200);
METRICS.set('PolicyInstanceCreationCompletion(Bulk)Duration', 920); // measured 1202ms, but just once, again ~1000 (?)
METRICS.set('GetPolicyTypesCompletedIn', 1700); //1415ms,
METRICS.set('GetPolicyDataWithRICIdIdCompletedIn', 105); //87
METRICS.set('DeleteValidPolicyCompletedIn', 720); // 606ms
METRICS.set('GetPoliciesAfterPolicyDeletionCompletedIn', 120); //474 but it seems too high;  75	98
METRICS.set('DeleteSecondPolicyCompletedIn', 185);  //410 155
METRICS.set('DeletePolicyInstanceTearDownCompletedIn', 300); // 255
METRICS.set('GetPolicyDataWithPolicyTypeIdCompletedIn', 111); //94
METRICS.set('GetPolicyDataWithPolicyIdCompletedIn', 120); // 97
METRICS.set('CreatePolicyInstanceCompletedIn', 1200); // once measured 2139ms, 2347ms
METRICS.set('Policyisfetchedin', 300); // 256
METRICS.set('GetPolicyDataWithServiceIdCompletedIn', 113); // 95
METRICS.set('GetPolicyDataWithPolicyTypeIdAndRICIdCompletedIn', 120); // 97
METRICS.set('GetPoliciesCompletedIn', 120); //63 76 103
METRICS.set('DeleteServiceTearDownCompletedIn', 233);
METRICS.set('GetPolicyDataWithRICIdAndServiceIdCompletedIn', 120);

export default function (arg) {
    // last update: 12/12/2023
    let duration = METRICS.get(arg);
    duration = vu.idInTest < 2 ? duration : duration * (1 + vu.idInTest / 20);
    return Math.round(duration);
}