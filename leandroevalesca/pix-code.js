// JavaScript version of the PHP functions for frontend usage

// Format a field with its ID and value
function pcbFormataCampo(id, valor) {
    return id + String(valor.length).padStart(2, '0') + valor;
}

// Calculate CRC16 checksum
function pcbCalculaCRC16(dados) {
    let resultado = 0xFFFF;
    for (let i = 0; i < dados.length; i++) {
        resultado ^= (dados.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
            if (resultado & 0x8000) {
                resultado = (resultado << 1) ^ 0x1021;
            } else {
                resultado <<= 1;
            }
            resultado &= 0xFFFF;
        }
    }
    return resultado.toString(16).toUpperCase().padStart(4, '0');
}

// Generate PIX code
function pcbGeraPix(chave, idTx = '', valor = 0.00) {
    // Convert BRL format to a float
    valor = parseFloat(valor.toString().replace('R$', '').replace('.', '').replace(',', '.'));

    let resultado = "000201";
    resultado += pcbFormataCampo("26", "0014br.gov.bcb.pix" + pcbFormataCampo("01", chave));
    resultado += "52040000"; // Fixed code
    resultado += "5303986";  // Currency (Real)
    if (valor > 0) {
        resultado += pcbFormataCampo("54", valor.toFixed(2));
    }
    resultado += "5802BR"; // Country
    resultado += "5901N";  // Name
    resultado += "6001C";  // City
    resultado += pcbFormataCampo("62", pcbFormataCampo("05", idTx || '***'));
    resultado += "6304"; // Start of CRC16
    resultado += pcbCalculaCRC16(resultado); // Add CRC16 at the end
    return resultado;
}

// Generate PIX QR Code and return data
function pcbOutputPix(chave, valorTransacao = '0.00', idTransacao = '') {
    const codigoPix = pcbGeraPix(chave, idTransacao, valorTransacao);

    const qrCodeImgSrc = `https://quickchart.io/qr?text=${encodeURIComponent(codigoPix)}`;

    return {
        codigoPix: codigoPix,
        qrCodeImgSrc: qrCodeImgSrc,
        valorTransacao: valorTransacao,
        idTransacao: idTransacao,
    };
}

// Example usage
// const chavePix = "88276449034"; // Replace with your PIX key
// const valorTransacao = "100.00"; // Replace with the transaction value
// const idTransacao = "12345"; // Replace with the transaction ID

// const pixData = pcbOutputPix(chavePix, valorTransacao, idTransacao);
// console.log(pixData);

// // Example: Display the QR code in an HTML element
// document.getElementById('pix-qr-code').src = pixData.qrCodeImgSrc;