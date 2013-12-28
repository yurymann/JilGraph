"use strict";

// Represents a logical dependency connection between Autosys jobs.
// source:  name of the dependent job
// target:  name of a job on which source is dependent
// status:  string containing the expected status of the target job; 
//                  if the status is a full string, it will be truncated to the first letter 
//                  (e.g. "success" will be truncated to "s")
function JilConnection(source, target, status) {
    this.source = source;
    this.target = target;
    this.status = status[0];
}

JilConnection.prototype.equals = function(other) {
    for (var prop in this) {
        if (this[prop] != other[prop]) {
            return false;
        }
    };
    return true;
}
