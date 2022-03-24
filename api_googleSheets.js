const {google} = require("googleapis");
const keys = require("./credentials.google.json");

/*Links
https://www.youtube.com/watch?v=MiPpQzW_ya0
https://developers.google.com/sheets/api/quickstart/nodejs
https://developers.google.com/sheets/api/guides/values
https://developers.google.com/sheets/api/samples/writing
*/

const spreadsheetId = "1J_EM6n8Aog6OutM_P0MgLrMRaMupZJ7nt5mdQTpoHjI";

async function authorize() {
    const client = new google.auth.JWT(
        keys.client_email,
        null,
        keys.private_key,
        ["https://www.googleapis.com/auth/spreadsheets"]
    );
    client.authorize((err,tokens)=>{        
        if(err){
            console.log(err);
            return err; //this return will get us out of the 'if' at this point.
        }else{
            return "Connected succesfully";            
        }
    });
    return client;
};

async function getMetaData() {
    const client = await authorize();
    const gsapi = google.sheets({
        version: "v4",
        auth: client,
    });
    try{
        const metadata = await gsapi.spreadsheets.get({
            spreadsheetId
        })
        return metadata;
    }catch (err) {
        return err;
    }
}

async function generateBlankRows(blankRows,sheetId) {
    const client = await authorize();
    const gsapi = google.sheets({
        version: "v4",
        auth: client,
    }); //conecction established

    let requestOptions = {
        spreadsheetId: spreadsheetId,
        resource: {
            requests: [
                {
                    "insertDimension": {
                      "range": {
                        "sheetId": "",
                        "dimension": "ROWS",
                        "startIndex": 1,
                        "endIndex": null
                      },
                      "inheritFromBefore": true
                    }
                }                
            ]
          },
    }
    requestOptions.resource.requests[0].insertDimension.range.sheetId = sheetId;
    requestOptions.resource.requests[0].insertDimension.range.endIndex = blankRows + 1;

    try {        
        let response = await gsapi.spreadsheets.batchUpdate(requestOptions);
        //console.log("Blank rows generated succesfuly"); 
        return response; 
    }catch (err) {
        return err;
    }
};
    
async function updateData(dataRowsArray,sheetName) {
    const client = await authorize();
    const gsapi = google.sheets({
        version: "v4",
        auth: client,
    }); //conecction established    
    
    let requestOptions = {
        spreadsheetId: spreadsheetId,
        range: "",
        valueInputOption: "USER_ENTERED",                
        resource: { 
            values: dataRowsArray
        }    
    };

    requestOptions.range = sheetName + "!A2";

    try {        
        let response = await gsapi.spreadsheets.values.update(requestOptions).data;
        //console.log("data uploaded succesfully");
        return response
    }catch (err) {
        return err;
    }
};

async function getDataRows(sheetName,range) {
    const client = await authorize();
    const gsapi = google.sheets({
        version: "v4",
        auth: client,
    });

    let requestOptions = {
        spreadsheetId: spreadsheetId,
        range:  sheetName.concat('!',range)
    };

    let data = await gsapi.spreadsheets.values.get(requestOptions);
    //console.log(data.data.values)
    return data.data.values
};

function getSheetId(sheetName) {
    return new Promise((resolve,reject) =>{
        getMetaData().then((values) => {
            let sheets = values.data.sheets;
            let isThereAMatch = false;
            for (let i = 0; i < sheets.length; i++) {
                if (sheets[i].properties.title == sheetName) {
                    //console.log("match")
                    resolve(sheets[i].properties.sheetId);
                    isThereAMatch = true;
                }
            };      
            if (isThereAMatch == false){
                reject("Error: sheet name doesn't match any sheet in the spreadsheets. Please, try another name.");
            }
        });
    }); 
};

function pushData(sheetName,dataRowsArray){
    getSheetId(sheetName).then((value) => {
        generateBlankRows(dataRowsArray.length,String(value)).then((values) => {
            //console.log(JSON.stringify(values,null,2));
            updateData(dataRowsArray,sheetName).then((value) => {
                console.log("Data uploaded to " + sheetName);
            }, (err) => {
                throw new Error("Error in 'updateData'" + "\n" + err);                    
            });
        },(err) => {            
            throw new Error("Error in 'generateBlankRows'" + "\n" + err);
        });
    }, (err) => {
        throw new Error(err);
    });
};

module.exports = {
    pushData
};