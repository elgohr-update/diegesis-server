const path = require("path");
const fse  = require("fs-extra");
const jszip = require("jszip");
const {ptBookArray} = require("proskomma-utils");
const appRootPath = require("app-root-path");
const appRoot = appRootPath.toString();

async function getTranslationsCatalog() {

    const http = require(`${appRoot}/src/lib/http.js`);

    const catalogResponse = await http.getText('https://ebible.org/Scriptures/translations.csv');
    const catalogData = catalogResponse.data;
    const catalogRows = catalogData.split('\n')
        .map(r => r.slice(1, r.length - 1))
        .map(r => r.split(/", ?"/))

    const headers = catalogRows[0];
    const catalog = catalogRows
        .map(
        r => {
            const ret = {};
            headers.forEach((h, n) => ret[h] = r[n]);
            ret.downloadURL = `https://eBible.org/Scriptures/${ret.translationId}_usfm.zip`;
            return ret;
        }
    ).filter(t => t.languageCode)
    .map(t => ({
        id: t.translationId,
        languageCode: t.languageCode,
        title: t.title,
        downloadURL: `https://eBible.org/Scriptures/${t.translationId}_usfm.zip`,
    }));
    return catalog;
}

const fetchUsfm = async (org, trans) => {

    const http = require(`${appRoot}/src/lib/http.js`);
    const transPath = path.resolve(appRoot, 'data', org.translationDir, 'translations', trans.id);
    if (!fse.pathExistsSync(transPath)) {
        fse.mkdirsSync(transPath);
    }
    const downloadResponse = await http.getBuffer(trans.downloadURL);
    // fse.writeFileSync(path.join(transPath, 'archive.zip'), downloadResponse.data);
    const usfmBooksPath = path.join(transPath, 'usfmBooks');
    if (!fse.pathExistsSync(usfmBooksPath)) {
        fse.mkdirsSync(usfmBooksPath);
    }
    const zip = new jszip();
    await zip.loadAsync(downloadResponse.data);
    for (const bookName of ptBookArray) {
        const foundFiles = zip.file(new RegExp(`${bookName.code}[^/]*.usfm$`, 'g'));
        if (foundFiles.length === 1) {
            const fileContent = await foundFiles[0].async('text');
            fse.writeFileSync(path.join(usfmBooksPath, `${bookName.code}.usfm`), fileContent);
        }
    }
};

const fetchUsx = async (org) => {throw new Error(`USX fetching is not supported for ${org.name}`)};

module.exports = { getTranslationsCatalog, fetchUsfm, fetchUsx }
