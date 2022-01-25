const debug = require('debug')('srv:catalog-service');
const { BlobServiceClient, AnonymousCredential } = require("@azure/storage-blob");
const xsenv = require('@sap/xsenv')
const credentials = xsenv.getServices({
    objectstore: 's4h-bps-object-store'
}).objectstore




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
                `https://${account}.blob.core.windows.net?${accountSas}`,
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