"use strict";

// Represents a logical dependency connection between Autosys jobs.
// source, target:  objects of type Job or Box
// status:          string containing the expected status of the target job; 
//                  if the status is a full string, it will be truncated to the first letter 
//                  (e.g. "success" will be truncated to "s")
function JilConnection(source, target, status) {
    this.source = source;
    this.target = target;
    this.status = status[0];
}
