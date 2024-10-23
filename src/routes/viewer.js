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
            return res.redirect("/auth/login");
        }

        const uniqueName = req.params.uniqueName;
        const fileDbData = await files.findOne({uniqueName});

        if (fileDbData) {
            return res.render("viewer/index", {title: fileDbData.name});
        } else {
            return res.status(404).render("errors/404");
        }        
    } catch(error) {
        return res.status(500).render("errors/500");
    }
});

module.exports = router;
