const express = require("express");
const { ensureNotAuthenticated, ensureAuthenticatedForFetching } = require("../middleware/auth");
const router = new express.Router();

const Folder = require("../models/folders");
const files = require("../models/files");
const NodeCache = require("node-cache");
const { getFolderTree, getHomeFolders } = require("../controller/folder");
const bookmarks = require("../models/bookmarks");

require("dotenv").config();
const myCache = new NodeCache({ stdTTL: 90 });

const app = express();

app.use(express.json());
router.use(express.urlencoded({ extended: true }));

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

        if (requestedPath === '/bookmarks') {
            return res.status(200).render("home/index", {path: requestedPath, title: "Bookmarks", uploader, homeFolders, accessLevel, setting : {appName: process.env.APP_NAME, teleLink: process.env.TELE_LINK}});
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

router.post("/set/bookmark/:uniqueName", async(req, res) => {
    try {
        const result = await ensureAuthenticatedForFetching(req, res);

        if (result?.banned || !result?.authenticated) {
            return res.status(403).json(result);
        }

        if (req?.user?.role == "owner") {
            accessLevel = ["owner","admin", "user"];
        }  else if (req?.user?.role == "admin") {
            accessLevel = ["admin", "user"];
        } else {
            accessLevel = ["user"];
        } 

        const requestedFile = req.params.uniqueName;

        const fileData = await files.findOne({uniqueName: requestedFile, accessLevel});

        if (fileData) {
            let data = await bookmarks.findOne({file: fileData._id, addedBy: req.user._id});

            if (!data) {
                data = new bookmarks({file: fileData._id, addedBy: req.user._id});

                data = await data.save();
            }

            if (data) {
                return res.status(200).send({bookmarked: true})
            } else {
                return res.status(200).send({bookmarked: false})
            }
        } else {
            return res.status(400).send({bookmarked: false})
        }
    } catch (error) {
        console.log(error)
        return res.status(500).render("errors/500");
    }
});

router.post("/remove/bookmark/:uniqueName", async(req, res) => {
    try {
        const result = await ensureAuthenticatedForFetching(req, res);

        if (result?.banned || !result?.authenticated) {
            return res.status(403).json(result);
        }

        if (req?.user?.role == "owner") {
            accessLevel = ["owner","admin", "user"];
        }  else if (req?.user?.role == "admin") {
            accessLevel = ["admin", "user"];
        } else {
            accessLevel = ["user"];
        } 

        const requestedFile = req.params.uniqueName;

        const fileData = await files.findOne({uniqueName: requestedFile, accessLevel});

        if (fileData) {
            data = await bookmarks.deleteOne({file: fileData._id, addedBy: req.user._id});

            if (data) {
                return res.status(200).send({bookmarked: false})
            } else {
                return res.status(200).send({bookmarked: true})
            }
        } else {
            return res.status(400).send({bookmarked: null})
        }
    } catch (error) {
        console.log(error)
        return res.status(500).render("errors/500");
    }
});

router.post("/get/bookmark/:uniqueName", async(req, res) => {
    try {
        const result = await ensureAuthenticatedForFetching(req, res);

        if (result?.banned || !result?.authenticated) {
            return res.status(403).json(result);
        }

        if (req?.user?.role == "owner") {
            accessLevel = ["owner","admin", "user"];
        }  else if (req?.user?.role == "admin") {
            accessLevel = ["admin", "user"];
        } else {
            accessLevel = ["user"];
        } 

        const requestedFile = req.params.uniqueName;

        const fileData = await files.findOne({uniqueName: requestedFile, accessLevel});

        if (fileData) {
            const data = await bookmarks.find({file: fileData._id, addedBy: req.user._id});

            if (data && data.length > 0) {
                return res.status(200).send({bookmarked: true})
            } else {
                return res.status(200).send({bookmarked: false})
            }
        } else {
            return res.status(200).send({bookmarked: false})
        }
    } catch (error) {
        console.log(error)
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

        if (requestedPath == "/bookmarks" ) {
            const data = await bookmarks.find({addedBy: req.user._id}).populate('file').select("-id");


            const transformedData = {
                folders: [],
                files: data.map(item => ({
                    name: item.file.name,
                    uniqueName: item.file.uniqueName,
                }))
            }

            return res.status(200).json(transformedData); 
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