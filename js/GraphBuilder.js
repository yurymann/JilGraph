"use strict";

// parent: top-level DOM object for the graph
function GraphBuilder(jilArray, topContainer, globalJsPlumb) {
    this.topContainer = topContainer;
    this.jilArray = jilArray;
    this.idPrefix = "jildiv_";
    this.initialiseJsPlumb();
}

GraphBuilder.prototype.draw = function() {
    this.insertDivs();
    this.insertConnections();
}

GraphBuilder.prototype.insertDivs = function() {
    var thisBulider = this;
    $.each(this.getTopLevelJobs(), function(i, job) {
        thisBulider.addJobWithChildren(job, thisBulider.topContainer);
    });
}

GraphBuilder.prototype.insertConnections = function() {
    var thisBuilder = this;
    $.each(this.getConnections(), function(i, connection) {
        console.log("#" + thisBuilder.idPrefix + connection.source.name);
        console.log($("#" + thisBuilder.idPrefix + connection.source.name));
        jsPlumb.connect({
            source: $("#" + thisBuilder.idPrefix + connection.source.name),
            target: $("#" + thisBuilder.idPrefix + connection.target.name),
        });
    });    
}

GraphBuilder.prototype.initialiseJsPlumb = function() {
    jsPlumb.ready(function() {
        //      jsPlumb.DefaultDragOptions = { cursor: "pointer", zIndex: 2000 };

        jsPlumb.importDefaults({
            Container: $("body"),
            Anchor: "Continuous",
            PaintStyle: { lineWidth : 2, strokeStyle : "#456"},
            //Endpoints: [ [ "Dot", 5 ], [ "Dot", 3 ] ],
            Endpoint: [ "Dot", { radius: 3 } ],
            EndpointStyles: [
                { fillStyle:"#225588" }, 
                { fillStyle:"#558822" }
              ],
            //Overlays: [ "Arrow", { location: 1 } ],
        });
    });
}

// Recursively adds a div for the job/box object.
// Then, if the job is a box, adds divs for its children.
GraphBuilder.prototype.addJobWithChildren = function(job, parentDiv) {
    var div = this.addJobDiv(job, parentDiv);
    var thisBulider = this;
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
}

// Returns an array of JilConnection structures representing all jil dependencies.
GraphBuilder.prototype.getConnections = function() {
    var result = [];
    var thisGraph = this;
    $.each(this.jilArray, function(i, job) {
        result = result.concat(thisGraph.getDependencies(job));
    });
    return result;
}

// Returns an array of JilConnection objects
GraphBuilder.prototype.getDependencies = function(job) {
    //if (!job.condition) {
    //    return [];
   // }
    
    var re = new RegExp(/(\w+)\s*\(\s*([^)]+)\s*\)/g);
    var iStatus = 1; // index of the capture group capturing the expected status of the dependency job
    var iDependency = 2; // index of the capture group capturing the name of the dependency job

    var result = [];
    var condition;
    var newCondition = null;
    var prevCondition = null;
    var match;
    while (match = re.exec(job.condition)) 
    {
        result.push(new JilConnection(
            job,
            this.findJob(match[iDependency]),
            match[iStatus]
        ));
    }
    return result;
}

GraphBuilder.prototype.findJob = function(name) {
    for (var i = 0; i < this.jilArray.length; i++) {
        var job = this.jilArray[i];
        if (job.name == name) {
            return job;
        }
    }
}
