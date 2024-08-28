
// Drop-in replacement for k6/http library.
// Adds functionality of verbose logging failed requests.
// Use exposed functions as if it was vanilla k6 http library (API docs: https://k6.io/docs/javascript-api/k6-http)
//
// example import: import * as http from "../modules/http.js"

import http from "k6/http";

import * as log from "./log.js"

// LOG_ON_* parameters can enable/disable verbose logging on FAILED/SUCCEEDED requests in a quite verbose way,
// which makes debugging waaay easier. Pro tip: keep FAILURE logging on by default to aid solving support tickets.
const LOG_ON_SUCCESS = false;
const LOG_ON_FAILURE = false;

function hasUnexpectedFail(reqParams, resp){

    // Compare response code with user expected code if available ...
    if (reqParams && "expectedResponseCode" in reqParams) {
        if (reqParams.expectedResponseCode == resp.status) {
            return false
        }
        return true
    }

    // ... else use generic error checking
    if (resp.status >= 400) {
        return true
    }

    return false
}

export function request(method, url, body, params) {

    let resp = http.request(method,url,body,params)

    if (hasUnexpectedFail(params, resp) && LOG_ON_FAILURE){
        log.event({level: log.ERROR, title: "REQUEST_FAILED", details: createLogStruct(resp)})
    } else if (LOG_ON_SUCCESS){
        log.event({level: log.INFO, title: "REQUEST_SUCCEEDED", details: createLogStruct(resp)})
    } else if (params && params.log === true){
        log.event({level: log.INFO, title: "REQUEST_FLAGGED", details: createLogStruct(resp)})
    }

    return resp
}

function createLogStruct(response) {
    let req_resp = {
        "request": {
            "method": response.request.method,
            "url": response.request.url,
            "headers": response.request.headers,
            "body": response.request.body
        },
        "response": {
            "non-HTTP-error": response.error,
            "code": response.status,
            "headers": response.headers,
            "body": response.body,
            "timings": response.timings
        }
    }

    if (response.url != response.request.url) {
        req_resp["request"]["url_after_redirects"] = response.url
    }

    return req_resp
}


export function post(url, body, params) {
    return request('POST', url, body, params)
}

export function put(url, body, params) {
    return request('PUT', url, body, params)
}

export function patch(url, body, params) {
    return request('PATCH', url, body, params)
}

export function get(url, params) {
    return request('GET', url, null, params)
}

export function del(url, body, params) {
    return request('DELETE', url, body, params)
}

export function batch(requests) {

    let responses = http.batch(requests)

    for (let i = 0; i < responses.length; i++) {
        let resp = responses[i]
        let req = requests[i]

        if (hasUnexpectedFail(req[3], resp)){
            log.event({level: log.ERROR, title: "REQUEST_FAILED", details: createLogStruct(resp)})
        }
    }

    return responses
}
