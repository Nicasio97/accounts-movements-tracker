const https = require("https");
const baseUrl = "ebanking.brou.com.uy";

/*ENDPOINTS
to add to the baseUrl

All endpoints belongs to eBROU web
*/
const endpoint_loginStep1 = "/api/v1/execute/session.login.step1";
const endpoint_loginStep3 = "/api/v1/execute/session.login.step3";
const endpoint_getAccounts = "/api/v1/execute/widgets.accounts"
const endpoint_listStatements = "/api/v1/execute/accounts.listStatements";
const endpoint_logOut = "/api/v1/execute/session.logout";

/*PAYLOADS
for the requests executed by the functions above.
Payloads needed: 
(1) to send the request to obtain the exchange token.
(2) to send as default content (if you don't send it, the request failed)
*/
var payload_for_exchange_token = {
    "channel": "frontend",
    "lang": "es",    
    "usernameLogin": "UY-CI-",
    "_captcha": "",
    "_password": ""
};
var payload_default = {
    "lang": "es"
};
var payload_get_movements = {
    "dateFrom": null,
    "dateTo": null,
    "idAccount": "d4db84c42faf244ec255e55436d9cbdc8a463bf3",
    "thirdFundData": false,
    "type": 0
};
var payload_logOut = {
    "channel": "frontend",
    "lang": "es",
    "_accessToken": ""
};

/*FUNCTIONS
*/
const getExchangeToken = (user,password) => {
    let data = "";    
    let body = payload_for_exchange_token;
    body.usernameLogin = payload_for_exchange_token.usernameLogin + user;
    body._password = password;
    body = JSON.stringify(body)

    let options = {
        hostname: baseUrl,
        port: 443,
        path: endpoint_loginStep1,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
    }

    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            if (res.statusCode == 200){                
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {                    
                    let parsedData = JSON.parse(data);
                    resolve(parsedData.data._exchangeToken);
                })                                
            }else{
                reject("Error in request getExchangeToken: " + res.statusCode + ". Wrong user or password")
            }            
        })

        req.on("error", (e)=>{
            console.error(`problem with request: ${e.message}`);
        });
        req.write(body);
        req.end();
    }); 
};

const getBearerToken = (exchangeToken) => {
    let data = "";    
    let body = JSON.stringify(payload_default);
    
    let options = {
        hostname: baseUrl,
        port: 443,
        path: endpoint_loginStep3,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'authorization': "exchange "
        }
    }
    options.headers.authorization = options.headers.authorization + exchangeToken;
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            if (res.statusCode == 200){                
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    //resolve(JSON.parse(data));
                    let parsedData = JSON.parse(data);
                    resolve(parsedData.data._accessToken);
                })                                
            }else{
                reject("Error in request getBearerToken: " + res.statusCode)
            }            
        })

        req.on("error", (e)=>{
            console.error(`problem with request: ${e.message}`);
        });
        req.write(body);
        req.end();
    }); 
};

const getAccountId = (bearerToken,bankAccount) => {
    let data = "";    
    let body = {};

    body = JSON.stringify(body);
    
    let options = {
        hostname: baseUrl,
        port: 443,
        path: endpoint_getAccounts,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'authorization': "bearer "
        }
    }
    options.headers.authorization = options.headers.authorization + bearerToken;
  
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            if (res.statusCode == 200){                
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    let parsedData = JSON.parse(data).data.accounts;
                    let isThereAMatch = false;
            
                    for (let i = 0; i < parsedData.length; i++){
                        if (parsedData[i].numberSuboperation == bankAccount){                            
                            isThereAMatch = true;
                            resolve(parsedData[i].idProduct/*{
                                bearerToken,
                                accountId: parsedData[i].idProduct
                            }*/);
                        }
                    }
                    if (isThereAMatch == false){
                        throw new Error("account name doesn't match any account in your bank account");
                    }
                })                                
            }else{
                reject("Error in request getBearerToken: " + res.statusCode)
            }            
        })

        req.on("error", (e)=>{
            console.error(`problem with request: ${e.message}`);
        });
        req.write(body);
        req.end();
    });
};

const getMovementsFromAccount = (bearerToken,accountId,_dateFrom,_dateTo) => {
    let data = "";    
    let body = payload_get_movements;
    
    body.dateFrom = _dateFrom; //yyyy-mm-dd
    body.dateTo = _dateTo;
    body.idAccount = accountId;
    body = JSON.stringify(body);
    
    let options = {
        hostname: baseUrl,
        port: 443,
        path: endpoint_listStatements,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'authorization': "bearer "
        }
    }
    options.headers.authorization = options.headers.authorization + bearerToken;

    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            if (res.statusCode == 200){                
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve(JSON.parse(data));
                })                                
            }else{
                reject("Error in request getBearerToken: " + res.statusCode)
            }            
        })

        req.on("error", (e)=>{
            console.error(`problem with request: ${e.message}`);
        });
        req.write(body);
        req.end();
    });
};

const logOut = (bearerToken) => {
    let body = payload_logOut;
    body._accessToken = body._accessToken + bearerToken;
    body = JSON.stringify(body);
    
    let options = {
        hostname: baseUrl,
        port: 443,
        path: endpoint_logOut,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),          
        }
    }
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            if (res.statusCode == 200){                                
                resolve("succesful log out");                                                
            }else{
                reject("Error in request getBearerToken: " + res.statusCode)
            }            
        })

        req.on("error", (e)=>{
            console.error(`problem with request: ${e.message}`);
        });

        req.write(body);
        req.end();
    });
};

module.exports = {
    getExchangeToken, 
    getBearerToken,
    getAccountId, 
    getMovementsFromAccount,         
};