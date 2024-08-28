
import exec from "k6/execution";

// log.event logs occurence of an event with the argument-supplied data, plus some metadata in the K6 console output.
// Useful for debugging.
// Params:
// - title: Log message is embraced between the title string to aid searching.
//          Please use only CAPITAL_LETTERS_AND_UNDERSCORES
//          Example value: "REQUEST_FAILED" which will show up in logs as:
//                         <<<-REQUEST_FAILED-:> REQUEST_RESPONSE_OBJECT <:-REQUEST_FAILED->>>
// - details: A dictionary of information deemed useful for debugging

// log levels
export const ERROR = "error"
export const WARN = "warn"
export const INFO = "info"
export const LOG = "log"
export const DEBUG = "debug"
export const TRACE = "trace"

export function event({title = "EVENT_HAPPENED", details = {}, level = ERROR} = {}){
    let allInfo = {details}

    if (`${__VU}` != "0") {
        allInfo["scenario"] = exec.scenario.name;
        allInfo["iteration"] = exec.scenario.iterationInInstance;
    } else {
        allInfo["scenario"] = "setup or teardown";
    }

    var err = new Error();
    allInfo.stack = err.stack.split('\n').slice(1,-1);

    allInfo.title = title

    console[level](`<<<-${title}-:> ${JSON.stringify(allInfo)} <:-${title}->>>`)
}

export function exception(title = "EXCEPTION_HAPPENED", exception){
    let details = {
        reason: exception.toString(),
        stack: exception.stack.split('\n').slice(1,-1),

        //// "reason" and "stack" seems enough... Feel free to add more if needed:
        //cause: exception.cause,
        //message: exception.message,
        //name: exception.name,
    }
    event({level: ERROR, title: title, details: details})
}
