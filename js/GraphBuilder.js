// parent: top-level DOM object for the graph
function GraphBuilder(topContainer) {
    this.topContainer = topContainer;
    
    this.idPrefix = "div_";
}

GraphBuilder.prototype.addJobDiv = function(job) {
    var div = $('<div>', { id: this.idPrefix + job.id }, 
                         { class: this.getJobClass(job) })
              .css(
                         { height: '100px', 
                           width: '100px', 
                           border: 'solid 1px' 
                         }
                  ).appendTo(this.topContainer);
    return $(div);
} 

GraphBuilder.prototype.getJobClass = function(job) {
    var jobType = job.job_type;
    switch (jobType) {
    case "c" : return "job";
    case "b" : return "box";
    }
    throw "Unknown job type: " + jobType;
}
