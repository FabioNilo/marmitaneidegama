const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwbcsjSF1G7-uSwbrmPJkEin7T7yvQcV5oCiJSgfLmRgJo2LaYXytaanKFxRE6krwg/exec';

function enviarViaIframe(dadosPedido) {
    return new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.name = 'hiddenFrame'; // Nome para o form target
        
        const form = document.createElement('form');
        form.target = 'hiddenFrame'; // Aponta para o iframe
        form.method = 'POST';        // Essencial: POST
        form.action = APPS_SCRIPT_URL; // URL do Apps Script
        form.style.display = 'none';
        
        // Adiciona os campos do formulário como inputs hidden
        // O Apps Script lerá estes como e.parameter.key
        Object.keys(dadosPedido).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key; // O nome do input será a chave em e.parameter
            input.value = dadosPedido[key];
            form.appendChild(input);
        });
        
        document.body.appendChild(iframe);
        document.body.appendChild(form);
        
        // Quando o iframe carregar a resposta do Apps Script
        iframe.onload = () => {
            // Pode haver um pequeno atraso para a escrita no Sheet.
            // Assumimos sucesso aqui, pois o Apps Script já executou e respondeu.
            // Se o Apps Script retornar HTML com uma mensagem de erro/sucesso,
            // você poderia tentar ler o conteúdo do iframe (mais complexo devido a CORS).
            // Para simplicidade, assumimos sucesso ao carregar o iframe.
            setTimeout(() => { // Pequeno delay para garantir que o Apps Script terminou
                document.body.removeChild(iframe);
                document.body.removeChild(form);
                resolve({
                    success: true,
                    message: 'Pedido enviado com sucesso para a planilha!'
                });
            }, 500); // Meio segundo de delay
        };

        iframe.onerror = () => {
            document.body.removeChild(iframe);
            document.body.removeChild(form);
            reject(new Error('Erro ao carregar iframe para envio.'));
        };
        
        form.submit(); // Envia o formulário
    });
}

// ---

// Função principal, agora priorizando o iframe para POST
async function enviarParaGoogleSheets(dadosPedido) {
    try {
        showLoadingIndicator(true);
        console.log('Tentando envio via iframe...');
        
        // Usa o método de iframe
        const resultado = await enviarViaIframe(dadosPedido);
        showLoadingIndicator(false);
        
        console.log('Sucesso no envio para a planilha:', resultado);
        return resultado;
        
    } catch (error) {
        showLoadingIndicator(false);
        console.error('Erro ao enviar para Google Sheets via iframe:', error);
        
        return {
            success: false,
            message: 'Erro ao enviar pedido para a planilha. Tente novamente.'
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const pedidoList = document.getElementById('pedido-list');
    const totalAmountSpan = document.getElementById('total-amount');
    const whatsappButton = document.getElementById('whatsapp-button');
    const quentinhaForm = document.getElementById('quentinha-form');

    let selectedOptions = [];
    let totalPrice = 0;

    
    window.adicionarOpcao = (button) => {
        const card = button.closest('.card');
        const optionText = card.dataset.opcao;
        const optionPrice = parseFloat(card.dataset.price);

        selectedOptions.push({ text: optionText, price: optionPrice });
        updatePedidoSummary();
    };

    
    const updatePedidoSummary = () => {
        pedidoList.innerHTML = ''; 
        totalPrice = 0;

        selectedOptions.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${item.text} - R$ ${item.price.toFixed(2)}`;

            
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remover';
            removeButton.classList.add('remove-item-button');
            removeButton.onclick = () => removerOpcao(index);
            listItem.appendChild(removeButton);

            pedidoList.appendChild(listItem);
            totalPrice += item.price;
        });

        totalAmountSpan.textContent = totalPrice.toFixed(2);
    };

  
    const removerOpcao = (index) => {
        selectedOptions.splice(index, 1);
        updatePedidoSummary();
    };

   
    quentinhaForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        const nome = document.getElementById('nome').value;
        const rua = document.getElementById('rua').value;
        const bairro = document.getElementById('bairro').value;

        if (selectedOptions.length === 0) {
            alert('Por favor, selecione pelo menos uma opção de quentinha.');
            return;
        }

        if(nome === ""){
            alert('Insira seu nome, para continuar o pedido');
            return;
        }

         const itensFormatados = selectedOptions.map(item => `${item.text} (R$ ${item.price.toFixed(2)})`).join(', ');

        const dadosParaPlanilha = {
            nomeCliente: nome,
            rua: rua,
            bairro: bairro,
            itens: itensFormatados, 
            total: totalPrice.toFixed(2), 
            status: 'Pendente' 
        };

        const resultadoEnvio = await enviarParaGoogleSheets(dadosParaPlanilha);

        if (resultadoEnvio.success) {
            alert('✅ Pedido salvo na planilha e pronto para WhatsApp!');
            
        } else {
            alert('❌ Erro ao salvar pedido na planilha: ' + resultadoEnvio.message);
        }

        let orderDetails = `*Pedido de Quentinhas - Neide Marmitas Fit Congeladas*\n\n`;
        orderDetails += `*Dados do Cliente:*\n`;
        orderDetails += `Nome: ${nome}\n`;
        orderDetails += `Rua: ${rua}\n`;
        orderDetails += `Bairro: ${bairro}\n\n`;

        orderDetails += `*Itens do Pedido:*\n`;
        selectedOptions.forEach((item, index) => {
            orderDetails += `${index + 1}. ${item.text} - R$ ${item.price.toFixed(2)}\n`;
        });
        orderDetails += `\n*Total a Pagar: R$ ${totalPrice.toFixed(2)}*\n\n`;
        orderDetails += `Obrigado pelo seu pedido!`;

        
        console.log(orderDetails); 

        
        quentinhaForm.reset();
        selectedOptions = [];
        updatePedidoSummary();
        alert('Pedido finalizado! Por favor, clique em "Enviar para WhatsApp" para enviar o resumo.');
    });


    
    whatsappButton.addEventListener('click', () => {
        const nome = document.getElementById('nome').value;
        const rua = document.getElementById('rua').value;
        const bairro = document.getElementById('bairro').value;

        if (selectedOptions.length === 0) {
            alert('Por favor, selecione pelo menos uma opção de quentinha antes de enviar para o WhatsApp.');
            return;
        }

        let whatsappMessage = `Olá, Neide! Gostaria de fazer um pedido de quentinhas.\n\n`;
        whatsappMessage += `*Dados do Cliente:*\n`;
        whatsappMessage += `Nome: ${nome}\n`;
        whatsappMessage += `Rua: ${rua}\n`;
        whatsappMessage += `Bairro: ${bairro}\n\n`;

        whatsappMessage += `*Itens do Pedido:*\n`;
        selectedOptions.forEach((item, index) => {
            whatsappMessage += `${index + 1}. ${item.text} - R$ ${item.price.toFixed(2)}\n`;
        });
        whatsappMessage += `\n*Total a Pagar: R$ ${totalPrice.toFixed(2)}*\n\n`;
        whatsappMessage += `Obrigado!`;

        const whatsappNumber = '5573998253365'; 
        const encodedMessage = encodeURIComponent(whatsappMessage);
        const whatsappURL = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;

        window.open(whatsappURL, '_blank');
    });

    

});

function showLoadingIndicator(show = true) {
    const loadingDiv = document.getElementById('loading-indicator') || createLoadingIndicator();
    loadingDiv.style.display = show ? 'block' : 'none';
}

function createLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: rgba(0,0,0,0.8); color: white; padding: 20px; 
                    border-radius: 10px; z-index: 1000; text-align: center;">
            <div style="margin-bottom: 10px;">📊 Salvando pedido...</div>
            <div style="width: 30px; height: 30px; border: 3px solid #f3f3f3; 
                        border-top: 3px solid #3498db; border-radius: 50%; 
                        animation: spin 1s linear infinite; margin: 0 auto;"></div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    loadingDiv.style.display = 'none';
    document.body.appendChild(loadingDiv);
    return loadingDiv;}