const mongoose = require("mongoose");

const bookmarksSchema = new mongoose.Schema(
    {
        file: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: true,
            ref: 'Files'
        },
        addedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Users', 
            required: true
        }
    }, 
    { 
        timestamps: true 
    }
);

module.exports = mongoose.model('Bookmarks', bookmarksSchema);;
