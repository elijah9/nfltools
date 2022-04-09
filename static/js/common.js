function genTableData(cellVal) {
    const cell = document.createElement("td");
    cell.innerText = cellVal;
    return cell;
}

function downloadFile(filename, content) {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0].replace("-", "");
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