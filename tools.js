function deleteFromArray(array, element) {
    let position = array.indexOf(element);
    array.splice(position, 1);
}

function isInArray(array, value) {
    return array.indexOf(value) > -1;
}

function tryParseJSON (jsonString){
    try {
        let o = JSON.parse(jsonString);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object", 
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) { }

    return false;
};

module.exports = 
{
    deleteFromArray, 
    isInArray, 
    tryParseJSON
}