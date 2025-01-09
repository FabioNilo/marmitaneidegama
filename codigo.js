document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('quentinha-form');
    const pedidoList = document.getElementById('pedido-list');
    const whatsappButton = document.getElementById('whatsapp-button');
    const totalAmount = document.getElementById('total-amount');
    const acompanhamentoCheckboxes = document.querySelectorAll('#acompanhamentos input[type="checkbox"]');

    let pedidos = [];
    const valorPorPedido = 10; // Valor fixo por pedido

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const nome = document.getElementById('nome').value;
        const rua = document.getElementById('rua').value;
        const bairro = document.getElementById('bairro').value;
        const proteina = document.getElementById('proteina').value;
        const salada = document.getElementById('salada').value;
        const acompanhamentos = Array.from(document.querySelectorAll('#acompanhamentos input:checked'))
            .map(acomp => acomp.value);

        const pedido = {
            nome,
            rua,
            bairro,
            proteina,
            salada,
            acompanhamentos
        };

        pedidos.push(pedido);
        atualizarListaPedidos();
        atualizarTotal();
    });

    whatsappButton.addEventListener('click', function() {
        const mensagem = gerarMensagemWhatsApp(pedidos);
        window.open(`https://wa.me/5573981161041?text=${encodeURIComponent(mensagem)}`);
    });

    function atualizarListaPedidos() {
        pedidoList.innerHTML = '';
        pedidos.forEach((pedido, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <p><strong>Nome:</strong> ${pedido.nome}</p>
                <p><strong>Rua:</strong> ${pedido.rua}</p>
                <p><strong>Bairro:</strong> ${pedido.bairro}</p>
                <p><strong>Proteína:</strong> ${pedido.proteina}</p>
                <p><strong>Salada:</strong> ${pedido.salada}</p>
                <p><strong>Acompanhamentos:</strong> ${pedido.acompanhamentos.join(', ')}</p>
                <button onclick="removerPedido(${index})">Excluir</button>
            `;
            pedidoList.appendChild(li);
        });
    }

    function atualizarTotal() {
        const total = pedidos.length * valorPorPedido;
        totalAmount.textContent = total.toFixed(2);
    }

    window.removerPedido = function(index) {
        pedidos.splice(index, 1);
        atualizarListaPedidos();
        atualizarTotal();
    };

    function gerarMensagemWhatsApp(pedidos) {
        let mensagem = 'Resumo do pedido:\n\n';
        pedidos.forEach((pedido, index) => {
            mensagem += `Pedido ${index + 1}:\n`;
            mensagem += `- Nome: ${pedido.nome}\n`;
            mensagem += `- Rua: ${pedido.rua}\n`;
            mensagem += `- Bairro: ${pedido.bairro}\n`;
            mensagem += `- Proteína: ${pedido.proteina}\n`;
            mensagem += `- Salada: ${pedido.salada}\n`;
            mensagem += `- Acompanhamentos: ${pedido.acompanhamentos.join(', ')}\n\n`;
        });
        const total = pedidos.length * valorPorPedido;
        mensagem += `Total: R$ ${total.toFixed(2)}`;
        return mensagem;
    }

    acompanhamentoCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkedCheckboxes = document.querySelectorAll('#acompanhamentos input[type="checkbox"]:checked');
            if (checkedCheckboxes.length >= 3) {
                acompanhamentoCheckboxes.forEach(box => {
                    if (!box.checked) {
                        box.disabled = true;
                    }
                });
            } else {
                acompanhamentoCheckboxes.forEach(box => box.disabled = false);
            }
        });
    });
});