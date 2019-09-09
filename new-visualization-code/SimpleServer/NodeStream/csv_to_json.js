
const csvFilePath='./RawData.csv'
const fs = require('fs');
// ...
function readFile(path) {
    var fileContent;

    return new Promise(function(resolve) {
        fileContent = fs.readFileSync(path, {encoding: 'utf8'});
        var arr = fileContent.split('\n');     

        console.log(arr);

        var jsonObj = [];
        var headers = arr[0].split(',');
        for(var i = 1; i < arr.length; i++) {
        var data = arr[i].split(',');
        var obj = {};
        for(var j = 0; j < data.length; j++) {
            obj[headers[j].trim()] = data[j].trim();
        }
        jsonObj.push(obj);
        }
        resolve(jsonObj);
    });
}

var jsonObj = readFile(csvFilePath);

fs.writeFile("./RawData.json", JSON.stringify(jsonObj), (err) => {
    if (err) {
        console.error(err);
        return;
    };
    console.log("File has been created");
});
