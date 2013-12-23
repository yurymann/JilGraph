// parent: top-level DOM object for the graph
function GraphBuilder(jilArray, topContainer) {
    this.topContainer = topContainer;
    this.jilArray = jilArray;
    this.idPrefix = "div_";
}

GraphBuilder.prototype.draw = function() {
    for (var job in getTopLevelJobs()) {
        addJobWithChildren(job);
    }
}

// Recursively adds a div for the job/box object.
// Then, if the job is a box, adds divs for its children.
GraphBuilder.prototype.addJobWithChildren = function(job) {
    var div = addJobDiv(job, this.topContainer);
    $.each(getBoxChildren(job), function() {
        addJobWithChildren(child, parent);
    });
}

// Creates div for the job or box and adds it to the parent container.
GraphBuilder.prototype.addJobDiv = function(job, parent) {
    var div = $('<div>', 
    {   id: this.idPrefix + job.name, 
        class: this.getJobClass(job) 
    })
        .text(job.name)
        .appendTo(parent)[0];
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
        return job.hasOwnProperty("box");
    });
}

GraphBuilder.prototype.getBoxChildren = function(box) {
    if (box.job_type != "b") {
        throw "The provided object is not a box.";
    }
    
    return $.grep(this.jilArray, function(job){
        return job.box == box.name;
    });
}

