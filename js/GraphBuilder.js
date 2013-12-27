"use strict";

// parent: top-level DOM object for the graph
function GraphBuilder(jilArray, topContainer) {
    this.topContainer = topContainer;
    this.jilArray = jilArray;
    this.idPrefix = "jildiv_";
    this.initialiseJsPlumb();
    this.jilParser = new JilParser();
    this.connectorColor = 'rgb(131,8,135, 0.5)';
    this.connectorColorHighlight = 'red';
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
        var conn = jsPlumb.connect({
            source: $("#" + thisBuilder.idPrefix + connection.source),
            target: $("#" + thisBuilder.idPrefix + connection.target),
            anchor: "Continuous",
            paintStyle:{lineWidth:2, strokeStyle: thisBuilder.connectorColor},
            hoverPaintStyle:{ strokeStyle:"green" },
            // endpointStyle:{ width:40, height:40 },
            // //endpoint:"Rectangle",
            // connector:"Continuous",
            endpoint: ["Dot", { radius: 3 }],
            connector: ["Bezier", { curviness: 40 }],
            overlays:[[
                "Arrow", 
                {   location: 1, width: 10, 
                    paintStyle: { lineWidth:1, strokeStyle: "rgb(128, 0, 64)", fillStyle: "rgb(128, 0, 64)" }
                }
            ]],        
        });
        conn.bind("click", function() {
            conn.setPaintStyle({lineWidth:2, strokeStyle: thisBuilder.swapConnectorColor(conn.getPaintStyle().strokeStyle)});
            //conn.getOverlays()[0].setPaintStyle({ lineWidth: 1, strokeStyle: "green" });
        });
    });    
}

GraphBuilder.prototype.initialiseJsPlumb = function() {
    jsPlumb.ready(function() {
        //      jsPlumb.DefaultDragOptions = { cursor: "pointer", zIndex: 2000 };

        jsPlumb.importDefaults({
            Container: $("body"),
            // Anchor: "Continuous",
            //PaintStyle:{lineWidth:2, strokeStyle:'rgba(0,255,200,0.5)'},
            // hoverPaintStyle:{ strokeStyle:"rgb(0, 0, 135)" },
            //PaintStyle: { lineWidth : 2, strokeStyle : "rgba(50, 50, 200, 0.1)"},
            //PaintStyle: { lineWidth : 2, strokeStyle : "#456"},
            //Endpoints: [ [ "Dot", 5 ], [ "Dot", 3 ] ],
            //Endpoint: [ "Dot", { radius: 3 } ],
            // EndpointStyles: [
                // { fillStyle:"#225588" }, 
                // { fillStyle:"#558822" }
              // ],
            //Connector: "Flowchart",
            //Connector: ["Bezier", { curviness: 40 }],
            //Overlays: [ "Arrow", { location: 1 } ],
            // PaintStyle:{lineWidth:7,strokeStyle:'rgb(131,8,135, 0.2)'},
            // HoverPaintStyle:{ strokeStyle:"rgb(0, 0, 135)" },
            // EndpointStyle:{ width:40, height:40 },
            // Endpoint:"Rectangle",
            // Connector:"Straight"
        });
    });
    $(window).resize(function(){
        jsPlumb.repaintEverything();
    });
}

GraphBuilder.prototype.swapConnectorColor = function(currentColor) {
    return (currentColor == this.connectorColor) ? 
        this.connectorColorHighlight : this.connectorColor;
}

// Recursively adds a div for the job/box object.
// Then, if the job is a box, adds divs for its children.
GraphBuilder.prototype.addJobWithChildren = function(job, parentDiv) {
    try {
        var div = this.addJobDiv(job, parentDiv);
        var thisBulider = this;
        $.each(this.getBoxChildren(job), function(i, child) {
            thisBulider.addJobWithChildren(child, div);
        });
    } catch (e) {
        throw new Error("Error when adding job '" + job.name + "' to div '" + parentDiv.id + "': " + e.message);
    }
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
    throw new Error("Unknown job type: " + jobType);
}

GraphBuilder.prototype.getTopLevelJobs = function() {
    return $.grep(this.jilArray, function(job) {
        return !job.hasOwnProperty("box_name");
    });
}

// Returns an empty array if the provided object is not a box
// or the box has no children.
GraphBuilder.prototype.getBoxChildren = function(box) {
    return $.grep(this.jilArray, function(job){
        return job.box_name == box.name;
    });
}

// Returns an array of JilConnection structures representing all jil dependencies.
GraphBuilder.prototype.getConnections = function() {
    var result = [];
    var thisGraph = this;
    $.each(this.jilArray, function(i, job) {
        result = result.concat(job.condition);
    });
    return result;
}
