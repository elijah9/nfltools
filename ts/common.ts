export type Position2D = {
    x : number;
    y : number;
}

export function isEmptyOrSpaces(str : string) : boolean {
    return str === null || str.match(/^ *$/) !== null;
}

export function appendTableData(parent : HTMLTableRowElement, cellVal : any, className : string = null) {
    const cell : HTMLTableCellElement = document.createElement("td");
    cell.innerText = cellVal;
    if(className !== null) {
        cell.className = className;
    }
    parent.appendChild(cell);
}

export function downloadFile(filename : string, content : string) {
    const todayStr : string = getTodayStr();
    const splitFilename : string[] = filename.split(".");
    const filenameWithDate = `${splitFilename[0]}_${todayStr}.${splitFilename[1]}`;

    const encodedUri : string = encodeURI(content);
    const link : HTMLElement = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filenameWithDate);
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
}

export function getTodayStr() : string {
    let today = new Date();
    const offset : number = today.getTimezoneOffset();
    today = new Date(today.getTime() - (offset*60*1000));
    return today.toISOString().split("T")[0].replace(/-/g, "");
}

export async function showLoadingIndicator(work : () => void) {
    document.getElementById("loading-indicator").style.display = "table";
    await work();
    document.getElementById("loading-indicator").style.display = "none";
}

export function shallowEqual(object1 : object, object2 : object) : boolean {
    const keys1 : string[] = Object.keys(object1);
    const keys2 : string[] = Object.keys(object2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (let key of keys1) {
        if (object1[key] !== object2[key]) {
            return false;
        }
    }
    return true;
}