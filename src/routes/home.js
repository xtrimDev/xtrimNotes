const express = require("express");
const { ensureNotAuthenticated, ensureAuthenticatedForFetching } = require("../middleware/auth");
const router = new express.Router();

const Folder = require("../models/folders");
const files = require("../models/files");
const NodeCache = require("node-cache");
const { getFolderTree, getHomeFolders } = require("../controller/folder");

require("dotenv").config();
const myCache = new NodeCache({ stdTTL: 90 });

router.get("/*", ensureNotAuthenticated, async (req, res) => {
    try {
        if (req.user.role == "owner") {
            uploader = true;
            accessLevel = ["owner","admin", "user"];
        }  else if (req.user.role == "admin") {
            uploader = true;
            accessLevel = ["admin", "user"];
        } else {
            uploader = false;
            accessLevel = ["user"];
        }

        const homeFolders = await getHomeFolders(accessLevel);
        const requestedPath = `/${req.params[0]}`.trim();

        if (requestedPath === '/' || requestedPath === '') {
            return res.status(200).render("home/index", {path: requestedPath, title: "Home", uploader, homeFolders, accessLevel, setting : {appName: process.env.APP_NAME, teleLink: process.env.TELE_LINK}});
        }

        const result = await Folder.findOne({ path: requestedPath }).select("name");

        if (!result) {
            return res.status(404).render("errors/404");
        } else {
            return res.status(200).render("home/index", {path: requestedPath, title: result.name, uploader, homeFolders, accessLevel, setting : {appName: process.env.APP_NAME, teleLink: process.env.TELE_LINK}});
        }
    } catch (error) {
        return res.status(500).render("errors/500");
    }
});

router.post('/*', async (req, res) => {
    try {
        const result = await ensureAuthenticatedForFetching(req, res);
        
        if (result?.banned || !result?.authenticated) {
            return res.status(403).json(result);
        }

        const requestedPath = `/${req.params[0]}`.trim();

        if (req?.user?.role == "owner") {
            accessLevel = ["owner","admin", "user"];
        }  else if (req?.user?.role == "admin") {
            accessLevel = ["admin", "user"];
        } else {
            accessLevel = ["user"];
        } 

        if (accessLevel[0] == "user" && myCache.has(`${accessLevel[0]}-${requestedPath}`)) {
            return res.status(200).send(myCache.get(`${accessLevel[0]}-${requestedPath}`)); 
        } else {
            if (requestedPath === '/' || requestedPath === '') {
                const rootFolders = await Folder.find({ parentFolder: null, accessLevel: { $in: accessLevel }}).select("name path -_id");
                const rootFiles = await files.find({ folder: null, accessLevel: { $in: accessLevel } }).select("name uniqueName -_id");
    
                const data = {
                    folders: rootFolders,
                    files: rootFiles
                };

                if (accessLevel[0] == "user")
                    myCache.set(`${accessLevel[0]}-${requestedPath}`, data)

                return res.status(200).json(data); 
            }
    
            const parentFolder = await Folder.findOne({ path: requestedPath, accessLevel: { $in: accessLevel } }).select("_id");
    
            if (!parentFolder) {
                return res.status(404).render("errors/404");
            }
    
            const subFolders = await Folder.find({ parentFolder: parentFolder._id, accessLevel: { $in: accessLevel} }).select("name path -_id");
            const subFiles = await files.find({ folder: parentFolder._id, accessLevel: { $in: accessLevel } }).select("name uniqueName -_id");
    
            const data = {
                folders: subFolders,
                files: subFiles
            };

            if (accessLevel[0] == "user")
                myCache.set(`${accessLevel[0]}-${requestedPath}`, data)

            res.status(200).json(data);
        } 
    } catch (error) {
        return res.status(500).render("errors/500");
    }
});

module.exports = router;