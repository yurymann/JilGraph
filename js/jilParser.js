"use strict";

var jobStartTags = [
"insert_job",
"insert_machine",
"delete_job",
];

function loadJil(jilText) {
    var jilTextWithoutComments = removeComments(jilText);
}

function removeComments(jilText) {
    var commentRegexp = new RegExp("/[*]([^*]|[\r\n]|([*]+([^*/]|[\r\n])))*[*]+/", "g");
    return jilText.replace(commentRegexp, "").trim();
}

function quoteValues(jilText) {
    var resultText = "{\n";
    var reg = new RegExp(/^\s*\w+:.*$/gm);
    
    var match;
    var firstMatch = true;
    while((match = reg.exec(jilText)) !== null) {
        var line = match[0].replace(/\"/g, "\\\"").trim(); // Escape quotes
        var propName = line.match(/\w+:/)[0].replace(":", "");
        var propValue = line.replace(/\w+:\s*/, "").trim();
        
        if ($.inArray(propName, jobStartTags) >= 0) {
            var closingBracket = "";
            if (firstMatch) {
                firstMatch = false;
            } else {
                closingBracket = "}\n";
            }
            propName = closingBracket + "{\n" + propName;
        }
        
        resultText = resultText + propName + ': "' + propValue + '",' + '\n';
    }

    resultText = resultText.trim() + "\n}}";
    return resultText;
}

function insertBrackets(jilText) {
    var resultText = "";
    
    return resultText.trim();
}
