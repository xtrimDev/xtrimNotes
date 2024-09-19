function uniqueString(number) {
    const characters = 'FncGlmC5ZVtMiS1Ydy6JjfB43DpXqWuxAvbwIPKL7k0sOohrRgU2zHeaN8E9QT';
    let result = '';

    for (let i = 0; i < number; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    result += Date.now().toString(36);

    return result;
}

module.exports = uniqueString