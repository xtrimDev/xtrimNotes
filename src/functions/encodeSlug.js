function encodeSlug(text) {
    return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-\/]+/g, '');
}

module.exports = encodeSlug;