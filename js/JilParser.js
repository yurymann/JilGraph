"use strict";

function JilParser() {
    this.jobStartTags = [
        "insert_job",
    ];
    this.jilSectionTags = this.jobStartTags.concat([
        "insert_machine",
        "delete_machine",
        "delete_job",
    ]);
    this.externalBoxName = "External_Jobs";
}

JilParser.prototype.removeComments = function(jilText) {
    var commentRegexp = new RegExp("/[*]([^*]|[\r\n]|([*]+([^*/]|[\r\n])))*[*]+/", "g");
    return jilText.replace(commentRegexp, "").trim();
}

JilParser.prototype.parse = function(jilText) {
    jilText = this.removeComments(jilText);
    
    var reg = new RegExp(/^\s*\w+:.*$/gm);
    
    var currentJob = null;
    var result = [];
    var match;
    while((match = reg.exec(jilText)) !== null) {
        var line = match[0].trim(); // Escape quotes
        var propName = line.match(/\w+:/)[0].replace(":", "");
        var propValue = line.replace(/\w+:\s*/, "").trim();
        
        if ($.inArray(propName, this.jilSectionTags) >= 0) {
            currentJob = {name: propValue};
            if ($.inArray(propName, this.jobStartTags) >= 0) {
                result.push(currentJob); 
            } // Otherwise we're creating the new job to parse and skip all its other properties, but not adding it to the resulting array
        } else {
            currentJob[propName] = propValue;
        }
    }
    
    this.setDependenciesAsReferences(result);
    
    return result;
}

// Replaces textual dependency conditions with references to the Job or Box objects.
// Side-effect: if dependency conditions refer to any jobs not existing in the provided jil text, 
// the parser assumes that these are external jobs on the same Autosys instance (e.g. jobs of other applications). 
// "Stubs" for these jobs are created and grouped into a new Autosys box, so that such external dependencies
// could be shown on the graph. 
JilParser.prototype.setDependenciesAsReferences = function(jilArray) {
    var externalJobs = [];
    var thisParser = this;
    $.each(jilArray, function(i, job) {
        job["condition"] = thisParser.getDependencies(jilArray, job, externalJobs);
    });
    
    if (externalJobs.length > 0) {
        var externalBox = {
            name: this.externalBoxName,
            job_type: "b",
            conditiong: externalJobs,
        };
        jilArray.unshift(externalBox, jilArray);
    }
}

JilParser.prototype.validate = function(jilArray) {
    var jobsWithDependencies = $.grep(jilArray, function(i, job) {
        return job.hasOwnProperty("condition");
    });
    checkForCircularDependencies(jobsWithDependencies, []);
}

JilParser.prototype.checkForCircularDependencies = function(dependentJobs, allParents) {
    $.each(dependentJobs, function(i, parentJob) {
        if ($.inArray(parentJob, allParents)) {
            var allParentNames = [];
            $.each(allParents, function(i, job) { allParentNames.push(job.name) });
            throw new Error("Circular dependency found: " + allParentNames.join(", "));
        }
    });
}

JilParser.prototype.insertBrackets = function(jilText) {
    var resultText = "";
    
    return resultText.trim();
}

// Returns an array of structures { dependencyName: "...", status: "..." }
JilParser.prototype.parseCondition = function(conditionString) {
    var result = [];
    var re = new RegExp(/(\w+)\s*\(\s*([^)]+)\s*\)/g);

    var iStatus = 1; // index of the capture group capturing the expected status of the dependency job
    var iDependency = 2; // index of the capture group capturing the name of the dependency job
    var match;
    while (match = re.exec(conditionString)) 
    {
        result.push({ dependencyName: match[iDependency], status: match[iStatus][0] });
    };
    return result;
}

// Returns an array of JilConnection objects
JilParser.prototype.getDependencies = function(jilArray, job, externalJobs) {
    var result = [];
    var thisParser = this;
    $.each(this.parseCondition(job.condition), function(i, dependencyStruct) {
        var dependency = thisParser.findJob(jilArray, dependencyStruct.dependencyName);
        if (!dependency) {
            dependency = { name: dependencyStruct.dependencyName, job_type: "c", box: thisParser.externalBoxName};
            externalJobs.push(dependency);
        }
        result.push(new JilConnection(
            job.name,
            dependency.name,
            dependencyStruct.status
        ));
    });
    return result;
}

JilParser.prototype.findJob = function(jilArray, name) {
    for (var i = 0; i < jilArray.length; i++) {
        var job = jilArray[i];
        if (job.name == name) {
            return job;
        }
    }
}
