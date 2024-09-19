const path = require('path');
const fs = require('fs');

const files = require("../models/files");

const express = require("express");

const router = new express.Router();

router.get("/:uniqueName", async (req, res) => {
    try {
        const uniqueName = req.params.uniqueName;
        const fileDbData = await files.findOne({uniqueName});

        if (fileDbData) {
            const pdfPath = path.join(__dirname, '/../../uploads/', fileDbData.url);
            
            if (fs.existsSync(pdfPath)) {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'inline; filename="' + fileDbData.name + '"');
    
                const pdfStream = fs.createReadStream(pdfPath);
                pdfStream.pipe(res);
    
                pdfStream.on('error', (err) => {
                    return res.status(500).render("errors/500");
                });
            } else {
                return res.status(404).render("errors/404");
            }
        } else {
            return res.status(404).render("errors/404");
        }        
    } catch(error) {
        return res.status(500).render("errors/500");
    }
});

module.exports = router;
