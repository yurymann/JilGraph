"use strict";

function JilParser() {
    this.jobStartTags = [
        "insert_job",
        "insert_machine",
        "delete_job",
    ];
}

JilParser.prototype.loadJil = function(jilText) {
    var jilTextWithoutComments = removeComments(jilText);
}

JilParser.prototype.removeComments = function(jilText) {
    var commentRegexp = new RegExp("/[*]([^*]|[\r\n]|([*]+([^*/]|[\r\n])))*[*]+/", "g");
    return jilText.replace(commentRegexp, "").trim();
}

JilParser.prototype.convertToJson = function(jilText) {
    var resultText = "{\n";
    var reg = new RegExp(/^\s*\w+:.*$/gm);
    
    var match;
    var firstMatch = true;
    while((match = reg.exec(jilText)) !== null) {
        var line = match[0].replace(/\"/g, "\\\"").trim(); // Escape quotes
        var propName = line.match(/\w+:/)[0].replace(":", "");
        var propValue = line.replace(/\w+:\s*/, "").trim();
        var newText = "";
        if ($.inArray(propName, this.jobStartTags) >= 0) {
            var closingBracket = "";
            if (firstMatch) {
                firstMatch = false;
            } else {
                closingBracket = "},\n";
            }
            newText = closingBracket + this.quote(propValue) + ": " + "{\n";
        }
        else {
            newText = this.quote(propName) + ': ' + this.quote(propValue) + ',\n';
        }
        
        resultText = resultText + newText;
    }

    resultText = resultText.trim() + "\n}}";
    return resultText;
}

JilParser.prototype.quote = function(str) {
    return '"' + str + '"';
}

JilParser.prototype.insertBrackets = function(jilText) {
    var resultText = "";
    
    return resultText.trim();
}
