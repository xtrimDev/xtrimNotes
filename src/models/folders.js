const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        parentFolder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder',
            default: null
        },
        path: {
            type: String,
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true
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

folderSchema.pre('save', async function (next) {
    if (!this.parentFolder) {
        this.path = `/${this.name}`;
    } else {
        const parent = await mongoose.model('Folder').findById(this.parentFolder);
        this.path = `${parent.path}/${this.name}`;
    }
    next();
});

module.exports = mongoose.model('Folder', folderSchema);;