// In mongosh
db.stores.insertOne({ name: "Raja Rani Michigan", slug: "rajarani-michigan", address: "", latitude: 41.718731, longitude: -86.900902, active: true, createdAt: new Date(), updatedAt: new Date() });
db.stores.insertOne({ name: "Raja Rani Qatar", slug: "rajarani-qatar", address: "", latitude: 25.276987, longitude: 51.527494, active: true, createdAt: new Date(), updatedAt: new Date() });


const storeId = "rajarani-michigan";
db.menus.updateMany({ storeId: { $exists: false } }, { $set: { storeId } });
db.orders.updateMany({ storeId: { $exists: false } }, { $set: { storeId } });
db.printers.updateMany({ storeId: { $exists: false } }, { $set: { storeId } });
db.settings.updateMany({ storeId: { $exists: false } }, { $set: { storeId } });
db.registrations.updateMany({ storeId: { $exists: false } }, { $set: { storeId } });
db.orders.dropIndex("orderNumber_1");
