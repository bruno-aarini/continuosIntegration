const debug = require('debug')('srv:catalog-service');
const { BlobServiceClient, AnonymousCredential } = require("@azure/storage-blob");
const xsenv = require('@sap/xsenv')
const SapCfAxios = require('sap-request-helpers').default
const s4h = SapCfAxios(`s4h_development_basic`)
const SapCfAxios2 = require('sap-cf-axios').default;
const cpi = SapCfAxios( /* destination name */ "s4h_development_basic", /* axios default config */ null, /* xsrfConfig */ {method: 'get', url:'/SPOSEA/PRJ_ADMIN_CDS/xSPOSEAxPRJ_ADMIN?sap-client=200'});
const _ = require('lodash')
const credentials = xsenv.getServices({
    objectstore: 's4h-bps-object-store'
}).objectstore


const fetchCSRFS4H = async (req) => {
    try {
        let authorization
        if (req.headers.authorization) {
            console.log('=================TOKEN')
            console.log(req.headers.authorization)
            authorization = req.headers.authorization;
        }
        let response
        const csrf = async (req) => {
            response = await s4h({
                method: "get",
                url: "/SPOSEA/PRJ_ADMIN_CDS/xSPOSEAxPRJ_ADMIN?sap-client=200",
                headers: {
                    "content-type": "application/json",
                    "X-CSRF-Token": 'Fetch',
                    authorization
                }
            })
            return response
        }
        try {
            console.log(`------------- 1 - Fetching token ---------`)
            response = await csrf(req)
        } catch (e1) {
            try {
                console.log(e1.config)
                console.log(`------------- 2 - Fetching token ---------`)
                response = await csrf(req)
            } catch (e2) {
                try {
                    console.log(`------------- 3 - Fetching token ---------`)
                    response = await csrf(req)
                } catch (e3) {
                    try {
                        console.log(`------------- 4 - Fetching token ---------`)
                        response = await csrf(req)
                    } catch (e4) {
                        console.log(`------------- 5 - Fetching token ---------`)
                        response = await csrf(req)
                    }
                }
            }
        }
        return {
            "content-type": "application/json",
            "accept": "application/json",
            "x-csrf-token": response.headers["x-csrf-token"]
        }
    } catch (error) {
        console.log('=====Error fetchCSRF', error)
        if (_.get(error, 'config.jar.store')) {
            await error.config.jar.store.removeAllCookies((err) => {
                console.log('=========Remove Cookies Error')
                console.log(error.config.jar.toJSON())
            })
        }
        console.log(error.config)
    }
}


const fetchCSRFS4H2 = async (req) => {
    try {
        const response = await cpi({
            method: 'POST',
            url: '/Bookset',
            headers: {
                "content-type": "application/json"
            },
                data: {
                title: "Using Axios in SAP Cloud Foundry",
                author: "Joachim Van Praet"
            },
            xsrfHeaderName: "X-CSRF-Token",
            data: {vatNumber},
        });
    } catch (error) {
        console.log('=====Error fetchCSRF2', error)
    }
}


module.exports = cds.service.impl(async function () {


    const {
        Sales
    } = this.entities;

    this.after('READ', Sales, (each) => {
        if (each.amount > 500) {
            each.criticality = 3;
            if (each.comments === null)
                each.comments = '';
            else
                each.comments += ' ';
            each.comments += 'Exceptional!';
            debug(each.comments, { "country": each.country, "amount": each.amount });
        } else if (each.amount < 150) {
            each.criticality = 1;
        } else {
            each.criticality = 2;
        }
    });

    this.on('boost', async req => {
        try {
            console.log('========= Credentials', credentials)

            // const sharedKeyCredential = new StorageSharedKeyCredential(credentials.account_name, credentials.sas_token);
            // const blobServiceClient = new BlobServiceClient(
            //     `https://${credentials.account_name}.blob.core.windows.net`,
            //     sharedKeyCredential
            // );

            // //const containerName = 'city-images';
            // const containerClient = blobServiceClient.getContainerClient(credentials.container_name);

            // await containerClient.setAccessPolicy('blob');

            // async function getAllBlobs() {
            //     let blobs = [];
            //     let iter = await containerClient.listBlobsFlat();
            //     for await (const blob of iter) {
            //       blobs.push(blob);
            //     }
            //     return blobs;
            //   }

            // const blobs = await getAllBlobs().catch(err => {
            //     console.log('=====Error')
            //     console.log(err)
            //   });
            //   console.log('=====Result')
            //   console.log(blobs)

            const account = credentials.account_name
            const accountSas = credentials.sas_token

            const blobServiceClient = new BlobServiceClient(
                // When using AnonymousCredential, following url should include a valid SAS or support public access
                //`https://${account}.blob.core.windows.net?${accountSas}`,
                'https://sapcpjkqynhjh3sjwtnzpcsf.blob.core.windows.net/sapcp-osaas-3247dd17-f699-4d9e-9017-9a6596a0fd49-zrs/test?sig=pnj7Ry3dDQ0Vw7Ia10WDD%2FTBv3vDFui7AHrT0MmPoTs%3D&sv=2019-02-02&spr=https&si=4919ff19-29c8-4732-9b98-371824afa8bf&sr=c',
                new AnonymousCredential()
            );
            console.log("Containers:");
            for await (const container of blobServiceClient.listContainers()) {
                console.log(`- ${container.name}`);
            }

            return {};
        } catch (err) {
            console.error(err);
            return {};
        }
    });


    this.on('topSales', async (req) => {
        try {
            const tx = cds.tx(req);
            const results = await tx.run(`CALL "APP_DB_SP_TopSales"(?,?)`, [req.data.amount]);
            return results;
        } catch (err) {
            console.error(err);
            return {};
        }
    });

    this.on('callBackend', async (req) => {
        try {
            const input = req.data
            console.log(input)
            
            const headers = await fetchCSRFS4H(req)
            let response =  await s4h({
                method: input.methodInput,
                url: input.URL,
                headers,
                data: input.dataInput
            })
            await response.config.jar.store.removeAllCookies((err)=>{
                console.log('=========Remove Cookies')
                console.log(response.config.jar.toJSON())
             })
        
            return {'response': {'data': response.data}}
        } catch (err) {
            console.error(err);
            return {};
        }
    });

    this.on('callBackend2', async (req) => {
        try {
            const input = req.data
            console.log(input)
            
            // const headers = await fetchCSRFS4H(req)
            // let response =  await s4h({
            //     method: input.methodInput,
            //     url: input.URL,
            //     headers,
            //     data: input.dataInput
            // })

            const response = await cpi({
                method: input.methodInput,
                url: input.URL,
                headers: {
                    "content-type": "application/json"
                },
                data: input.dataInput,
                xsrfHeaderName: "X-CSRF-Token"
            });
           
            if (response){
                console.log('======Reponse code', response.code)
                console.log('======Reponse data', response.data)
                console.log('======Reponse header', response.headers["x-csrf-token"])
            }
            
            return {'response': {'data': response.data}}
        } catch (err) {
            console.error(err.message);
            console.error(err.code);
            console.log('======Reponse config', err.config)
            return {};
        }
    });



    this.on('userInfo', req => {
        let results = {};
        results.user = req.user.id;
        if (req.user.hasOwnProperty('locale')) {
            results.locale = req.user.locale;
        }
        results.scopes = {};
        results.scopes.identified = req.user.is('identified-user');
        results.scopes.authenticated = req.user.is('authenticated-user');
        results.scopes.Viewer = req.user.is('Viewer');
        results.scopes.Admin = req.user.is('Admin');
        return results;
    });

});