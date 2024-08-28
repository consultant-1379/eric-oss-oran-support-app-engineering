import { group, sleep, check } from 'k6';
import * as http from '../modules/k6extra/http.js';
import { startFrame, endLine, describe } from '../utility/utility.js';
import { EIC_HOSTNAME, A1_SVC } from '../utility/constants.js';
import generator from 'k6/x/opentelemetry';

export default function(OSS_PARAMS) {
    startFrame('Starting Tracing Check');

    group("Tracing check", function () {
      describe("Get tracing data", function() {
        let traceId = generator.newTraceID();
        let spanId = generator.newSpanID();
        console.log("traceId: " + traceId);
        console.log("spanId: " + spanId);
        const A1_PARAMS = {
          headers: {
            "Content-Type": `application/json`,
            "X-B3-TraceId": traceId,
            "X-B3-SpanId": spanId,
            "X-B3-Sampled": 1
          }
        };

        const data = {
          policy_id: "traced-policy",
          policytype_id: "456",
          ric_id: "a1-simulator",
          policy_data: { name: "traced-policy-data", id: "126" },
          service_id: "myservice",
          transient: true,
          status_notification_uri: "http://echoserver:8080/policy-callback/",
        };
        const putPolicy = http.put(`${A1_SVC}/policies`, JSON.stringify(data), A1_PARAMS);
        if (!putPolicy) {
          console.log("putPolicy status: ", putPolicy.status);
          console.log("putPolicy body: ", putPolicy.body);
        }

        let getTrace, proceed = true, retries = 1;
        while (proceed && retries <= 5) {
          sleep(5);
          console.log("Trying to get trace... #" + retries);
          let DST_URL = `${EIC_HOSTNAME}/hub/eric-dst-query/v1/distributed-trace/viewer/api/traces/${traceId}`;
          console.log("Get trace URL: " + DST_URL);
          getTrace = http.get(DST_URL, OSS_PARAMS);
          if (getTrace.status < 200 || getTrace.status >= 300) {
            console.log("TraceId not available in JaegerUI, retrying");
            retries++;
          } else {
            console.log("getTrace status: ", getTrace.status);
            console.log("getTrace body processes: ", JSON.parse(getTrace.body).data[0].processes);
            proceed = false;
          }
        }

        const resp = check(getTrace, {
          'Get trace A1 policy status is 200 OK': getTrace.status == 200,
          'There is A1 policy entry in the body': getTrace.body.includes('eric-oss-a1-policy-mgmt-svc'),
        });
        if (!resp) {
          console.log('getTrace status: ' + getTrace.status);
          console.log('getTrace body: ' + getTrace.body);
        } else {
          console.log("Check OK: " + resp);
        }
      });
    });

    endLine('Finished tracing check');
}