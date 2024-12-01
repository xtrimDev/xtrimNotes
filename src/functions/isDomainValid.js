const dns = require('dns');

function isDomainValid(email, callback) {
    const domain = email.split('@')[1];
    if (!domain) return callback(false);
    
    dns.resolveMx(domain, (err, addresses) => {
        if (err || addresses.length === 0) {
            callback(false); // Invalid domain
        } else {
            callback(true); // Valid domain
        }
    });
}

module.exports = isDomainValid;