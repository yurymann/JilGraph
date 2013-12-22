"use strict";

function loadJil(jilText) {
    var jilTextWithoutComments = removeComments(jilText);
}

function removeComments(jilText) {
    //var commentRegexp = new RegExp("/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+/", "g");
    var commentRegexp = new RegExp("/[*]([^*]|[\r\n]|([*]+([^*/]|[\r\n])))*[*]+/", "g");
    return jilText.replace(commentRegexp, "").trim();
}

function quoteValues(jilText) {
    var resultText = "";
    var reg = new RegExp(/^\s*\w+:.*$/gm);
    
    var match;
    //for (var match in matches) {
    while((match = reg.exec(jilText)) !== null) {
        var line = match[0].replace(/\"/g, "\\\"").trim(); // Escape quotes
        var propName = line.match(/\w+:/)[0];
        var propValue = line.replace(/\w+:\s*/, "").trim();
        
        resultText = resultText + propName + ' "' + propValue + '",' + '\n';
    }

    return resultText.trim();
}