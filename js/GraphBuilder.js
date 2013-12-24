"use strict";

// parent: top-level DOM object for the graph
function GraphBuilder(jilArray, topContainer) {
    this.topContainer = topContainer;
    this.jilArray = jilArray;
    this.idPrefix = "div_";
}

GraphBuilder.prototype.draw = function() {
    thisBulider = this;
    $.each(this.getTopLevelJobs(), function(i, job) {
        thisBulider.addJobWithChildren(job, thisBulider.topContainer);
    });
}

// Recursively adds a div for the job/box object.
// Then, if the job is a box, adds divs for its children.
GraphBuilder.prototype.addJobWithChildren = function(job, parentDiv) {
    var div = this.addJobDiv(job, parentDiv);
    thisBulider = this;
    $.each(this.getBoxChildren(job), function(i, child) {
        thisBulider.addJobWithChildren(child, div);
    });
}

// Creates div for the job or box and adds it to the parent container.
GraphBuilder.prototype.addJobDiv = function(job, parentDiv) {
    var div = $('<div>', 
    {   id: this.idPrefix + job.name, 
        class: this.getJobClass(job) 
    })
        .text(job.name)
        .appendTo(parentDiv)
        [0];
    return div;
} 

GraphBuilder.prototype.getJobClass = function(job, parent) {
    var jobType = job.job_type;
    switch (jobType) {
    case "c" : return "job";
    case "b" : return "box";
    }
    throw "Unknown job type: " + jobType;
}

GraphBuilder.prototype.getTopLevelJobs = function() {
    return $.grep(this.jilArray, function(job) {
        return !job.hasOwnProperty("box");
    });
}

// Returns an empty array if the provided object is not a box
// or the box has no children.
GraphBuilder.prototype.getBoxChildren = function(box) {
    return $.grep(this.jilArray, function(job){
        return job.box == box.name;
    });

// Returns an array of 
GraphBuilder.prototype.getConnections = function(div) {
    return $.grep(this.jilArray, function(job){
        return job.box == box.name;
    });
}

