import Localbase from "localbase";
import { DataPacket } from "./data-models";

export class TableName {
    readonly name : string;

    constructor(name : string) {
        this.name = name;
    }
};

export const TABLE_NAMES : { [name : string] : TableName } = {
    team: new TableName("team"),
    player: new TableName("player"),
    playerTeams: new TableName("playerTeams"),
    retiredNumbers: new TableName("retiredNumbers"),
    position: new TableName("position"),
    college: new TableName("college")
};

const _transactionTypes : { [name : string] : string } = {
    read: "readonly",
    write: "readwrite"
};

const _dbName = "nfltools";

export async function resetDb() {
    const db = new Localbase(_dbName);
    await db.delete();
}

export async function getAllFromTable<T>(
    tableName : string, filters : { [key : string] : any } = null) 
    : Promise<T[]> {

    const db = new Localbase(_dbName);
    const data : T[] = await db.collection(tableName).get();

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

export async function getSingleFromTable<T>(
    tableName : string, filters : { [key : string] : any } = null) 
    : Promise<T> {

    const db = new Localbase(_dbName);
    const data : T = await db.collection(tableName).doc(filters).get();
    return data;
}

export async function getAllTables() : Promise<DataPacket> {
    const db = new Localbase(_dbName);
    const data = new DataPacket();
    for(let [key, tableName] of Object.entries(TABLE_NAMES)) {
        const tableData : any[] = await db.collection(tableName.name).get();
        data[tableName.name] = tableData;
    }
    return data;
}

export async function writeToTable<T>(tableName : string, data : T) {
    const db = new Localbase(_dbName);
    await db.collection(tableName).add(data);
}

export async function writeAllToTable<T>(tableName : string, data : T[]) {
    const db = new Localbase(_dbName);
    for(let i = 0; i < data.length; ++i) {
        await db.collection(tableName).add(data[i]);
    }
}

export async function updateRow<T>(
    tableName : string, filters : { [key : string] : any } = null, data : T) {

    const db = new Localbase(_dbName);
    await db.collection(tableName).doc(filters).update(data);
}

export async function deleteRows(
    tableName : string, filters : { [key : string] : any } = null) {

    const db = new Localbase(_dbName);
    await db.collection(tableName).doc(filters).delete();
}

export async function clearTable(tableName : string) {
    const db = new Localbase(_dbName);
    await db.collection(tableName).delete();
}