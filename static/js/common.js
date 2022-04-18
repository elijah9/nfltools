function appendTableData(parent, cellVal, className=null) {
    const cell = document.createElement("td");
    cell.innerText = cellVal;
    if(className !== null) {
        cell.className = className;
    }
    parent.appendChild(cell);
}

function downloadFile(filename, content) {
    const todayStr = getTodayStr();
    const splitFilename = filename.split(".");
    const filenameWithDate = `${splitFilename[0]}_${todayStr}.${splitFilename[1]}`;

    var encodedUri = encodeURI(content);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filenameWithDate);
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
}

function getTodayStr() {
    let today = new Date();
    const offset = today.getTimezoneOffset();
    today = new Date(today.getTime() - (offset*60*1000));
    return today.toISOString().split("T")[0].replace(/-/g, "");
}

async function showLoadingIndicator(work) {
    document.getElementById("loading-indicator").style.display = "table";
    await work();
    document.getElementById("loading-indicator").style.display = "none";
}