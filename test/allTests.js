"use strict";

function AllTests() {
    this.jilParser = new JilParser();
    // Setting defaultPrefixToStrip to an empty string otherwise the test jil arrays
    // having "job1", "job2" etc. will be automatically stripped of the "job" prefix. 
    this.jilParser.defaultPrefixToStrip = "";
    
    this.testJil =
    [
      {
        "name": "job0_1",
        "job_type": "c",
        "command": 'start ""',
        "conditionArray": [],
      },
      {
        "name": "box1",
        "job_type": "b",
        "conditionArray": [],
      },
      {
        "name": "job1_1",
        "job_type": "c",
        "command": 'start ""',
        "box_name": "box1",
        "conditionArray" : [ new JilConnection("job1_1", "job0_1", "s") ],
      },
      {
        "name": "job1_2",
        "job_type": "c",
        "command": 'start ""',
        "box_name": "box1",
        "conditionArray": [],
      },
      
      {
        "name": "box2",
        "job_type": "b",
        "conditionArray": [],
      },
      {
        "name": "job2_1",
        "job_type": "c",
        "box_name": "box2",
        "conditionArray" : [ 
            new JilConnection("job2_1", "job0_1", "s"),
            new JilConnection("job2_1", "job1_2", "s"),
            new JilConnection("job2_1", "box1", "s")
        ],
      },
    ];
    
}

AllTests.prototype.run = function() {
	for ( var prop in this) {
		if (typeof(this[prop]) == "function" && prop.indexOf("test") == 0) {
			// This is a workaround for registering a test with testName passed into the closure
			// (the second parameter of QUnit.test).
			// If we do it directly without the wrapper, javascript uses the last test name in this loop
			// for all executed tests. 
			var testWrapper = new TestWrapper(this, prop);
			testWrapper.run();
		}
	}
};

function TestWrapper(testSuite, testName) {
	var callback = testSuite[testName];
	this.run = function() {
		QUnit.test(testName, function(assert) { 
			callback.call(testSuite, assert);
		});
	};
}

AllTests.prototype.initBuilder = function(jilObject, topContainer) {
    if (topContainer != undefined) {
        $(topContainer).empty();
    }
    return new GraphBuilder(jilObject, topContainer);
};

AllTests.prototype.testJilParser_removeComments = function(assert) {
	assert.equal(this.jilParser.removeComments($("#testJil1").text()), $(
			"#removeCommentsResult").text().trim());
};        

AllTests.prototype.testJilParser_findJob = function(assert) {
    var inputJilArray =
    [
      {
        "name": "box1",
        "job_type": "b",
      },
      {
        "name": "job1",
        "job_type": "c",
      },
    ];
    assert.equal(this.jilParser.findJob(inputJilArray, "box1"), inputJilArray[0]);
    assert.equal(this.jilParser.findJob(inputJilArray, "job1"), inputJilArray[1]);
};

AllTests.prototype.testJilParser_parseCondition = function(assert) {
    assert.deepEqual(this.jilParser._parseCondition("test: s(job1) and n(job2)|(success(box1)& s(box2)) or  failure  (job3) and (s(job4))"), [
        { dependencyName: "job1", status: "s" },
        { dependencyName: "job2", status: "n" },
        { dependencyName: "box1", status: "s" },
        { dependencyName: "box2", status: "s" },
        { dependencyName: "job3", status: "f" },
        { dependencyName: "job4", status: "s" },
    ]);
};

AllTests.prototype.testJilParser_getDependencies = function(assert) {
    var job1 = {
        "name": "job1",
        "job_type": "c",
    };
    var job2 = {
        "name": "job2",
        "job_type": "c",
    };
    var job3 = {
        "name": "job3",
        "job_type": "c",
        "condition": "s(job1) & f(job4) & n(unknownJob)",
    };
    var job4 = {
        "name": "job4",
        "job_type": "c",
    };
    var unknownJob = {
        "name": "unknownJob",
        "job_type": "c",
        "box_name": "External_Jobs",
        "conditionArray": [],
    };

    var sourceJilArray = [ job1, job2, job3, job4 ];
    var expectedJilArrayAfterParse = [ job1, job2, job3, job4 ];
    var externalJobs = [];
    assert.deepEqual(this.jilParser._getDependencies(sourceJilArray, job1, externalJobs), []);
    assert.deepEqual(externalJobs, []);
    assert.deepEqual(sourceJilArray, expectedJilArrayAfterParse);

    externalJobs = [];
    assert.deepEqual(this.jilParser._getDependencies(sourceJilArray, job3, externalJobs)[0], [
        new JilConnection("job3", "job1", "s"),
        new JilConnection("job3", "job4", "f"),
        new JilConnection("job3", "unknownJob", "f"),
    ][0]);
    assert.deepEqual(externalJobs, [unknownJob]);
    assert.deepEqual(sourceJilArray, expectedJilArrayAfterParse.concat([
        {
            "name": "unknownJob",
            "job_type": "c",
            "box_name": "External_Jobs",
            "conditionArray": [],
        },
    ]));
};

AllTests.prototype.testJilParser_parse = function(assert) {
    var expected = [
        { "name": "External_Jobs", "job_type": "b", "conditionArray": [] },
        { "name": "box1", "job_type": "b", "conditionArray": [] },
        { "name": "job1_1", "job_type": "c", "box_name": "box1", "command": "start \"\"", "conditionArray": [] },
        { "name": "job1_2", "job_type": "c", "box_name": "box1", 
            "condition": "s(job1_1) and s(externalJob)",
        	"conditionArray": [
                new JilConnection("job1_2",  "job1_1", "s"),
                new JilConnection("job1_2",  "externalJob", "s"),
            ]
        },
        { "name": "externalJob", "job_type": "c", "box_name": "External_Jobs", "conditionArray": [] },
    ];
    assert.deepEqual(this.jilParser.parse($("#testJil1").text()), expected);
};

AllTests.prototype.testJilParser_validateAfterParsing_circularDependencies = function(assert) {
    var jilArray1 = [
        { name: "job0", job_type: "c", conditionArray: [] },
        { name: "job1", job_type: "c", conditionArray: [ new JilConnection("job1", "job0", "s") ] }
    ];
    // No exceptions expected
    this.jilParser._validateAfterParsing(jilArray1);
    
    var jilArray2 = [
        { name: "job0", job_type: "c", conditionArray: [] },
        { name: "job1", job_type: "c", conditionArray: [ new JilConnection("job1", "job3", "s") ] },
        { name: "job2", job_type: "c", conditionArray: [ new JilConnection("job2", "job1", "s") ] },
        { name: "job3", job_type: "c", conditionArray: [ new JilConnection("job3", "job2", "s") ] },
    ];
    assert.throws(function() {
    	this.jilParser._validateAfterParsing(jilArray2);
    }, Error);
    
    // Job dependent on itself
    var jilArray3 = [
        { name: "job0", job_type: "c", conditionArray: [] },
        { name: "job1", job_type: "c", conditionArray: [ new JilConnection("job1", "job1", "s") ] },
    ];
    assert.throws(function() {
    	this.jilParser._validateAfterParsing(jilArray3);
    }, Error);
};

AllTests.prototype.testJilParser_findPrefixToStrip = function(assert) {
	var parser = new JilParser();
	
	var oneJob = [ { name: "job0" } ];
	parser.minimumPrefixFrequency = 0.7;
    assert.equal(parser._findPrefixToStrip(oneJob), "");
    
    var jobs1 = [ { name: "job0" }, { name: "job1" }, { name: "job2" } ];
	parser.minimumPrefixFrequency = 0.7;
    assert.equal(parser._findPrefixToStrip(jobs1), "job");
    
    var jobs2 = [ { name: "aaa" }, { name: "axy" }, { name: "axz" }, { name: "azz" },
                  { name: "bxx" }, { name: "bxy" }, { name: "bxz" }, { name: "bzz" } ];
	parser.minimumPrefixFrequency = 0.7;
    assert.equal(parser._findPrefixToStrip(jobs2), "", "Min frequency 0.7");
	parser.minimumPrefixFrequency = 0.5;
    assert.equal(parser._findPrefixToStrip(jobs2), "a", "Min frequency 0.5");
	parser.minimumPrefixFrequency = 0.3;
    assert.equal(parser._findPrefixToStrip(jobs2), "bx", "Min frequency 0.3");
	parser.minimumPrefixFrequency = 0.01;
    assert.equal(parser._findPrefixToStrip(jobs2), "bx", "Min frequency 0.01");
};

AllTests.prototype.createJilArrayForStripPrefix = function() {
	return [
		{ name: "job0", conditionArray: [], box_name: "joB3" },
		{ name: "job1", conditionArray: [ new JilConnection("job1", "joB3", "s") ] },
		{ name: "job2", conditionArray: [ new JilConnection("job2", "job1", "s") ] },
		{ name: "joB3", conditionArray: [ new JilConnection("joB3", "job2", "s") ] },
	];
};

AllTests.prototype.testJilParser_stripPrefix = function(assert) {
	var parser = new JilParser();

	var expected1 = [
	                    { name: "b0", conditionArray: [], box_name: "B3" },
	                    { name: "b1", conditionArray: [ new JilConnection("b1", "B3", "s") ] },
	                    { name: "b2", conditionArray: [ new JilConnection("b2", "b1", "s") ] },
	                    { name: "B3", conditionArray: [ new JilConnection("B3", "b2", "s") ] },
	                ];
	var expected2 = [
	                    { name: "0", conditionArray: [], box_name: "joB3" },
	                    { name: "1", conditionArray: [ new JilConnection("1", "joB3", "s") ] },
	                    { name: "2", conditionArray: [ new JilConnection("2", "1", "s") ] },
	                    { name: "joB3", conditionArray: [ new JilConnection("joB3", "2", "s") ] },
	                ];
	
	var jilArray;
	jilArray = this.createJilArrayForStripPrefix();
	parser.minimumPrefixFrequency = 0.8;
	parser._stripPrefix(jilArray);
	assert.deepEqual(jilArray, expected1);

	jilArray = this.createJilArrayForStripPrefix();
	parser.minimumPrefixFrequency = 0.75;
	parser._stripPrefix(jilArray);
	assert.deepEqual(jilArray, expected2);
};

AllTests.prototype.compareDaysOfWeek = function(assert, actual, expected, message) {
	assert.equal(actual.mo, expected.mo, message);
	assert.equal(actual.tu, expected.tu, message);
	assert.equal(actual.we, expected.we, message);
	assert.equal(actual.th, expected.th, message);
	assert.equal(actual.fr, expected.fr, message);
	assert.equal(actual.sa, expected.sa, message);
	assert.equal(actual.su, expected.su, message);
};

AllTests.prototype.testDaysOfWeek = function(assert) {
	this.compareDaysOfWeek(assert, new DaysOfWeek(""), {mo: true, tu: true, we: true, th: true, fr: true, sa: true, su: true }, "Empty");
	this.compareDaysOfWeek(assert, new DaysOfWeek("all"), {mo: true, tu: true, we: true, th: true, fr: true, sa: true, su: true }, "All");
	this.compareDaysOfWeek(assert, new DaysOfWeek("tu su"), {mo: false, tu: true, we: false, th: false, fr: false, sa: false, su: true }, "Some");
};

AllTests.prototype.testJilParser_setDaysOfWeek = function(assert) {
    var jilArray = [
	    { name: "job1" },
	    { name: "job2", days_of_week: "" },
	    { name: "job3", days_of_week: "all" },
	    { name: "job4", days_of_week: "sa su" }
	];
    this.jilParser._setDaysOfWeek(jilArray);
    assert.ok(this.jilParser.findJob(jilArray, "job1").hasOwnProperty("days_of_week") == false, 
    	"Absent");
    this.compareDaysOfWeek(assert, this.jilParser.findJob(jilArray, "job2").days_of_week, {mo: true, tu: true, we: true, th: true, fr: true, sa: true, su: true }, 
    	"Empty");
    this.compareDaysOfWeek(assert, this.jilParser.findJob(jilArray, "job3").days_of_week, {mo: true, tu: true, we: true, th: true, fr: true, sa: true, su: true }, 
    	"all");
    this.compareDaysOfWeek(assert, this.jilParser.findJob(jilArray, "job4").days_of_week, {mo: false, tu: false, we: false, th: false, fr: false, sa: true, su: true }, 
		"sa su");
};

AllTests.prototype.testJilParser_getJobsOnDayOfWeek = function(assert) {
    var jilArray = [
            	    { name: "job1" },
            	    { name: "job2", days_of_week: new DaysOfWeek("") },
            	    { name: "job3", days_of_week: new DaysOfWeek("all") },
            	    { name: "job4", days_of_week: new DaysOfWeek("mo tu") },
            	    { name: "job5", days_of_week: new DaysOfWeek("sa su"), box_name: "box1" }, // inside box1 and with its own days_of_week property
            	    { name: "job6", box_name: "box1" }, // inside box1, but without days_of_week property
            	    { name: "box1", days_of_week: new DaysOfWeek("tu su") }
            	];
    var thisSuite = this;
    var filterJobs = function(dayOfWeek) {
    	return $.makeArray($.map(thisSuite.jilParser.getJobsOnDayOfWeek(jilArray, dayOfWeek), function(job) { 
    		return job.name; 
    	}));
    };
    assert.deepEqual(filterJobs("mo"), [ "job1", "job2", "job3", "job4" ], "mo");
    assert.deepEqual(filterJobs("tu"), [ "job1", "job2", "job3", "job4", "job6", "box1" ], "tu");
    assert.deepEqual(filterJobs("we"), [ "job1", "job2", "job3" ], "we");
    assert.deepEqual(filterJobs("sa"), [ "job1", "job2", "job3" ], "sa");
    assert.deepEqual(filterJobs("su"), [ "job1", "job2", "job3", "job5", "job6", "box1" ], "su");
};

AllTests.prototype.testJilParser_unquote = function(assert) {
	assert.equal(this.jilParser._unquote('abc'), "abc");
	assert.equal(this.jilParser._unquote(''), "");
	assert.equal(this.jilParser._unquote('""'), "");
	assert.equal(this.jilParser._unquote('"abc"'), "abc");
	assert.equal(this.jilParser._unquote('"ab"cd"'), 'ab"cd');
	assert.equal(this.jilParser._unquote('abc"'), 'abc"');
	assert.equal(this.jilParser._unquote('"abc'), '"abc');
};

AllTests.prototype.addJobTest = function( assert, jobType, divClass ) {
    var builder = this.initBuilder(this.testJil, $("#graphContainer1")[0]);
    var job = {name: "job1", job_type: jobType};

    var div = builder._addJobDiv(job, builder.topContainer);
    
    assert.equal(div.id, builder.idPrefix + job.name);
    assert.equal(div.className, divClass);
    assert.equal(div.innerText, job.name);
    assert.equal(div.parentElement.id, "graphContainer1");
};

AllTests.prototype.testGraphBuilder_addJobDiv_job = function(assert) {
    this.addJobTest(assert, "c", "generic-job job");
};

AllTests.prototype.testGraphBuilder_addJobDiv_box = function(assert) {
	this.addJobTest(assert, "b", "generic-job box");
};

AllTests.prototype.testGraphBuilder_getBoxChildren_not_a_box = function(assert) {
    var builder = this.initBuilder(this.testJil);
    var jobArray = $.grep(this.testJil, function(job) { return job.name == "job1_1"; });
    assert.equal(jobArray.length, 1);
    assert.equal(builder.getBoxChildren(jobArray[0]).length, 0); 
};

AllTests.prototype.testGraphBuilder_getBoxChildren = function(assert) {
    var builder = this.initBuilder(this.testJil);
    var jobArray = $.grep(this.testJil, function(job) { return job.name == "box1"; });
    var children = builder.getBoxChildren(jobArray[0]);
    assert.equal(children.length, 2);
    $.each(children, function(i, child) { 
        assert.equal(child.name, "job1_" + (i+1));
    });
};

AllTests.prototype.testGraphBuilder_getTopLevelJobs = function(assert) {
    var builder = this.initBuilder(this.testJil);
    var jobs = builder.getTopLevelJobs();
    assert.equal(jobs.length, 3);
    assert.equal(jobs[0].name, "job0_1");
    assert.equal(jobs[1].name, "box1");
    assert.equal(jobs[2].name, "box2");
};

AllTests.prototype.testGraphBuilder_addJobWithChildren = function(assert) {
    var builder = this.initBuilder(this.testJil, $("#graphContainer1")[0]);
    var jobArray = $.grep(this.testJil, function(job) { return job.name == "box1"; });
    builder._addJobWithChildren(jobArray[0], builder.topContainer);
    assert.equal($(builder.topContainer).children().length, 1);
    var boxDiv = $(builder.topContainer).children()[0];
    assert.equal($(boxDiv).children().length, 2);
};

AllTests.prototype.testGraphBuilder_insertDivs = function(assert) {
    var builder = this.initBuilder(this.testJil, $("#graphContainer1")[0]);
    builder._insertDivs();
    assert.equal($(builder.topContainer).children().length, 3);
};

AllTests.prototype.testGraphBuilder_getConnections = function(assert) {
    var job1 = { name: "job1", job_type: "c", conditionArray: [] };
    var job2 = { name: "job2", job_type: "c", conditionArray: [ new JilConnection("job2", "job1", "s") ] };
    var job3 = { name: "job3", job_type: "c", conditionArray: [ new JilConnection("job3", "job1", "s") ] };
    var job4 = { name: "job4", job_type: "c", conditionArray: [ 
        new JilConnection("job4", "job1", "s"),
        new JilConnection("job4", "job2", "n"),
        new JilConnection("job4", "box1", "s"),
        new JilConnection("job4", "box2", "s"),
        new JilConnection("job4", "job3", "f"),
    ]};
    var box1 = { name: "box1", job_type: "b", conditionArray: [] };
    var box2 = { name: "box2", job_type: "b", conditionArray: [] };
    var jil = [job1, job2, job3, job4, box1, box2];

    var builder = this.initBuilder(jil, $("#graphContainer1")[0]);
    var actualConnections = builder.getConnections();
    var expectedConnections = [
        new JilConnection("job2", "job1", "s"),
        new JilConnection("job3", "job1", "s"),
        new JilConnection("job4", "job1", "s"),
        new JilConnection("job4", "job2", "n"),
        new JilConnection("job4", "box1", "s"),
        new JilConnection("job4", "box2", "s"),
        new JilConnection("job4", "job3", "f"),
    ];
    $.each(actualConnections, function(i, actualConnection) {
        assert.deepEqual(actualConnection, expectedConnections[i], "Connection number " + i);
    });
};

AllTests.prototype.testGraphCuilder_getInbound_and_OutboundConnections = function(assert) {
    var job0 = { name: "job0", job_type: "c", conditionArray: [] };
    var job1 = { name: "job1", job_type: "c", conditionArray: [ new JilConnection("job1", "job0", "s") ] };
    var job2 = { name: "job2", job_type: "c", conditionArray: [ new JilConnection("job2", "job1", "s"), new JilConnection("job2", "job0", "s") ] };
    var job3 = { name: "job3", job_type: "c", conditionArray: [ new JilConnection("job3", "job2", "s") ] };
    var jilArray = [ job0, job1, job2, job3 ];
    var builder = this.initBuilder(jilArray, $("#graphContainer1")[0]);
    assert.deepEqual(builder.getOutboundConnections(job0, 1), [], "out job0, true");
    assert.deepEqual(builder.getOutboundConnections(job0, 2), [], "out job0, false");
    assert.deepEqual(builder.getInboundConnections(job0, 1), [ 
        new JilConnection("job1", "job0", "s"), 
        new JilConnection("job2", "job0", "s") 
    ], "int job0, true");
    assert.deepEqual(builder.getInboundConnections(job0, 2), [ 
        new JilConnection("job1", "job0", "s"), 
        new JilConnection("job2", "job0", "s"),
        new JilConnection("job2", "job1", "s"),
        new JilConnection("job3", "job2", "s") 
    ], "int job0, false");
    assert.deepEqual(builder.getOutboundConnections(job2, 1), [ 
        new JilConnection("job2", "job1", "s"),
        new JilConnection("job2", "job0", "s") 
    ], "out job2, true");
    // job2 -> job1 should not repeat
    assert.deepEqual(builder.getOutboundConnections(job2, 2), [ 
        new JilConnection("job2", "job1", "s"),
        new JilConnection("job2", "job0", "s"),
        new JilConnection("job1", "job0", "s") 
    ], "out job2, false");
    assert.deepEqual(builder.getOutboundConnections(job3, 2), [ 
        new JilConnection("job3", "job2", "s"),
        new JilConnection("job2", "job1", "s"),
        new JilConnection("job2", "job0", "s")
    ], "out job3, false");
    assert.deepEqual(builder.getOutboundConnections(job3, 3), [ 
        new JilConnection("job3", "job2", "s"),
        new JilConnection("job2", "job1", "s"),
        new JilConnection("job2", "job0", "s"),
        new JilConnection("job1", "job0", "s") 
    ], "out job3, false");
};

// Returns the sorted array of connections having the specified type, 
// converted to pairs (source job name, target job name). 
// The array is sorted using JilConnection.compare() method. 
AllTests.prototype.getSortedConnectionsWithType = function(builder, type) {
	var plumbConnections = [];
	plumbConnections = plumbConnections.concat($.grep(jsPlumb.getConnections(), function(plumbConn) {
		return plumbConn.hasType(type);
	}));

	var sourceTargetPairs = $.map(plumbConnections, function(plumbConn) {
		return { source: builder.removeIdPrefix(plumbConn.source.id), target: builder.removeIdPrefix(plumbConn.target.id) };
	});
	return sourceTargetPairs.sort(function(a, b) {
		var sourceCompare = a.source.localeCompare(b.source);
		return sourceCompare ? sourceCompare : a.target.localeCompare(b.target);
	});
};

AllTests.prototype.testGraphBuilder_setSelectedDependencyLevel = function(assert) {
    var job0 = { name: "job0", job_type: "c", conditionArray: [] };
    var job1 = { name: "job1", job_type: "c", conditionArray: [ new JilConnection("job1", "job0", "s") ] };
    var job2 = { name: "job2", job_type: "c", conditionArray: [ new JilConnection("job2", "job1", "s"), new JilConnection("job2", "job0", "s") ] };
    var job3 = { name: "job3", job_type: "c", conditionArray: [ new JilConnection("job3", "job2", "s") ] };
    var job4 = { name: "job4", job_type: "c", conditionArray: [ new JilConnection("job4", "job3", "s") ] };
    var jilArray = [ job0, job1, job2, job3, job4 ];
    var builder = this.initBuilder(jilArray, $("#graphContainer1")[0]);
    builder.draw();
    
    // Without selected job
    builder.setSelectedDependencyLevel(0);
    assert.equal(builder.selectedDependencyLevel, 0);
    assert.equal(builder.selectedJob, null, "No selected job");
    assert.deepEqual(this.getSortedConnectionsWithType(builder, "inbound"), [], "No selected job, level 0, inbound");
    assert.deepEqual(this.getSortedConnectionsWithType(builder, "outbound"), [], "No selected job, level 0, outbound");

    builder.setSelectedJob(job2);
    builder.setSelectedDependencyLevel(1);
    assert.equal(builder.selectedDependencyLevel, 1);
    assert.deepEqual(this.getSortedConnectionsWithType(builder, "inbound"), [
        { source: "job3", target: "job2" },
	], "job2, level 1, inbound");
    assert.deepEqual(this.getSortedConnectionsWithType(builder, "outbound"), [
	    { source: "job2", target: "job0" },
	    { source: "job2", target: "job1" },
		], "job2, level 1, outbound");

    // Here we also verify how the optimised way of selecting dependencies works
    // (adding 2nd level dependencies to the previously selected 1st-level dependencies). 
    builder.setSelectedDependencyLevel(2);
    assert.equal(builder.selectedDependencyLevel, 2);
    assert.deepEqual(this.getSortedConnectionsWithType(builder, "inbound"), [
        { source: "job3", target: "job2" },
        { source: "job4", target: "job3" },
	], "job2, level 1, inbound");
    assert.deepEqual(this.getSortedConnectionsWithType(builder, "outbound"), [
        { source: "job1", target: "job0" },
	    { source: "job2", target: "job0" },
	    { source: "job2", target: "job1" },
    ], "job2, level 1, outbound");

    // Here we also verify how the optimised way of selecting dependencies works
    // (removing 2st level dependencies). 
    builder.setSelectedDependencyLevel(1);
    assert.equal(builder.selectedDependencyLevel, 1);
    assert.deepEqual(this.getSortedConnectionsWithType(builder, "inbound"), [
        { source: "job3", target: "job2" },
    ], "job2, level 1, inbound");
    assert.deepEqual(this.getSortedConnectionsWithType(builder, "outbound"), [
        { source: "job2", target: "job0" },
        { source: "job2", target: "job1" },
    ], "job2, level 1, previous level was 2, outbound");
    
    $("#" + builder.addIdPrefix("job1")).trigger("click");
    assert.equal(builder.selectedJob.name, "job1");
    assert.deepEqual(this.getSortedConnectionsWithType(builder, "inbound"), [{source:"job2", target:"job1"}], 
    	"click job1, inbound");
    assert.deepEqual(this.getSortedConnectionsWithType(builder, "outbound"), [{source:"job1", target:"job0"}],
    	"click job1, outbound");

    $("#" + builder.addIdPrefix("job2")).trigger("click");
    assert.equal(builder.selectedJob.name, "job2");
    assert.equal(builder.selectedDependencyLevel, 1);
    assert.deepEqual(this.getSortedConnectionsWithType(builder, "inbound"), [
		 { source: "job3", target: "job2" },
	], "click job2 1st time, inbound");
	 assert.deepEqual(this.getSortedConnectionsWithType(builder, "outbound"), [
		{ source: "job2", target: "job0" },
		{ source: "job2", target: "job1" },
	], "click job2 1st time, outbound");

    $("#" + builder.addIdPrefix("job2")).trigger("click");
    assert.equal(builder.selectedJob.name, "job2");
    assert.equal(builder.selectedDependencyLevel, 2);
    assert.deepEqual(this.getSortedConnectionsWithType(builder, "inbound"), [
		{ source: "job3", target: "job2" },
		{ source: "job4", target: "job3" },
	], "click job2 2nd time, inbound");
	assert.deepEqual(this.getSortedConnectionsWithType(builder, "outbound"), [
		{ source: "job1", target: "job0" },
		{ source: "job2", target: "job0" },
		{ source: "job2", target: "job1" },
	], "click job2 2nd time, outbound");

    $("#" + builder.addIdPrefix("job2")).trigger(new $.Event("click", {shiftKey: true}));
    assert.equal(builder.selectedJob.name, "job2");
    assert.equal(builder.selectedDependencyLevel, 1);
    assert.deepEqual(this.getSortedConnectionsWithType(builder, "inbound"), [
		 { source: "job3", target: "job2" },
	], "click job2 with Shift, was level2, inbound");
	 assert.deepEqual(this.getSortedConnectionsWithType(builder, "outbound"), [
		{ source: "job2", target: "job0" },
		{ source: "job2", target: "job1" },
	], "click job2 with Shift, was level2, outbound");
};

AllTests.prototype.testGraphBuilder_draw = function(assert) {
    var builder = this.initBuilder(this.testJil, $("#graphContainer1")[0]);
    builder.draw();
    expect(0);
};
