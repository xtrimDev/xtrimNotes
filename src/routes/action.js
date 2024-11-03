const express = require("express");
const { ensureNotAuthenticated, ensureAuthenticatedForFetching } = require("../middleware/auth");
const router = new express.Router();

const Folder = require("../models/folders");
const files = require("../models/files");
const { getFolderTree, getHomeFolders } = require("../controller/folder");
const bookmarks = require("../models/bookmarks");
const myCache = require("../middleware/cache");
const path = require("path");
const fs = require("fs");
const users = require("../models/users");
const folders = require("../models/folders");


require("dotenv").config();

const app = express();

app.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post("/rename/file/:uniqueName/:newName", async(req, res) => {
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

        const uniqueName = req.params.uniqueName;
        const newName = req.params.newName;

        await files.updateOne({uniqueName: uniqueName, accessLevel: { $in: accessLevel }}, {$set: {name:  newName}});

        return res.status(200).send({success: true})
    } catch (error) {
        console.log(error)
        return res.status(500).render("errors/500");
    }
});

router.post("/rename/folder", async(req, res) => {
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

        const path = req.query.path;
        const newName = req.query.newName;

        await folders.updateOne({path, accessLevel: { $in: accessLevel }}, {$set: {name:  newName}});

        return res.status(200).send({success: true})
    } catch (error) {
        console.log(error)
        return res.status(500).render("errors/500");
    }
});

router.post("/download/:uniqueName", async(req, res) => {
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

        if (req?.user?.role != "owner") {
            return res.status(401).send({success: false})
        }

        const uniqueName = req.params.uniqueName;

        const data = await files.findOne({
            uniqueName: uniqueName,
            accessLevel: { $in: accessLevel }
        });
        
        if (data) {
            // Ensure the path is constructed correctly
            let filepath = path.join(__dirname, '../../uploads', data.url); // Removed extra `${}`
        
            // Use res.download to send the file
            res.download(filepath, (err) => {
                if (err) {
                    // console.error('Error downloading file:', err);
                    res.status(500).send({ success: false, msg: "Error downloading file" });
                }
            });
        } else {
            res.status(404).send({ success: false, msg: "File not found" });
        }
    } catch (error) {
        return res.status(500).render("errors/500");
    }
});

router.post("/delete/file/:uniqueName", async(req, res) => {
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

        const uniqueName = req.params.uniqueName;

        const data = await files.findOne({
            uniqueName: uniqueName,
            accessLevel: { $in: accessLevel }
        });
        
        if (data) {
            // Ensure the path is constructed correctly
            let filepath = path.join(__dirname, '../../uploads', data.url);
        
            fs.unlink(filepath, (err) => {
                return
            });

            await files.deleteOne({
                uniqueName: uniqueName,
                accessLevel: { $in: accessLevel }
            });

            await bookmarks.deleteMany({file: data._id})

            return res.status(200).send({success: true});
        } else {
            return res.status(404).send({ success: false, msg: "File not found" });
        }
    } catch (error) {
        console.log(error)
        return res.status(500).render("errors/500");
    }
});

router.post("/getFileData/:uniqueName", async(req, res) => {
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

        if (req?.user?.role != "owner") {
            return res.status(401).send({success: false})
        }

        const uniqueName = req.params.uniqueName;

        let data = await files.findOne({
            uniqueName: uniqueName,
            accessLevel: { $in: accessLevel }
        });
        
        if (data) {
            const addedBy = await users.findById(data.uploadedBy);
        
            const responseData = {
                ...data.toObject(), 
                uploadedBy: addedBy ? `${addedBy.name} (${addedBy.role})` : "Unknown"
            };
        
            return res.status(200).send({ success: true, data: responseData });
        } else {
            return res.status(404).send({ success: false, msg: "File not found" });
        }
    } catch (error) {
        console.log(error)
        return res.status(500).render("errors/500");
    }
});

router.post("/getFolderData", async(req, res) => {
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

        if (req?.user?.role != "owner") {
            return res.status(401).send({success: false})
        }

        const path = req.query.path;

        let data = await Folder.findOne({
            path,
            accessLevel: { $in: accessLevel }
        });
        
        if (data) {
            const addedBy = await users.findById(data.createdBy);
        
            const responseData = {
                ...data.toObject(), 
                createdBy: addedBy ? `${addedBy.name} (${addedBy.role})` : "Unknown"
            };
        
            return res.status(200).send({ success: true, data: responseData });
        } else {
            return res.status(404).send({ success: false, msg: "Folder not found" });
        }
    } catch (error) {
        console.log(error)
        return res.status(500).render("errors/500");
    }
});

module.exports = router;