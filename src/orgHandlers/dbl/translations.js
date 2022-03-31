import path from "path";
import fse from "fs-extra";
import jszip from "jszip";
import {ptBookArray} from "proskomma-utils";
import appRootPath from "app-root-path";
const appRoot = appRootPath.toString();

async function getTranslationsCatalog() {

    const http = await import(`${appRoot}/src/lib/http.js`);

    const catalogResponse = await http.getText('https://app.thedigitalbiblelibrary.org/entries/_public_domain_entries_tabledata.json');
    const catalogData = Object.values(catalogResponse.data.aaData);
    const catalog = catalogData.map(t => ({
        id: t[0],
        languageCode: t[2],
        languageName: t[1],
        title: t[4],
        description: t[4],
        copyright: t[5],
        downloadURL: `https://app.thedigitalbiblelibrary.org/entry?id=${t[0]}`,
    }));
    return catalog;
}

const fetchUsfm = async (org) => {throw new Error(`USFM fetching is not supported for ${org.name}`)};

const fetchUsx = async (org, trans) => {

    const http = await import(`${appRoot}/src/lib/http.js`);
    const transPath = path.resolve(appRoot, 'data', org.translationDir, 'translations', trans.id);
    if (!fse.pathExistsSync(transPath)) {
        fse.mkdirsSync(transPath);
    }
    const entryInfoResponse = await http.getText(trans.downloadURL);
    const licenceId = entryInfoResponse.data.replace(/[\S\s]+license=(\d+)[\S\s]+/, "$1");
    const downloadResponse = await http.getBuffer(`https://app.thedigitalbiblelibrary.org/entry/download_archive?id=${trans.id}&license=${licenceId}&type=release`);
    const usxBooksPath = path.join(transPath, 'usxBooks');
    if (!fse.pathExistsSync(usxBooksPath)) {
        fse.mkdirsSync(usxBooksPath);
    }
    const zip = new jszip();
    await zip.loadAsync(downloadResponse.data);
    for (const bookName of ptBookArray) {
        const foundFiles = zip.file(new RegExp(`release/USX_1/${bookName.code}[^/]*.usx$`, 'g'));
        if (foundFiles.length === 1) {
            const fileContent = await foundFiles[0].async('text');
            fse.writeFileSync(path.join(usxBooksPath, `${bookName.code}.usx`), fileContent);
        }
    }
};

export { getTranslationsCatalog, fetchUsfm, fetchUsx }