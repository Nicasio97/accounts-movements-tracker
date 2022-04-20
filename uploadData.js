const c = require("./credentials.accounts.json");
const apiGoogleSheet = require("./api_googleSheets");
const brou = require("./api_brou");

brou.getExchangeToken(c.brou.user,c.brou.password).then((exchangeToken) => {    
    brou.getBearerToken(exchangeToken).then((bearerToken)=>{                
        
        brou.getAccountId(bearerToken,c.brou.accountsNumbers.uyu).then((object)=>{            
            brou.getMovementsFromAccount(object.bearerToken,object.accountId,"2022-02-01","2022-02-25").then((value)=>{                                        
                let dataRowsArray = extractFields(value.data.statements);
                console.log(dataRowsArray);
                //apiGoogleSheet.pushData("ebrou_usd",dataRowsArray);
            },(err)=>{
                throw new Error(err);
            });
        },(err)=>{
            throw new Error(err);
        });

        brou.getAccountId(bearerToken,c.brou.accountsNumbers.usd).then((object)=>{            
            brou.getMovementsFromAccount(object.bearerToken,object.accountId,"2022-02-01","2022-02-25").then((value)=>{                                        
                let dataRowsArray = extractFields(value.data.statements);
                console.log(dataRowsArray);
                //apiGoogleSheet.pushData("ebrou_usd",dataRowsArray);
            },(err)=>{
                throw new Error(err);
            });
        },(err)=>{
            throw new Error(err);
        });

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