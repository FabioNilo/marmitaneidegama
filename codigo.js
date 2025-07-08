const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwoOm_pLJJU0U9S4kZGQwrhR5d9lWK26DWCVjtQD0qU9dsYtQsNBoPamj18EEEeumIe/exec';

// Método 1: JSONP (mais confiável para CORS)
function enviarViaJSONP(dadosPedido) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonpCallback' + Date.now();
        const script = document.createElement('script');
        
        // Define o callback global
        window[callbackName] = function(response) {
            resolve(response);
            // Limpa
            document.head.removeChild(script);
            delete window[callbackName];
        };
        
        // Constrói a URL com parâmetros
        const params = new URLSearchParams({
            ...dadosPedido,
            callback: callbackName
        });
        
        script.src = `${APPS_SCRIPT_URL}?${params.toString()}`;
        script.onerror = () => {
            reject(new Error('Erro ao carregar script JSONP'));
            document.head.removeChild(script);
            delete window[callbackName];
        };
        
        document.head.appendChild(script);
        
        // Timeout de 10 segundos
        setTimeout(() => {
            if (window[callbackName]) {
                reject(new Error('Timeout na requisição'));
                document.head.removeChild(script);
                delete window[callbackName];
            }
        }, 10000);
    });
}

// Método 2: Usando iframe (sempre funciona)
function enviarViaIframe(dadosPedido) {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.name = 'hiddenFrame';
        
        const form = document.createElement('form');
        form.target = 'hiddenFrame';
        form.method = 'POST';
        form.action = APPS_SCRIPT_URL;
        form.style.display = 'none';
        
        // Adiciona os campos do formulário
        Object.keys(dadosPedido).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = dadosPedido[key];
            form.appendChild(input);
        });
        
        document.body.appendChild(iframe);
        document.body.appendChild(form);
        
        iframe.onload = () => {
            // Assume sucesso após 2 segundos
            setTimeout(() => {
                document.body.removeChild(iframe);
                document.body.removeChild(form);
                resolve({
                    success: true,
                    message: 'Pedido enviado com sucesso!'
                });
            }, 2000);
        };
        
        form.submit();
    });
}

// Função principal que tenta ambos os métodos
async function enviarParaGoogleSheets(dadosPedido) {
    try {
        showLoadingIndicator(true);
        console.log('Tentando envio via JSONP...');
        
        // Tenta JSONP primeiro
        const resultado = await enviarViaJSONP(dadosPedido);
        showLoadingIndicator(false);
        
        console.log('Sucesso via JSONP:', resultado);
        return resultado;
        
    } catch (error) {
        console.log('JSONP falhou, tentando iframe...', error);
        
        try {
            // Se JSONP falhar, usa iframe
            const resultado = await enviarViaIframe(dadosPedido);
            showLoadingIndicator(false);
            
            console.log('Sucesso via iframe:', resultado);
            return resultado;
            
        } catch (iframeError) {
            showLoadingIndicator(false);
            console.error('Ambos os métodos falharam:', iframeError);
            
            return {
                success: false,
                message: 'Erro ao enviar pedido. Tente novamente.'
            };
        }
    }
}

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
    return loadingDiv;
}

// Exemplo de uso
async function exemploUso() {
    const dadosPedido = {
        nomeCliente: 'João Silva',
        rua: 'Rua das Flores, 123',
        bairro: 'Centro',
        itens: '2x Pizza Margherita, 1x Refrigerante',
        total: 'R$ 45,00',
        status: 'Pendente'
    };
    
    const resultado = await enviarParaGoogleSheets(dadosPedido);
    
    if (resultado.success) {
        alert('✅ ' + resultado.message);
    } else {
        alert('❌ ' + resultado.message);
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

   
    quentinhaForm.addEventListener('submit', (event) => {
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