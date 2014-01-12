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
    this.defaultPrefixToStrip = null;
    
    // The fraction of the number of occurrences of the prefix to strip in the total number of the jobs. 
    this.minimumPrefixFrequency = 0.7;
};

JilParser.prototype.removeComments = function(jilText) {
    var commentRegexp = new RegExp("/[*]([^*]|[\r\n]|([*]+([^*/]|[\r\n])))*[*]+/", "g");
    return jilText.replace(commentRegexp, "").trim();
};

JilParser.prototype.parse = function(jilText) {
    jilText = this.removeComments(jilText);
    
    var reg = new RegExp(/^\s*\w+:.*$/gm);
    
    var currentJob = null;
    var result = [];
    var match;
    while((match = reg.exec(jilText)) !== null) {
        var line = match[0].trim(); 
        var propName = line.match(/\w+:/)[0].replace(":", "");
        var propValue = this._unquote(line.replace(/\w+:\s*/, "").trim());
        
        if ($.inArray(propName, this.jilSectionTags) >= 0) {
            currentJob = {name: propValue};
            if ($.inArray(propName, this.jobStartTags) >= 0) {
                result.push(currentJob); 
            } // Otherwise we're creating the new job to parse and skip all its other properties, but not adding it to the resulting array
        } else {
            currentJob[propName] = propValue;
        }
    }
    
    this._setDependenciesAsReferences(result);
    this._setDaysOfWeek(result);
    // This should go after _setDependenciesAsReferences
    this._stripPrefix(result);
    this._validateAfterParsing(result);
    
    return result;
};

JilParser.prototype.findJob = function(jilArray, name) {
    for (var i = 0; i < jilArray.length; i++) {
        var job = jilArray[i];
        if (job.name == name) {
            return job;
        };
    };
};

// dayOfWeek: 2-letter string specifying any single day of week
// If a job is within a box, then it is considered active only on the days when both
// the job and the parent box are active.
JilParser.prototype.getJobsOnDayOfWeek = function(jilArray, dayOfWeek) {
	dayOfWeek = dayOfWeek.trim();
	if (dayOfWeek.length != 2) {
		throw new Error("Unexpected day of week: '" + dayOfWeek + "'");
	}
	var thisParser = this;
	return $.grep(jilArray, function(job) {
		return thisParser._isJobActiveOnDayOfWeek(jilArray, job, dayOfWeek); 
	});
};

JilParser.prototype._unquote = function(s) {
	var m = s.match(/^\"(.*)\"$/);
	return m ? m[1] : s;
};

//dayOfWeek: 2-letter string specifying any single day of week
//If a job is within a box, then it is considered active only on the days when both
//the job and the parent box are active.
JilParser.prototype._isJobActiveOnDayOfWeek = function(jilArray, job, dayOfWeek) {
	return (!job.hasOwnProperty("days_of_weekArray") || job.days_of_weekArray[dayOfWeek]) 
	&& (
			!job.hasOwnProperty("box_name") || this._isJobActiveOnDayOfWeek(jilArray, this.findJob(jilArray, job.box_name), dayOfWeek)
	);
};

JilParser.prototype._stripPrefix = function(jilArray) {
    var prefixToStrip = this.defaultPrefixToStrip != null ? this.defaultPrefixToStrip : this._findPrefixToStrip(jilArray);
    if (prefixToStrip != "") {
    	// We assume here that prefixToStrip does not contain any regexp control characters.
    	var re = new RegExp("^" + prefixToStrip);
    	$.each(jilArray, function(i, job) {
    		job.name = job.name.replace(re, "");
			if (job.hasOwnProperty("box_name")) {
				job.box_name = job.box_name.replace(re, "");
			};
        	$.each(job.conditionArray, function(i, conn) {
        		conn.source = conn.source.replace(re, "");
        		conn.target = conn.target.replace(re, "");
        	});
    	});
    }
};

// Replaces textual dependency conditions with references to the Job or Box objects.
// Side-effect: if dependency conditions refer to any jobs not existing in the provided jil text, 
// the parser assumes that these are external jobs on the same Autosys instance (e.g. jobs of other applications). 
// "Stubs" for these jobs are created and grouped into a new Autosys box, so that such external dependencies
// could be shown on the graph. 
JilParser.prototype._setDependenciesAsReferences = function(jilArray) {
    var externalJobs = [];
    var thisParser = this;
    $.each(jilArray, function(i, job) {
        job["conditionArray"] = thisParser._getDependencies(jilArray, job, externalJobs);
    });
    
    if (externalJobs.length > 0) {
        var externalBox = {
            name: this.externalBoxName,
            job_type: "b",
            conditionArray: [],
        };
        jilArray.unshift(externalBox);
    };
};

JilParser.prototype._setDaysOfWeek = function(jilArray) {
	$.each(jilArray, function(i, job) {
		if (job.hasOwnProperty("days_of_week")) {
			job.days_of_weekArray = new DaysOfWeek(job.days_of_week);
		}
	});
};

JilParser.prototype._validateAfterParsing = function(jilArray) {
    var jobsWithDependencies = $.grep(jilArray, function(i, job) {
        return job.hasOwnProperty("conditionArray");
    });
    this._checkForCircularDependencies(jilArray, jobsWithDependencies, []);
};

JilParser.prototype._checkForCircularDependencies = function(jilArray, jobs, allParents) {
    var thisParser = this;
	$.each(jobs, function(i, parentJob) {
        if ($.inArray(parentJob, allParents)) {
            var allParentNames = $.map(allParents, function(i, job) { return job.name; });
            throw new Error("Circular dependency found: " + allParentNames.join(", "));
        };
        allParents.push(parentJob);
        var childJobs = $.map(parentJob.conditionArray, function(connection) {
        	return this.findJob(jilArray, connection.target);
        });
    	thisParser._checkForCircularDependencies(jilArray, childJobs, allParents);
    });
};

JilParser.prototype._insertBrackets = function(jilText) {
    var resultText = "";
    
    return resultText.trim();
};

// Returns an array of structures { dependencyName: "...", status: "..." }
JilParser.prototype._parseCondition = function(conditionString) {
    var result = [];
    var re = new RegExp(/(\w+)\s*\(\s*([^()]+)\s*\)/g);

    var iStatus = 1; // index of the capture group capturing the expected status of the dependency job
    var iDependency = 2; // index of the capture group capturing the name of the dependency job
    var match;
    while (match = re.exec(conditionString)) 
    {
        result.push({ dependencyName: match[iDependency], status: match[iStatus][0] });
    };
    return result;
};

// Returns an array of JilConnection objects
JilParser.prototype._getDependencies = function(jilArray, job, externalJobs) {
    var result = [];
    var thisParser = this;
    $.each(this._parseCondition(job.condition), function(i, dependencyStruct) {
        var dependency = thisParser.findJob(jilArray, dependencyStruct.dependencyName);
        if (!dependency) {
            dependency = { 
                name: dependencyStruct.dependencyName, 
                job_type: "c", 
                box_name: thisParser.externalBoxName,
                conditionArray: []
            };
            externalJobs.push(dependency);
            jilArray.push(dependency);
        }
        result.push(new JilConnection(
            job.name,
            dependency.name,
            dependencyStruct.status
        ));
    });
    return result;
};

// Searches for the most frequently used common prefix of the job names, occurring with
// the frequence greater than this.minimumPrefixFrequency.  
JilParser.prototype._findPrefixToStrip = function(jilArray) {
	var prefixCount = this._findMostFrequentPrefix(jilArray, "", jilArray.length);
	return prefixCount == null ? "" : prefixCount.prefix; 
};

// Internal function.
// Returns structure {prefix, count}, where prefix is the most frequently occurring prefix consisting 
// of the provided prefix plus one character; count is the number of occurrences of this prefix.   
// Returns null if it turns out that the most frequent prefix occurs less than this.minimumPrefixFrequency 
// fraction of times among totalJobNumber. 
// Parameters:
//   jobs: the list of the jobs starting at least with the provided prefix; the function assumes
//         that all the provided jobs start with this prefix.
//   prefix: the most frequent prefix found at the previous step of the recursion. 
JilParser.prototype._findMostFrequentPrefix = function(jobs, prefix, totalJobNumber) {
	var prefixCounts = [];
	$.each(jobs, function(i, job) {
		var newPrefix = job.name.substr(0, prefix.length+1);
		var counter = null;
		for (var c in prefixCounts) {
			if (prefixCounts[c].prefix == newPrefix) {
				counter = prefixCounts[c];
				break;
			};
		}
		if (counter == null) {
			counter = { prefix: newPrefix, count: 0, jobs: [] };
			prefixCounts.push(counter);
		}
		counter.count += 1;
		counter.jobs.push(job);
	});
	
	var maxCounters = [];
	// Find the most frequent
	$.each(prefixCounts, function(i, counter) {
		if (maxCounters.length == 0 || maxCounters[0].count == counter.count) {
			maxCounters.push(counter);
		} else if (maxCounters[0].count < counter.count) {
			// Clear and add only this counter
			maxCounters = [ counter ];
		};			
	});
	
	// Setting 1.1 instead of exact 1 below to be able to use the strict inequality.
	var minimumPrefixCount = Math.max(1.1, totalJobNumber * this.minimumPrefixFrequency);
	if (maxCounters[0].count < minimumPrefixCount) {
		return null;
	}
	
	// Now recursively checking next characters and selecting the returned prefix with the maximum count.
	var mostFrequentPrefixCounter = null;
	var thisParser = this;
	$.each(maxCounters, function (i, counter) {
		var nextLevelCounter = thisParser._findMostFrequentPrefix(counter.jobs, counter.prefix, totalJobNumber);
		if (nextLevelCounter != null && (mostFrequentPrefixCounter == null || mostFrequentPrefixCounter.count < nextLevelCounter.count)) {
			mostFrequentPrefixCounter = nextLevelCounter;
		};
	});
	return mostFrequentPrefixCounter != null ? mostFrequentPrefixCounter : maxCounters[0];
};

function DaysOfWeek(daysOfWeekString) {
	this.mo = false;
	this.tu = false;
	this.we = false;
	this.th = false;
	this.fr = false;
	this.sa = false;
	this.su = false;
	
	daysOfWeekString = daysOfWeekString.trim();
	for (var day in this) {
		if (daysOfWeekString.search(new RegExp("(\\b" + day + "\\b|^all$|^$)", "i")) >= 0) {
			this[day] = true;
		}
	}
}
