import { check, group } from "k6";
import { HOSTNAME } from "../utility/constants.js";
import * as http from "../modules/k6extra/http.js";
import { startFrame, endLine, describe } from "../utility/utility.js";

// Prerequisite: to successfully get metrics endpoint, the access_token must received by an authenticated client
// that has OSSPortalAdmin role (in this case, the os_k6_client_ossadmin client)
export default function (OSS_PARAMS) {
  startFrame("Start checking scrape pools");

  group("Checking all scrape pools", function () {
    describe("Get scrape pools", function () {
      const getScrapePoolResponse = http.get(`${HOSTNAME}/metrics/viewer/api/v1/targets?state=active`, OSS_PARAMS);
      try {
        check(getScrapePoolResponse, {
          "Get scrape pools status is 200 OK": (r) => getScrapePoolResponse.status === 200
        });
        if (getScrapePoolResponse.status === 200) {
          let pools = JSON.parse(getScrapePoolResponse.body);
          let allPoolsUp = true;
          for (let i = 0; i < pools.data.activeTargets.length; i++) {
            let target = pools.data.activeTargets[i];
            if (target.health != "up") {
              console.log(`TARGET is ${target.health}: ` + target.scrapePool);
              console.log("LAST ERROR: " + target.lastError);
              if (target.labels.pod_name != undefined) {
                // if target.scrapePool is: envoy-stats, kubernetes-pods, kubernetes-pods-istio-secure
                console.log("POD NAME: " + target.labels.pod_name);
              } else if (
                target.discoveredLabels.__meta_kubernetes_pod_name != undefined
              ) {
                // if target.scrapePool is: kubernetes-service-endpoints, kubernetes-service-endpoints-istio-secure
                console.log(
                  "POD NAME: " +
                    target.discoveredLabels.__meta_kubernetes_pod_name
                );
              } else {
                // if target.scrapePool is: configmap-reload, kubernetes-apiservers, kubernetes-cadvisor, kubernetes-nodes, pm-exporter, prometheus, reverse-proxy, sm-controller
                console.log("POD NAME is unknown");
              }
              allPoolsUp = false;
            }
          }
          if (allPoolsUp == false)
            throw new Error("At least one scrape pool is in down state");
          check(allPoolsUp, {
            "All scrape pools are up": (r) => r === true,
          });
        }
      } catch (e) {
        console.log("Warning: " + e.message + ", therefore the check has been disabled");
      }
    });
  });

  endLine("Finished checking scrape pools");
}
