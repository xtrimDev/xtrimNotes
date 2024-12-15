function isDomainValid(email, callback) {
    const domain = email.split('@')[1];
    if (!domain) return callback(false);

    // List of allowed domains
    const allowedDomains = ['gmail.com', 'gehu.ac.in', 'geu.ac.in'];

    // Check if the domain is in the allowed list
    if (allowedDomains.includes(domain)) {
        return callback(true); // Valid domain
    } else {
        return callback(false); // Invalid domain
    }
}

module.exports = isDomainValid;