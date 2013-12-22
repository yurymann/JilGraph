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
    var reg = new RegExp(/^\s*\w+:.*$/g);   
    var match;
    while((match = reg.exec(jilText)) !== null) {
        alert(match);
    }

    //return resultText;
}