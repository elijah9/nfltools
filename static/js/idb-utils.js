const TABLE_NAMES = {
    team: "team",
    player: "player"
};

const _transactionTypes = {
    read: "readonly",
    write: "readwrite"
};

const _dbName = "nfltools";

function resetDb() {
    let deleteRequest = indexedDB.deleteDatabase(_dbName);
    deleteRequest.onsuccess = function() {
        console.log("deleted successfully?");
        initDb();
    };
}

function openDb(callback) {
    let openRequest = indexedDB.open(_dbName, 1);
    openRequest.onsuccess = function() {
        callback(openRequest.result);
    }
}

function writeToStore(tableName, data) {
    openDb(function(db) {
        let transaction = db.transaction(tableName, _transactionTypes.write);
        let objectStore = transaction.objectStore(tableName);
        objectStore.add(data);
    });
}

function writeAllToStore(tableName, data) {
    openDb(function(db) {
        let transaction = db.transaction(tableName, _transactionTypes.write);
        let objectStore = transaction.objectStore(tableName);
        for(let i = 0; i < data.length; ++i) {
            objectStore.add(data[i]);
        }
    });
}

function deleteFromStore(tableName, key) {
    openDb(function(db) {
        let transaction = db.transaction(tableName, _transactionTypes.write);
        let objectStore = transaction.objectStore(tableName);
        objectStore.delete(key);
    });
}

function readAllFromStore(tableName, callback) {
    openDb(function(db) {
        let transaction = db.transaction(tableName, _transactionTypes.read);
        let objectStore = transaction.objectStore(tableName);
        let getAllRequest = objectStore.getAll();
        getAllRequest.onsuccess = function() {
            callback(getAllRequest.result);
        }
    });
}

function initDb() {
    if (!window.indexedDB) {
        throw new Error("IndexedDB isn't working :/");
    }

    let openRequest = indexedDB.open(_dbName, 1);
    openRequest.onupgradeneeded = function() {
        let db = openRequest.result;
        
        // create object stores
        if (!db.objectStoreNames.contains(TABLE_NAMES.team)) {
            db.createObjectStore(TABLE_NAMES.team, { keyPath: "teamId", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(TABLE_NAMES.player)) {
            db.createObjectStore(TABLE_NAMES.player, { keyPath: "playerId", autoIncrement: true });
        }
    };
}