const TABLE_NAMES = {
    team: "team",
    player: "player",
    playerTeams: "playerTeams",
    retiredNumbers: "retiredNumbers",
    position: "position",
    college: "college"
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

async function getAllFromTable(tableName, filters=null) {
    const db = new Localbase(_dbName);
    const data = await db.collection(tableName).get();

    if(filters === null) {
        return data;
    } else {
        return data.filter(function (v) {
            for(let [filterKey, filterVal] of Object.entries(filters)) {
                if(v[filterKey] !== filterVal) {
                    return false;
                }
            }
            return true;
        })
    }
}

async function getSingleFromTable(tableName, filters) {
    const db = new Localbase(_dbName);
    const data = await db.collection(tableName).doc(filters).get();
    return data;
}

async function getAllTables() {
    const db = new Localbase(_dbName);
    const data = {};
    for(let [key, tableName] of Object.entries(TABLE_NAMES)) {
        const tableData = await db.collection(tableName).get();
        data[tableName] = tableData;
    }
    return data;
}

async function writeAllToTable(tableName, data) {
    console.log({tableName, data});
    const db = new Localbase(_dbName);
    for(let i = 0; i < data.length; ++i) {
        await db.collection(tableName).add(data[i]);
    }
}