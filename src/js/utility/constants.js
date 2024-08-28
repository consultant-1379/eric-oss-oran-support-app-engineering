export const SEF_STATUS = (__ENV.SEF_STATUS_CM !== undefined && __ENV.SEF_STATUS_CM !== "") ? `${__ENV.SEF_STATUS_CM}`.toLowerCase() : `${__ENV.SEF_STATUS_V}`.toLowerCase();
export const EIC_HOSTNAME = (__ENV.EIC_HOSTNAME_CM !== undefined && __ENV.EIC_HOSTNAME_CM !== "") ? `https://${__ENV.EIC_HOSTNAME_CM}` : `https://${__ENV.EIC_HOSTNAME_V}`;
export const GAS_HOSTNAME = (__ENV.GAS_HOSTNAME_CM !== undefined && __ENV.GAS_HOSTNAME_CM !== "") ? `https://${__ENV.GAS_HOSTNAME_CM}` : `https://${__ENV.GAS_HOSTNAME_V}`;
export const HOSTNAME = (SEF_STATUS == "true") ? EIC_HOSTNAME : GAS_HOSTNAME;
export const IAM_HOSTNAME = (__ENV.IAM_HOSTNAME_CM !== undefined && __ENV.IAM_HOSTNAME_CM !== "") ? `https://${__ENV.IAM_HOSTNAME_CM}` : `https://${__ENV.IAM_HOSTNAME_V}`;
export const A1_URL = HOSTNAME.concat("/a1/a1-policy/v2/policies");
export const A1_SVC = "http://eric-oss-a1-policy-mgmt-svc:9080/a1-policy/v2";
export const A1_SU = "http://eric-oss-a1-policy-mgmt-svc:9080/a1-policy/v2/services";
export const A1_SIM = "http://a1-simulator:8085";
export const GAS_USER_NAME = "gas-user";
export const GAS_USER_PASSWORD = "Ericsson123!";
export const KEYCLOAK_TOKEN_LIFESPAN = 30 * 60;
export const CLIENT_ID_OSSADMIN = 'os_k6_client_ossadmin';
export const CLIENT_ROLES_OSSADMIN = ['OSSPortalAdmin'];
export const CLIENT_ID_RW = 'os_k6_client_rw';
export const CLIENT_ROLES_RW = ['A1PolicyManager_Application_ReadWrite'];
export const CLIENT_ID_READONLY = 'os_k6_client_readonly';
export const CLIENT_ROLES_READONLY = ['A1PolicyManager_Application_ReadOnly'];
export const HEADER = {
    headers: {
        accept: "application/json",
        "content-type": "application/json",
    }
};
export const PARAMS = {
    params: {
        "content-type": "application/json",
    }
}