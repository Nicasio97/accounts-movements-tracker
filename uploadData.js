const c = require("./credentials.accounts.json");
const apiGoogleSheet = require("./api_googleSheets");
const brou = require("./api_brou");

const initialDate = '2020-12-01';
let dateTo = new Date().toJSON().slice(0,10); //Current date. Format: yyyy-mm-dd;

brou.getExchangeToken(c.brou.user,c.brou.password).then((exchangeToken) => {    
    brou.getBearerToken(exchangeToken).then((bearerToken)=>{                
       
        let ebrou_accounts = [{
            sheetName: 'ebrou_uyu',
            accountNumber: c.brou.accountsNumbers.uyu
        },{
            sheetName: 'ebrou_usd',
            accountNumber: c.brou.accountsNumbers.usd
        }];

        for (let i = 0; i < ebrou_accounts.length; i++) {            
            brou.getAccountId(bearerToken,ebrou_accounts[i].accountNumber).then((accountId)=>{                                                        
                apiGoogleSheet.getDataRows(ebrou_accounts[i].sheetName,'A1:Z1').then((titles) => {                    
                    if (titles === undefined) {
                        throw new Error("Couldn't communicate with the sheet or the range doesn't contain data. Are you connected to internet?")
                    } else {                        
                        apiGoogleSheet.getDataRows( ebrou_accounts[i].sheetName,'A2:G2').then((rows) => {                                                                    
                            if (rows === undefined) {
                                /*
                                *No elements in the selected range (nither in the sheet), extract and upload every account movement
                                *console.log(rows) return 'undefined'
                                *
                                *There is a limit in the requested array of movements to the brou database. Aprox 650. I asume that 
                                *the limit isn't exedeed each month
                                * 
                                */

                                let datesArray = getDateRangeArray(initialDate,dateTo);                                                                
                                let movementsArray = [];
                                console.log("NO habian movimientos en: " + ebrou_accounts[i].sheetName);
                                    
                                /*
                                *In order to view the newest movements at the top of the gsheet, 
                                *the order of movements in the array must be from newest to oldest (position 0 to n)
                                * */
                                (async function () {
                                    for (let k = datesArray.length-1, resp = "default"; k >= 0; k--) {
                                        resp = await brou.getMovementsFromAccount(bearerToken,accountId,datesArray[k][0],datesArray[k][1]);                                        
                                        movementsArray = movementsArray.concat(extractFields(resp.data.statements))                                       
                                    }                                                                        
                                    apiGoogleSheet.pushData(ebrou_accounts[i].sheetName,movementsArray);    
                                })();
                                  
                                
                            } else {                
                                /*
                                * There is at least one movement in the sheet, ONLY extracat an upload new movements
                                * I asume that the limit of movements isn't exedeed when i do another movements extraction
                                *
                                * */ 
                                brou.getMovementsFromAccount(bearerToken,accountId,rows[0][0],dateTo).then((value)=>{                                    
                                    let newArray = [ ];
                                    let dataRowsArray = extractFields(value.data.statements); /*what if this return undefined?*/
                                    
                                    console.log("there were already movements on: " + ebrou_accounts[i].sheetName)
                                    
                                    for(let i = 0; i < dataRowsArray.length; i++) { 	
                                        if(!(dataRowsArray[i][0] == rows[0][0] && dataRowsArray[i][6] == rows[0][6])){
                                            newArray.push(dataRowsArray[i])
                                        }else{                                            
                                            /*
                                            *There's a match
                                            *Don't save it and nither save next movements
                                            */                                            
                                            break
                                        }
                                    }                                                                                                 
                                    apiGoogleSheet.pushData(ebrou_accounts[i].sheetName,newArray);                                    
                                },(err)=>{
                                    throw new Error(err);    
                                });                                
                            }
                        }, (err) => {
                            throw new Error(err);
                        });     
                    };
                }, (err) => {
                    throw new Error(err);
                });                     
            },(err)=>{
                throw new Error(err);
            });
        };
       
    },(err)=>{
        throw new Error(err);
    });
},(err)=>{
    throw new Error(err);
});
 
function extractFields(arrayMovements) {
    let dataRowsArray = [];                    
    for (let i = 0; i < arrayMovements.length; i++) {                    
        let date = arrayMovements[i].date.split("T")[0];
        let hour = arrayMovements[i].date.split("T")[1].split(".")[0];
        let concept = arrayMovements[i].concept
        let reference = arrayMovements[i].reference
        let debit = arrayMovements[i].debit
        let credit = arrayMovements[i].credit
        let documentNumber = arrayMovements[i].documentNumber
        
        let row = [date,hour,concept,reference,debit,credit,documentNumber];
        dataRowsArray.push(row);
    };      
    return dataRowsArray
}

let getDateRangeArray = (d1,d2) => {
    let initialYear = d1.split('-')[0];
    let initialMonth = d1.split('-')[1];
    let initialDay = d1.split('-')[2];
    let finalYear = d2.split('-')[0];
    let finalMonth = d2.split('-')[1];
    let finalDay = d2.split('-')[2];

    let dayTo = '';

    let monthsLength = [31,28,31,30,31,30,31,31,30,31,30,31];
    let dateRangesArray = [];

    while (initialYear <= finalYear  && !(initialYear == finalYear && initialMonth > finalMonth)) {
    
        dayTo = (monthsLength[initialMonth-1]);
        if(initialYear == finalYear && initialMonth == finalMonth){
            dayTo = finalDay;
        }

        dateRangesArray.push([(initialYear + '-' + initialMonth + '-' + initialDay),(initialYear + '-' + initialMonth + '-' + dayTo)]);
    
        initialMonth++    
        initialDay = '01'

        if ((initialMonth-1) % 12 == 0 && initialYear <= finalYear){    
            initialYear++    
        }

        initialMonth = (new Date(initialYear,   initialMonth-1    ,initialDay).getMonth()+1).toString();
    
        if(initialMonth.split('').length == 1){
            initialMonth = '0' + initialMonth;
        }
    }
    return dateRangesArray;
}