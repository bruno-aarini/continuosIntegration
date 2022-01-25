const debug = require('debug')('srv:catalog-service');
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const xsenv = require('@sap/xsenv')
const objectStoreConfig = xsenv.getServices({
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
            debug(each.comments, {"country": each.country, "amount": each.amount});
        } else if (each.amount < 150) {
            each.criticality = 1;
        } else {
            each.criticality = 2;
        }
    });

    this.on('boost', async req => {
        try {
            // const ID = req.params[0];
            // const tx = cds.tx(req);
            // await tx.update(Sales)
            //     .with({ amount: { '+=': 250 }, comments: 'Boosted!' })
            //     .where({ ID: { '=': ID } })
            //     ;
            // debug('Boosted ID:', ID);

            //=======================================
            const credentials = objectStoreConfig
            const account = credentials.account_name
            const accountKey = credentials.sas_token
          
            // Use StorageSharedKeyCredential with storage account and account key
            // StorageSharedKeyCredential is only avaiable in Node.js runtime, not in browsers
            const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);

            const blobServiceClient = new BlobServiceClient(
                // When using AnonymousCredential, following url should include a valid SAS or support public access
                `https://${account}.blob.core.windows.net`,
                sharedKeyCredential
              );

            let i = 1;
            for await (const container of blobServiceClient.listContainers()) {
                console.log(`Container ${i++}: ${container.name}`);
            }

            //=======================================

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