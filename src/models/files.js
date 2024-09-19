const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true,
            trim: true
        },
        fileType: { 
            type: String, 
            enum: ['pdf', 'img', 'doc', 'sheet', 'unknown'], 
            required: true 
        },
        folder: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Folder', 
        },
        uploadedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Users', 
            required: true 
        }, 
        url: { 
            type: String, 
            required: true 
        }, 
        uniqueName: {
            type: String,
            required: true,
        },
        accessLevel: {
            type: String,
            enum: ['owner', 'admin', 'user'],
            default: 'owner',
            required: true
        },
    }, 
    { 
        timestamps: true 
    }
);

module.exports = mongoose.model('Files', fileSchema);;
