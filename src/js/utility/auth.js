import http from "k6/http";
import { check } from "k6";
import {
  IAM_HOSTNAME,
  GAS_USER_NAME,
  GAS_USER_PASSWORD,
  KEYCLOAK_TOKEN_LIFESPAN
} from "./constants.js";

export const getKeycloakToken = () => {
  const url = `${IAM_HOSTNAME}/auth/realms/master/protocol/openid-connect/token`;
  const body = {
    username: GAS_USER_NAME,
    password: GAS_USER_PASSWORD,
    client_id: "admin-cli",
    grant_type: "password",
  };
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  return http.post(url, body, { headers });
};

export const setKeycloakTokenDuration = (keycloakToken) => {
  const url = `${IAM_HOSTNAME}/auth/admin/realms/master`;
  const body = {
    accessTokenLifespan: KEYCLOAK_TOKEN_LIFESPAN,
  };
  const headers = {
    Authorization: "Bearer " + keycloakToken,
    "Content-Type": "application/json",
    Accept: "*/*",
    Cookie: {},
  };
  return http.put(url, JSON.stringify(body), { headers });
};

export const refreshAccessToken = (refresh_token, clientSecret, clientIdName) => {
  const url = `${IAM_HOSTNAME}/auth/realms/master/protocol/openid-connect/token`;
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const body = {
    client_id: clientIdName,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refresh_token,
  };
  return http.post(url, body, { headers });
};

export const createRappClient = (keycloakToken, clientIdName) => {
  const url = `${IAM_HOSTNAME}/auth/admin/realms/master/clients`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${keycloakToken}`,
  };
  const body = {
    clientId: clientIdName,
    enabled: true,
    attributes: {
      ExternalClient: "True",
      "client_credentials.use_refresh_token": "True",
    },
    serviceAccountsEnabled: true,
    standardFlowEnabled: false,
    secret: "",
  };
  return http.post(url, JSON.stringify(body), { headers });
};

export const deleteRappClient = (clientId, keycloakToken) => {
  const url = `${IAM_HOSTNAME}/auth/admin/realms/master/clients/${clientId}`;
  const headers = {
    Authorization: "Bearer " + keycloakToken,
    "Content-Type": "application/json",
    Accept: "*/*",
    Cookie: {},
  };
  return http.del(url, null, { headers });
};

export const getClientIdList = (keycloakToken, clientIdName) => {
  const url = `${IAM_HOSTNAME}/auth/admin/realms/master/clients?clientId=${clientIdName}`;
  const headers = {
    Authorization: "Bearer " + keycloakToken,
    "Content-Type": "application/x-www-form-urlencoded",
    Cookie: {},
    Accept: "*/*",
  };
  return http.get(url, { headers });
};

export const regenerateClientSecret = (clientId, keycloakToken) => {
  const url = `${IAM_HOSTNAME}/auth/admin/realms/master/clients/${clientId}/client-secret`;
  const headers = {
    Authorization: "Bearer " + keycloakToken,
    "Content-Type": "application/json",
    Accept: "*/*",
  };
  return http.post(url, "", { headers });
};

export const getKeycloakTokenSecret = (clientSecret, clientIdName) => {
  const url = `${IAM_HOSTNAME}/auth/realms/master/protocol/openid-connect/token`;
  const body = {
    client_id: clientIdName,
    client_secret: clientSecret,
    tenant: "master",
    grant_type: "client_credentials",
  };
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "*/*",
  };
  return http.post(url, body, { headers });
};

export const getServiceRolesId = (keycloakToken, clientId) => {
  const url = `${IAM_HOSTNAME}/auth/admin/realms/master/clients/${clientId}/service-account-user`;
  const headers = {
    Authorization: "Bearer " + keycloakToken,
    "Content-Type": "application/x-www-form-urlencoded",
    Cookie: {},
    Accept: "*/*",
  };
  return http.get(url, { headers });
};

export const getServiceRolesIdList = (keycloakToken, serviceRolesId) => {
  const url = `${IAM_HOSTNAME}/auth/admin/realms/master/users/${serviceRolesId}/role-mappings/realm/available`;
  const headers = {
    Authorization: "Bearer " + keycloakToken,
    "Content-Type": "application/x-www-form-urlencoded",
    Cookie: {},
    Accept: "*/*",
  };
  return http.get(url, { headers });
};

export const setServiceRoles = (keycloakToken, serviceRolesId, role) => {
  const url = `${IAM_HOSTNAME}/auth/admin/realms/master/users/${serviceRolesId}/role-mappings/realm/`;
  const headers = {
    Authorization: "Bearer " + keycloakToken,
    "Content-Type": "application/json",
    Accept: "*/*",
    Cookie: {},
  };
  return http.post(url, JSON.stringify(role), { headers });
};

export const createHeaders = (data) => {
  const result = {
    "content-type": `application/json`,
    Authorization: `Bearer ${data.accessToken}`,
  };
  return result;
};

export const mergeHeaders = (header1, header2) => {
  // Clone header1 to avoid modifying the original object
  const mergedParams = Object.assign({}, header1);

  // Merge headers
  mergedParams.headers = Object.assign({}, header1.headers, header2.headers);

  return mergedParams;
};

export const addTagToHeaders = (existingHeaders, tag) => {
  // Clone existingHeaders to avoid modifying the original object
  const newHeaders = Object.assign({}, existingHeaders);

  // Ensure that existingHeaders.tags is an object before merging
  newHeaders.tags = Object.assign({}, existingHeaders.tags || {}, tag);

  return newHeaders;
};

export const getNewAccessTokenInScenario = (clientSecret) => {
  const getKeyCloakTokenSecretResponse = getKeycloakTokenSecret(clientSecret);
  check(getKeyCloakTokenSecretResponse, {
    "Get keycloak token secret status should be 200": () =>
      getKeyCloakTokenSecretResponse.status === 200,
  });
  const accessToken = JSON.parse(
    getKeyCloakTokenSecretResponse.body
  ).access_token;
  return accessToken;
};
