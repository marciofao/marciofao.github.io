document.addEventListener('DOMContentLoaded', function () {
    const button = document.getElementById('pcb-pix-button');

    if (button) {
        button.addEventListener('click', function () {
            const selector = pcbOptions.valueSelector; // Get the selector from localized script
            const element = document.querySelector(selector);

            if (element) {
                const value = element.innerText.replace(/\u00a0/g, ' ').trim();

                // Send the value via AJAX
                fetch(pcbOptions.ajaxUrl + '?action=pcb_output_pix', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: 'valorTransacao=' + encodeURIComponent(value) + '&idTransacao=' + encodeURIComponent(button.dataset.id),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        //get parent element from button
                        parent = button.parentNode;
                        //remove button
                        parent.removeChild(button);
                                                
                        if(data.codigoPix){
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                navigator.clipboard.writeText(data.codigoPix)
                                    .then(() => {
                                        alert('Código Pix copiado para área de transferência! Continue o pagamento no app do seu banco');
                                    })
                                    .catch((err) => {
                                        console.error('Failed to copy text: ', err);
                                    });
                            }
                            const p = document.createElement('p');
                            p.innerText = "Use O QR code abaixo ou copie o código Pix para o seu aplicativo bancário.";
                            parent.appendChild(p);
                            const p2 = document.createElement('p');
                            p2.innerText = data.codigoPix
                            parent.appendChild(p2);
                        }
                        if (data.qr_code_img_src) {
                            
                            const img = document.createElement('img');
                            img.src = data.qr_code_img_src;
                            parent.appendChild(img);
                        }
                    })
                    .catch((error) => console.error('Error:', error));
            } else {
                console.error('Element not found for selector:', selector);
            }
        });
    }
});