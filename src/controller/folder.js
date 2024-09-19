const Folder = require("../models/folders");

async function getFolderTree(parentFolder = null, accessLevel) {
    const folders = await Folder.find({ parentFolder, accessLevel: { $in: accessLevel} }).select("name path");

    const folderTree = [];

    for (const folder of folders) {
        const children = await getFolderTree(folder._id, accessLevel); 
        folderTree.push({
            name: folder.name,
            path: folder.path,
            children: children 
        });
    }

    return folderTree;
}

module.exports = {getFolderTree};