const TABLE_NAMES = {
    team: "team",
    player: "player"
};

const _transactionTypes = {
    read: "readonly",
    write: "readwrite"
};

const _dbName = "nfltools";

async function resetDb() {
    const db = new Localbase(_dbName);
    await db.delete();
}

async function getAllFromTable(tableName) {
    const db = new Localbase(_dbName);
    const data = await db.collection(tableName).get();
    return data;
}

async function writeAllToTable(tableName, data) {
    const db = new Localbase(_dbName);
    for(let i = 0; i < data.length; ++i) {
        await db.collection(tableName).add(data[i]);
    }
}