const express = require("express");
const { ensureNotAuthenticated } = require("../middleware/auth");
const router = new express.Router();

const Folder = require("../models/folders");
const files = require("../models/files");

require("dotenv").config();

router.get("/*", async (req, res) => {
    try {
        const requestedPath = `/${req.params[0]}`.trim();

        if (requestedPath === '/' || requestedPath === '') {
            return res.status(200).render("home/index", {path: requestedPath, title: "Home"});
        }

        const result = await Folder.findOne({ path: requestedPath }).select("_id name");

        if (!result) {
            return res.status(404).render("errors/404");
        } else {
            return res.status(200).render("home/index", {path: requestedPath, title: result.name});
        }
    } catch (error) {
        return res.status(500).render("errors/500");
    }
});

router.post('/*', async (req, res) => {
    try {
        const requestedPath = `/${req.params[0]}`.trim();

        if (requestedPath === '/' || requestedPath === '') {
            const rootFolders = await Folder.find({ parentFolder: null }).select("name path _id");
            const rootFiles = await files.find({ folder: null }).select("name fileType url");

            return res.status(200).json({
                folders: rootFolders,
                files: rootFiles
            }); 
        }

        const parentFolder = await Folder.findOne({ path: requestedPath }).select("name path _id");

        if (!parentFolder) {
            return res.status(404).render("errors/404");
        }

        const subFolders = await Folder.find({ parentFolder: parentFolder._id });
        const subFiles = await files.find({ folder: parentFolder._id }).select("name fileType url");

        res.status(200).json({
            folders: subFolders,
            files: subFiles
        });
    } catch (error) {
        return res.status(500).render("errors/500");
    }
});

module.exports = router;