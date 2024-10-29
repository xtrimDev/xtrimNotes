const path = require('path');
const fs = require('fs');

const files = require("../models/files");

const express = require("express");
const { ensureAuthenticatedForFetching } = require('../middleware/auth');

const router = new express.Router();

router.get("/:uniqueName", async (req, res) => {
    try {
        const result = await ensureAuthenticatedForFetching(req, res);

        if (!result?.authenticated || result?.banned) {
            return res.status(403).json(result);
        }

        const uniqueName = req.params.uniqueName;
        const fileDbData = await files.findOne({ uniqueName });

        if (fileDbData) {
            const pdfPath = path.join(__dirname, '/../../uploads/', fileDbData.url);

            if (fs.existsSync(pdfPath)) {
                const stat = fs.statSync(pdfPath);
                const fileSize = stat.size;
                const range = req.headers.range;

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="${fileDbData.name}"`);

                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

                    if (start >= fileSize) {
                        res.status(416).send("Requested range not satisfiable\n" + start + " >= " + fileSize);
                        return;
                    }

                    res.status(206).header({
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': end - start + 1
                    });

                    const pdfStream = fs.createReadStream(pdfPath, { start, end });
                    pdfStream.pipe(res);

                    pdfStream.on('error', () => res.status(500).render("errors/500"));
                } else {
                    res.header('Content-Length', fileSize);
                    const pdfStream = fs.createReadStream(pdfPath);
                    pdfStream.pipe(res);

                    pdfStream.on('error', () => res.status(500).render("errors/500"));
                }
            } else {
                return res.status(404).render("errors/404");
            }
        } else {
            return res.status(404).render("errors/404");
        }        
    } catch (error) {
        return res.status(500).render("errors/500");
    }
});


module.exports = router;
