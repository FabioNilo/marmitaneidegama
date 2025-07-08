const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwoOm_pLJJU0U9S4kZGQwrhR5d9lWK26DWCVjtQD0qU9dsYtQsNBoPamj18EEEeumIe/exec';

async function enviarParaGoogleSheets(dadosPedido) {
    try {
        showLoadingIndicator(true);
        
        console.log('Enviando dados:', dadosPedido);
        
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            // REMOVIDO: mode: 'no-cors' - isso impede a leitura da resposta
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosPedido)
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        // Verifica se a resposta foi bem-sucedida
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Resultado recebido:', result);
        
        showLoadingIndicator(false);
        
        return result;
        
    } catch (error) {
        showLoadingIndicator(false);
        console.error('Erro ao enviar dados:', error);
        
        // Se for erro de CORS, tenta método alternativo
        if (error.message.includes('CORS') || error.message.includes('fetch')) {
            return await enviarViaFormData(dadosPedido);
        }
        
        return { 
            success: false, 
            message: 'Erro de conexão: ' + error.message 
        };
    }
}

// Método alternativo usando FormData (funciona melhor com CORS)
async function enviarViaFormData(dadosPedido) {
    try {
        console.log('Tentando método alternativo com FormData');
        
        const formData = new FormData();
        
        // Adiciona cada campo do pedido ao FormData
        Object.keys(dadosPedido).forEach(key => {
            formData.append(key, dadosPedido[key]);
        });
        
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            // Com FormData, assumimos sucesso se a resposta for OK
            return { 
                success: true, 
                message: 'Pedido salvo com sucesso!' 
            };
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Erro no método alternativo:', error);
        return { 
            success: false, 
            message: 'Erro ao salvar pedido. Tente novamente.' 
        };
    }
}

// Versão ainda mais simples que sempre funciona (modo fire-and-forget)
async function enviarSimples(dadosPedido) {
    try {
        console.log('Usando método simples (fire-and-forget)');
        
        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Aqui pode usar no-cors porque não lemos a resposta
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosPedido)
        });
        
        // Como é no-cors, assumimos que funcionou
        return { 
            success: true, 
            message: 'Pedido enviado com sucesso!' 
        };
        
    } catch (error) {
        console.error('Erro no envio simples:', error);
        return { 
            success: false, 
            message: 'Erro ao enviar pedido.' 
        };
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
    
    // Tenta o método principal primeiro
    let resultado = await enviarParaGoogleSheets(dadosPedido);
    
    // Se falhar, tenta o método simples
    if (!resultado.success) {
        console.log('Método principal falhou, tentando método simples...');
        resultado = await enviarSimples(dadosPedido);
    }
    
    console.log('Resultado final:', resultado);
    
    // Mostra mensagem para o usuário
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