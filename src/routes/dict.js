const express = require("express");
const folders = require("../models/folders");
const files = require("../models/files");
const { ensureNotAuthenticated, ensureAdminAuthenticated } = require("../middleware/auth");

const router = new express.Router();

const app = express();

const multer = require('multer');
const path = require("path");
const { permission } = require("process");
const uniqueString = require("../functions/uniqueString");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

app.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post("/addFolder", async (req, res) => {
    try {
        const authentication = await ensureAdminAuthenticated(req, res);
        if (!authentication?.authenticated || !authentication?.admin) {
            return res.status(400).json({ success: 0, msg: "Your are not permitted to create a folder", permission: 0 });
        }

        const folderName = req.body.folderName.trim();
        const slug = req.body.slug.trim();
        const visibility = req.body.visibility.trim();
        const atFolder = req.body.atFolder.trim();

        const folder = await folders.findOne({ path: atFolder }).select("_id path");

        if (folder && atFolder != "/") {
            const ListDuplicateFolders = await folders.findOne({ parentFolder: folder._id, name: folderName });

            if (ListDuplicateFolders) {
                return res.status(400).json({
                    success: 0,
                    msg: "The folder already exists",
                    permission: 1
                });
            }

            const ListDuplicateSlugs = await folders.findOne({ parentFolder: folder._id, path: `${folder.path}/${slug}` });

            if (ListDuplicateSlugs) {
                return res.status(400).json({
                    success: 0,
                    msg: "The Slug already exists",
                    permission: 1
                });
            }

            const folderDetails = new folders({ name: folderName, parentFolder: folder._id, path: `${folder.path}/${slug}`, accessLevel: (visibility.toLowerCase() == "public" ? "user" : visibility.toLowerCase()), createdBy: req.user._id });

            await folderDetails.save();

            return res.status(200).json({
                success: 1,
                msg: "Folder created successfully",
                permission: 1
            });
        } else if (atFolder == "/") {
            const ListDuplicateFolders = await folders.findOne({ parentFolder: null, name: folderName });

            if (ListDuplicateFolders) {
                return res.status(400).json({
                    success: 0,
                    msg: "The folder already exists",
                    permission: 1
                });
            }

            const ListDuplicateSlugs = await folders.findOne({ parentFolder: null, path: `/${slug}` });

            if (ListDuplicateSlugs) {
                return res.status(400).json({
                    success: 0,
                    msg: "The Slug already exists",
                    permission: 1
                });
            }

            const folderDetails = new folders({ name: folderName, parentFolder: null, path: `/${slug}`, accessLevel: (visibility.toLowerCase() == "public" ? "user" : visibility.toLowerCase()), createdBy: req.user._id });

            await folderDetails.save();

            return res.status(200).json({
                success: 1,
                msg: "Folder created successfully",
                permission: 1
            });
        } else {
            return res.status(400).json({
                success: 0,
                msg: "Something went wrong, refresh the page and try again",
                permission: 1
            });
        }
    } catch (error) {
        console.log(error);
        if (error?.name === 'ValidationError') {
            const firstErrorField = Object.keys(error.errors)[0];

            errorData = {
                success: 0,
                msg: error.errors[firstErrorField].message,
                permission: 1
            }

            return res.status(400).json(errorData);
        }

        return res.status(500).render("errors/500");
    }
});

router.post("/addFile", async (req, res, next) => {
    try {
        const authentication = await ensureAdminAuthenticated(req, res);
        if (!authentication?.authenticated || !authentication?.admin) {
            return res.status(400).json({ success: 0, msg: "Your are not permitted to create a file", permission: 0 });
        }

        next();
    } catch (error) {
        console.log(error);
        return res.status(500).render("errors/500");
    }
}, upload.single('file'), async (req, res, next) => {
    try {
        const fileName = req.body.fileName.trim();
        const visibility = req.body.visibility.trim();
        const atFolder = req.body.currentUrl.trim();

        const folder = await folders.findOne({ path: atFolder }).select("_id path");

        if (folder && atFolder != "/") {
            const ListDuplicateFiles = await files.findOne({ folder: folder._id, name: fileName });

            if (ListDuplicateFiles) {
                return res.status(400).json({
                    success: 0,
                    msg: "The file already exists",
                    permission: 1
                });
            }

            const ext = req.file.originalname.substring(req.file.originalname.lastIndexOf('.') + 1, req.file.originalname.length);

            if (ext != 'pdf') {
                const filePath = `../../uploads/${req.file.filename}`;

                fs.unlink(filePath, (err) => {
                    return res.status(400).json({
                        success: 0,
                        msg: "Only pdf file is allowed",
                        permission: 1
                    });
                });
            }

            const file = new files({
                name: fileName,
                fileType: "pdf",
                folder: folder._id,
                uploadedBy: req.user._id,
                url: req.file.filename,
                uniqueName: uniqueString(15),
                accessLevel: (visibility.toLowerCase() == "public" ? "user" : visibility.toLowerCase())
            });

            await file.save();

            return res.status(200).json({
                success: 1,
                msg: "File saved successfully",
                permission: 1
            });
        } else if (atFolder == "/") {
            const ListDuplicateFiles = await files.findOne({ folder: null, name: fileName });

            if (ListDuplicateFiles) {
                return res.status(400).json({
                    success: 0,
                    msg: "The file already exists",
                    permission: 1
                });
            }

            const ext = req.file.originalname.substring(req.file.originalname.lastIndexOf('.') + 1, req.file.originalname.length);

            if (ext != 'pdf') {
                const filePath = `../../uploads/${req.file.filename}`;

                fs.unlink(filePath, (err) => {
                    return res.status(400).json({
                        success: 0,
                        msg: "Only pdf file is allowed",
                        permission: 1
                    });
                });
            }

            const file = new files({
                name: fileName,
                fileType: "pdf",
                folder: null,
                uploadedBy: req.user._id,
                url: req.file.filename,
                uniqueName: uniqueString(15),
                accessLevel: (visibility.toLowerCase() == "public" ? "user" : visibility.toLowerCase())
            });

            await file.save();

            return res.status(200).json({
                success: 1,
                msg: "File saved successfully",
                permission: 1
            });
        } else {
            return res.status(400).json({
                success: 0,
                msg: "Something went wrong, refresh the page and try again",
                permission: 1
            });
        }
    } catch (error) {
        console.log(error);
        if (error?.name === 'ValidationError') {
            const firstErrorField = Object.keys(error.errors)[0];

            errorData = {
                success: 0,
                msg: error.errors[firstErrorField].message,
                permission: 1
            }

            return res.status(400).json(errorData);
        }

        return res.status(500).render("errors/500");
    }
});

module.exports = router;
