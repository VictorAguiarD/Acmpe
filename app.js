// ==================== STORAGE ====================
const STORAGE_KEYS = {
    CLIENTES: 'acampamento_clientes',
    PRODUTOS: 'acampamento_produtos',
    VENDAS: 'acampamento_vendas',
    CARRINHO: 'acampamento_carrinho',
};

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadClientes();
    loadProdutos();
    loadVendas();
    showPage('home');
});

function initializeApp() {
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTES)) {
        localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUTOS)) {
        localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VENDAS)) {
        localStorage.setItem(STORAGE_KEYS.VENDAS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CARRINHO)) {
        localStorage.setItem(STORAGE_KEYS.CARRINHO, JSON.stringify([]));
    }
}

// ==================== NAVEGAÇÃO ====================
function showPage(pageName) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    const selectedPage = document.getElementById(pageName);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }

    const titles = {
        home: 'Home',
        pdv: 'PDV - Ponto de Venda',
        clientes: 'Gestão de Clientes',
        estoque: 'Gestão de Estoque',
        relatorios: 'Relatórios e Análises'
    };
    document.getElementById('pageTitle').textContent = titles[pageName] || 'Home';

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    document.querySelector(`a[onclick="showPage('${pageName}')"]`)?.classList.add('active');

    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.add('hidden');
    }

    if (pageName === 'home') {
        updateKPIs();
    } else if (pageName === 'pdv') {
        loadProductsForPDV();
        loadCartUI();
        loadClientsForPDV();
    } else if (pageName === 'relatorios') {
        updateRelatorios();
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('hidden');
}

// ==================== HOME PAGE ====================
function updateKPIs() {
    const vendas = JSON.parse(localStorage.getItem(STORAGE_KEYS.VENDAS)) || [];
    
    let totalRecebido = 0;
    let totalFiado = 0;
    let totalPrepago = 0;
    let totalFaturamento = 0;

    vendas.forEach(venda => {
        totalFaturamento += venda.valor;
        if (venda.pagamento === 'dinheiro' || venda.pagamento === 'cartao') {
            totalRecebido += venda.valor;
        } else if (venda.pagamento === 'fiado') {
            totalFiado += venda.valor;
        }
    });
}

// ==================== CLIENTES ====================
function loadClientes() {
    const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
    renderClientesTable(clientes);
}

function renderClientesTable(clientes) {
    const tbody = document.getElementById('clientesList');
    tbody.innerHTML = '';

    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Nenhum cliente cadastrado</td></tr>';
        return;
    }

    clientes.forEach(cliente => {
        const row = document.createElement('tr');
        const tipoBadge = getClientTypeBadge(cliente.tipo);
        row.innerHTML = `
            <td>${cliente.nome}</td>
            <td>${cliente.email}</td>
            <td>${cliente.telefone}</td>
            <td><span class="client-type ${cliente.tipo}">${tipoBadge}</span></td>
            <td>R$ ${cliente.saldo.toFixed(2)}</td>
            <td>
                <button class="btn-edit" onclick="editCliente('${cliente.id}')">
                    <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn-delete" onclick="deleteCliente('${cliente.id}')">
                    <i class="bi bi-trash"></i> Deletar
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getClientTypeBadge(tipo) {
    const badges = {
        normal: 'Normal',
        fiado: 'Fiado',
        prepago: 'Pré-Pago'
    };
    return badges[tipo] || 'Normal';
}

function openClientForm() {
    document.getElementById('clientFormModal').style.display = 'flex';
}

function closeClientForm() {
    document.getElementById('clientFormModal').style.display = 'none';
    document.getElementById('clientNome').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('clientTelefone').value = '';
    document.getElementById('clientTipo').value = '';
    document.getElementById('clientDeposito').value = '';
    document.getElementById('clientDeposito').style.display = 'none';
}

function updateDepositoField() {
    const tipo = document.getElementById('clientTipo').value;
    const depositoField = document.getElementById('clientDeposito');
    if (tipo === 'prepago') {
        depositoField.style.display = 'block';
        depositoField.required = true;
    } else {
        depositoField.style.display = 'none';
        depositoField.required = false;
    }
}

function saveClient(event) {
    event.preventDefault();
    
    const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
    
    const newClient = {
        id: Date.now().toString(),
        nome: document.getElementById('clientNome').value,
        email: document.getElementById('clientEmail').value,
        telefone: document.getElementById('clientTelefone').value,
        tipo: document.getElementById('clientTipo').value,
        saldo: document.getElementById('clientTipo').value === 'prepago' 
            ? parseFloat(document.getElementById('clientDeposito').value) 
            : 0
    };

    clientes.push(newClient);
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
    
    closeClientForm();
    loadClientes();
    loadClientsForPDV();
    
    alert('Cliente cadastrado com sucesso!');
}

function deleteCliente(id) {
    if (confirm('Deseja deletar este cliente?')) {
        let clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
        clientes = clientes.filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
        loadClientes();
        loadClientsForPDV();
    }
}

function filterClientes() {
    const searchTerm = document.getElementById('searchClientes').value.toLowerCase();
    const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
    
    const filtered = clientes.filter(c => 
        c.nome.toLowerCase().includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm) ||
        c.telefone.includes(searchTerm)
    );
    
    renderClientesTable(filtered);
}

// ==================== PRODUTOS/ESTOQUE ====================
function loadProdutos() {
    const produtos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUTOS)) || [];
    renderEstoqueTable(produtos);
}

function renderEstoqueTable(produtos) {
    const tbody = document.getElementById('estoqueList');
    tbody.innerHTML = '';

    if (produtos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Nenhum produto cadastrado</td></tr>';
        return;
    }

    produtos.forEach(produto => {
        const row = document.createElement('tr');
        const valorTotal = produto.quantidade * produto.preco;
        row.innerHTML = `
            <td>${produto.nome}</td>
            <td>${produto.categoria}</td>
            <td>${produto.quantidade}</td>
            <td>R$ ${produto.preco.toFixed(2)}</td>
            <td>R$ ${valorTotal.toFixed(2)}</td>
            <td>
                <button class="btn-edit" onclick="editProduto('${produto.id}')">
                    <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn-delete" onclick="deleteProduto('${produto.id}')">
                    <i class="bi bi-trash"></i> Deletar
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openProductForm() {
    document.getElementById('productFormModal').style.display = 'flex';
}

function closeProductForm() {
    document.getElementById('productFormModal').style.display = 'none';
    document.getElementById('productNome').value = '';
    document.getElementById('productCategoria').value = '';
    document.getElementById('productQuantidade').value = '';
    document.getElementById('productPreco').value = '';
    document.getElementById('productEstoqueMinimo').value = '';
}

function saveProduct(event) {
    event.preventDefault();
    
    const produtos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUTOS)) || [];
    
    const newProduct = {
        id: Date.now().toString(),
        nome: document.getElementById('productNome').value,
        categoria: document.getElementById('productCategoria').value,
        quantidade: parseInt(document.getElementById('productQuantidade').value),
        preco: parseFloat(document.getElementById('productPreco').value),
        estoque_minimo: parseInt(document.getElementById('productEstoqueMinimo').value)
    };

    produtos.push(newProduct);
    localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify(produtos));
    
    closeProductForm();
    loadProdutos();
    loadProductsForPDV();
    
    alert('Produto cadastrado com sucesso!');
}

function deleteProduto(id) {
    if (confirm('Deseja deletar este produto?')) {
        let produtos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUTOS)) || [];
        produtos = produtos.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify(produtos));
        loadProdutos();
        loadProductsForPDV();
    }
}

function filterEstoque() {
    const searchTerm = document.getElementById('searchEstoque').value.toLowerCase();
    const produtos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUTOS)) || [];
    
    const filtered = produtos.filter(p => 
        p.nome.toLowerCase().includes(searchTerm) ||
        p.categoria.toLowerCase().includes(searchTerm)
    );
    
    renderEstoqueTable(filtered);
}

// ==================== PDV ====================
function loadProductsForPDV() {
    const produtos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUTOS)) || [];
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    if (produtos.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Nenhum produto cadastrado. Adicione produtos em Estoque.</p>';
        return;
    }

    produtos.forEach(produto => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'product-btn';
        btn.innerHTML = `
            <i class="bi bi-bag-plus"></i>
            <h4>${produto.nome}</h4>
            <p>R$ ${produto.preco.toFixed(2)}</p>
        `;
        btn.onclick = () => addToCart(produto);
        grid.appendChild(btn);
    });
}

function loadClientsForPDV() {
    const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
    const select = document.getElementById('clientSelect');
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">Venda sem cliente</option>';
    
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = cliente.nome;
        select.appendChild(option);
    });
    
    select.value = currentValue;
}

function addToCart(produto) {
    let carrinho = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARRINHO)) || [];
    
    const existingItem = carrinho.find(item => item.id === produto.id);
    
    if (existingItem) {
        existingItem.quantidade += 1;
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: 1
        });
    }
    
    localStorage.setItem(STORAGE_KEYS.CARRINHO, JSON.stringify(carrinho));
    loadCartUI();
}

function loadCartUI() {
    const carrinho = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARRINHO)) || [];
    const cartContainer = document.getElementById('cartItems');
    cartContainer.innerHTML = '';

    if (carrinho.length === 0) {
        cartContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Carrinho vazio</p>';
        updateCartTotal();
        return;
    }

    carrinho.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.nome}</h4>
                <p>R$ ${(item.preco * item.quantidade).toFixed(2)}</p>
            </div>
            <div class="cart-item-controls">
                <button type="button" onclick="updateCartQuantity('${item.id}', ${item.quantidade - 1})">-</button>
                <span>${item.quantidade}</span>
                <button type="button" onclick="updateCartQuantity('${item.id}', ${item.quantidade + 1})">+</button>
                <button type="button" class="cart-item-remove" onclick="removeFromCart('${item.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        cartContainer.appendChild(itemDiv);
    });

    updateCartTotal();
}

function updateCartQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    let carrinho = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARRINHO)) || [];
    const item = carrinho.find(i => i.id === productId);
    if (item) {
        item.quantidade = newQuantity;
    }
    localStorage.setItem(STORAGE_KEYS.CARRINHO, JSON.stringify(carrinho));
    loadCartUI();
}

function removeFromCart(productId) {
    let carrinho = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARRINHO)) || [];
    carrinho = carrinho.filter(item => item.id !== productId);
    localStorage.setItem(STORAGE_KEYS.CARRINHO, JSON.stringify(carrinho));
    loadCartUI();
}

function updateCartTotal() {
    const carrinho = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARRINHO)) || [];
    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    
    document.getElementById('subtotal').textContent = `R$ ${total.toFixed(2)}`;
    document.getElementById('total').textContent = `R$ ${total.toFixed(2)}`;
}

function updateClientInfo() {
    const clientId = document.getElementById('clientSelect').value;
    const clientInfoDiv = document.getElementById('clientInfo');
    
    if (!clientId) {
        clientInfoDiv.style.display = 'none';
        return;
    }

    const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
    const cliente = clientes.find(c => c.id === clientId);

    if (cliente) {
        const tipoBadge = getClientTypeBadge(cliente.tipo);
        clientInfoDiv.innerHTML = `
            <div class="client-name">${cliente.nome}</div>
            <span class="client-type ${cliente.tipo}">${tipoBadge}</span>
            ${cliente.tipo === 'prepago' ? `<p style="margin-top: 8px; font-size: 11px;">Saldo: R$ ${cliente.saldo.toFixed(2)}</p>` : ''}
        `;
        clientInfoDiv.style.display = 'block';
    }
}

function updatePaymentMethod() {
}

function checkout() {
    const carrinho = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARRINHO)) || [];
    
    if (carrinho.length === 0) {
        alert('Adicione produtos ao carrinho!');
        return;
    }

    const clientId = document.getElementById('clientSelect').value;
    const pagamento = document.querySelector('input[name="payment"]:checked').value;
    
    let clienteInfo = null;
    if (clientId) {
        const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
        clienteInfo = clientes.find(c => c.id === clientId);
    }

    if (clienteInfo && clienteInfo.tipo === 'fiado' && pagamento !== 'fiado') {
        alert('Cliente Fiado deve pagar em Fiado!');
        return;
    }

    if (clienteInfo && clienteInfo.tipo === 'prepago' && pagamento === 'fiado') {
        alert('Cliente Pré-Pago não pode pagar em Fiado!');
        return;
    }

    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);

    if (clienteInfo && clienteInfo.tipo === 'prepago' && clienteInfo.saldo < total) {
        alert(`Saldo insuficiente! Saldo disponível: R$ ${clienteInfo.saldo.toFixed(2)}`);
        return;
    }

    const vendas = JSON.parse(localStorage.getItem(STORAGE_KEYS.VENDAS)) || [];
    
    const novaVenda = {
        id: Date.now().toString(),
        data: new Date().toLocaleString('pt-BR'),
        cliente: clienteInfo ? clienteInfo.nome : 'Não informado',
        clienteId: clientId || null,
        clienteTipo: clienteInfo ? clienteInfo.tipo : null,
        produtos: carrinho,
        valor: total,
        pagamento: pagamento
    };

    vendas.push(novaVenda);
    localStorage.setItem(STORAGE_KEYS.VENDAS, JSON.stringify(vendas));

    if (clienteInfo && clienteInfo.tipo === 'prepago') {
        let clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
        const clienteIndex = clientes.findIndex(c => c.id === clienteInfo.id);
        if (clienteIndex !== -1) {
            clientes[clienteIndex].saldo -= total;
            localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
            loadClientsForPDV();
        }
    }

    localStorage.setItem(STORAGE_KEYS.CARRINHO, JSON.stringify([]));
    document.getElementById('clientSelect').value = '';
    updateClientInfo();
    loadCartUI();
    updateKPIs();

    alert('Venda finalizada com sucesso!');
}

// ==================== RELATÓRIOS ====================
function loadVendas() {
    const vendas = JSON.parse(localStorage.getItem(STORAGE_KEYS.VENDAS)) || [];
    renderVendasTable(vendas);
}

function renderVendasTable(vendas) {
    const tbody = document.getElementById('vendasList');
    tbody.innerHTML = '';

    if (vendas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Nenhuma venda registrada</td></tr>';
        return;
    }

    vendas.forEach(venda => {
        const row = document.createElement('tr');
        const produtosText = venda.produtos.map(p => `${p.nome} (${p.quantidade})`).join(', ');
        const pagamentoLabel = {
            'dinheiro': 'Dinheiro',
            'cartao': 'Cartão',
            'fiado': 'Fiado'
        }[venda.pagamento] || venda.pagamento;

        row.innerHTML = `
            <td>${venda.data}</td>
            <td>${venda.cliente}</td>
            <td>${produtosText}</td>
            <td>R$ ${venda.valor.toFixed(2)}</td>
            <td>${pagamentoLabel}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateRelatorios() {
    const vendas = JSON.parse(localStorage.getItem(STORAGE_KEYS.VENDAS)) || [];
    const produtos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUTOS)) || [];
    
    let totalVendas = vendas.length;
    let totalFaturamento = 0;
    let totalFiado = 0;
    let totalPrepago = 0;

    vendas.forEach(venda => {
        totalFaturamento += venda.valor;
        if (venda.pagamento === 'fiado') {
            totalFiado += venda.valor;
        }
    });

    const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0;

    document.getElementById('relFaturamento').textContent = `R$ ${totalFaturamento.toFixed(2)}`;
    document.getElementById('relLucro').textContent = `R$ ${(totalFaturamento * 0.3).toFixed(2)}`;
    document.getElementById('relTicket').textContent = `R$ ${ticketMedio.toFixed(2)}`;
    document.getElementById('relTransacoes').textContent = totalVendas;

    renderProdutosVendidos(vendas);
    loadVendas();
}

function renderProdutosVendidos(vendas) {
    const produtosMap = {};
    
    vendas.forEach(venda => {
        venda.produtos.forEach(produto => {
            if (!produtosMap[produto.id]) {
                produtosMap[produto.id] = {
                    nome: produto.nome,
                    quantidade: 0,
                    valor: 0
                };
            }
            produtosMap[produto.id].quantidade += produto.quantidade;
            produtosMap[produto.id].valor += produto.preco * produto.quantidade;
        });
    });

    const produtos = Object.values(produtosMap).sort((a, b) => b.valor - a.valor).slice(0, 5);
    const totalFaturamento = Object.values(produtosMap).reduce((sum, p) => sum + p.valor, 0);

    const tbody = document.getElementById('produtosVendidosList');
    tbody.innerHTML = '';

    if (produtos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Nenhum produto vendido</td></tr>';
        return;
    }

    produtos.forEach(produto => {
        const row = document.createElement('tr');
        const percentual = totalFaturamento > 0 ? (produto.valor / totalFaturamento * 100) : 0;
        row.innerHTML = `
            <td>${produto.nome}</td>
            <td>${produto.quantidade} unidades</td>
            <td>R$ ${produto.valor.toFixed(2)}</td>
            <td>R$ ${(produto.valor / produto.quantidade).toFixed(2)}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="flex: 1; height: 6px; background-color: #334155; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${percentual}%; height: 100%; background: linear-gradient(90deg, #3b82f6 0%, #1e40af 100%);"></div>
                    </div>
                    <span>${percentual.toFixed(1)}%</span>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function exportPDF() {
    alert('Funcionalidade de exportação em desenvolvimento!');
}

// ==================== LOGOUT ====================
function logout() {
    if (confirm('Deseja sair do sistema?')) {
        alert('Saindo do sistema...');
    }
}
