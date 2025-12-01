// ==================== STORAGE ====================
const STORAGE_KEYS = {
    CLIENTES: 'acampamento_clientes',
    PRODUTOS: 'acampamento_produtos',
    VENDAS: 'acampamento_vendas',
    CARRINHO: 'acampamento_carrinho',
};

// ==================== VARIÁVEIS GLOBAIS ====================
let currentEditingClientId = null;
let currentEditingProductId = null;
let pendingAction = null;

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

// ==================== CUSTOM MODAL ====================
function showNotification(type, message, title = 'Notificação') {
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    if (type === 'success') {
        confirmBtn.style.display = 'none';
        cancelBtn.textContent = 'Fechar';
        cancelBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else if (type === 'error') {
        confirmBtn.style.display = 'none';
        cancelBtn.textContent = 'Fechar';
        cancelBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else if (type === 'info') {
        confirmBtn.style.display = 'none';
        cancelBtn.textContent = 'Fechar';
        cancelBtn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
    }

    modal.style.display = 'flex';
    pendingAction = null;
}

function showConfirmation(message, title, onConfirm) {
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    confirmBtn.style.display = 'block';
    confirmBtn.textContent = 'Confirmar';
    confirmBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

    pendingAction = onConfirm;
    modal.style.display = 'flex';
}

function confirmAction() {
    if (pendingAction) {
        pendingAction();
    }
    closeCustomModal();
}

function closeCustomModal() {
    document.getElementById('customModal').style.display = 'none';
    pendingAction = null;
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
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    const isOpen = sidebar.classList.toggle('show');
    overlay.style.display = isOpen ? 'block' : 'none';
}

// Fechar ao clicar no overlay
document.getElementById('sidebarOverlay').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    sidebar.classList.remove('show');
    overlay.style.display = 'none';
});

// Fechar ao clicar em qualquer item do menu
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        sidebar.classList.remove('show');
        overlay.style.display = 'none';
    });
});




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
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">Nenhum cliente cadastrado</td></tr>';
        return;
    }

    clientes.forEach(cliente => {
        const row = document.createElement('tr');
        const tipoBadge = getClientTypeBadge(cliente.tipo);
        const acampanteText = cliente.acampante ? 'Sim' : 'Não';

        const saldoExibido = cliente.tipo === 'fiado'
            ? `- R$ ${cliente.saldo.toFixed(2)}`
            : `R$ ${cliente.saldo.toFixed(2)}`;

        row.innerHTML = `
            <td>${cliente.nome}</td>
            <td>${cliente.email || '-'}</td>
            <td>${cliente.telefone}</td>
            <td>${cliente.responsavel || '-'}</td>
            <td>${acampanteText}</td>
            <td><span class="client-type ${cliente.tipo}">${tipoBadge}</span></td>
            <td>${saldoExibido}</td>
            <td>
                <button class="btn-edit" onclick="editCliente('${cliente.id}')">
                    <i class="bi bi-pencil"></i> Editar
                </button>

                <button class="btn-delete" onclick="deleteClienteConfirm('${cliente.id}')">
                    <i class="bi bi-trash"></i> Deletar
                </button>

                ${cliente.tipo === 'fiado' && cliente.saldo > 0 ? `
                    <button class="btn-pay" onclick="abrirPagamentoFiado('${cliente.id}')">
                        <i class="bi bi-cash"></i> Quitar
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

let clienteFiadoAtual = null;

function abrirPagamentoFiado(id) {
    const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
    clienteFiadoAtual = clientes.find(c => c.id === id);

    if (!clienteFiadoAtual) return;

    document.getElementById('textoSaldoFiado').innerText = 
        `Saldo atual: R$ ${clienteFiadoAtual.saldo.toFixed(2)}`;

    document.getElementById('valorPagamentoFiado').value = '';
    document.getElementById('modalPagamentoFiado').style.display = 'block';
}

function fecharPagamentoFiado() {
    document.getElementById('modalPagamentoFiado').style.display = 'none';
    clienteFiadoAtual = null;
}

function confirmarPagamentoFiado() {
    let valor = parseFloat(document.getElementById('valorPagamentoFiado').value);

    if (isNaN(valor) || valor <= 0) {
        showNotification('error', 'Informe um valor válido!', 'Erro');
        return;
    }

    let clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
    const index = clientes.findIndex(c => c.id === clienteFiadoAtual.id);

    if (index === -1) return;

    if (valor > clientes[index].saldo) {
        showNotification('error', 'O valor excede o saldo devedor!', 'Erro');
        return;
    }

    clientes[index].saldo -= valor;

    if (clientes[index].saldo < 0) clientes[index].saldo = 0;

    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));

    fecharPagamentoFiado();
    loadClientes();
    loadClientsForPDV();

    showNotification('success', 'Pagamento registrado com sucesso!', 'Sucesso');
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
    currentEditingClientId = null;
    document.getElementById('clientFormTitle').textContent = 'Adicionar Cliente';
    document.getElementById('clientNome').value = '';
    document.getElementById('clientTelefone').value = '';
    document.getElementById('clientResponsavel').value = '';
    document.getElementById('clientAcampante').checked = false;
    document.getElementById('clientTipo').value = '';
    document.getElementById('clientDeposito').value = '';
    document.getElementById('clientDeposito').style.display = 'none';
    document.getElementById('clientFormModal').style.display = 'flex';
}

function closeClientForm() {
    document.getElementById('clientFormModal').style.display = 'none';
    currentEditingClientId = null;
}

function editCliente(id) {
    const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
    const cliente = clientes.find(c => c.id === id);
    
    if (!cliente) {
        showNotification('error', 'Cliente não encontrado', 'Erro');
        return;
    }

    currentEditingClientId = id;
    document.getElementById('clientFormTitle').textContent = 'Editar Cliente';
    document.getElementById('clientNome').value = cliente.nome;
    
    document.getElementById('clientTelefone').value = cliente.telefone;
    document.getElementById('clientResponsavel').value = cliente.responsavel || '';
    document.getElementById('clientAcampante').checked = cliente.acampante || false;
    document.getElementById('clientTipo').value = cliente.tipo;
    
    if (cliente.tipo === 'prepago') {
        document.getElementById('clientDeposito').style.display = 'block';
        document.getElementById('clientDeposito').value = cliente.saldo;
    } else {
        document.getElementById('clientDeposito').style.display = 'none';
    }

    document.getElementById('clientFormModal').style.display = 'flex';
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
    
    const clientData = {
        nome: document.getElementById('clientNome').value,
        email: document.getElementById('clientEmail').value,
        telefone: document.getElementById('clientTelefone').value,
        responsavel: document.getElementById('clientResponsavel').value,
        acampante: document.getElementById('clientAcampante').checked,
        tipo: document.getElementById('clientTipo').value,
        saldo: document.getElementById('clientTipo').value === 'prepago' 
            ? parseFloat(document.getElementById('clientDeposito').value) 
            : 0
    };

    if (currentEditingClientId) {
        const index = clientes.findIndex(c => c.id === currentEditingClientId);
        if (index !== -1) {
            clientes[index] = { ...clientes[index], ...clientData };
        }
    } else {
        const newClient = {
            id: Date.now().toString(),
            ...clientData
        };
        clientes.push(newClient);
    }

    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
    
    closeClientForm();
    loadClientes();
    loadClientsForPDV();
    
    const message = currentEditingClientId ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!';
    showNotification('success', message, 'Sucesso');
}

function deleteClienteConfirm(id) {
    showConfirmation('Deseja realmente deletar este cliente?', 'Confirmar Exclusão', () => {
        deleteCliente(id);
    });
}

function deleteCliente(id) {
    let clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
    clientes = clientes.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
    loadClientes();
    loadClientsForPDV();
    showNotification('success', 'Cliente deletado com sucesso!', 'Sucesso');
}

function filterClientes() {
    const searchTerm = document.getElementById('searchClientes').value.toLowerCase();
    const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
    
    const filtered = clientes.filter(c => 
        c.nome.toLowerCase().includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm)) ||
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
                <button class="btn-delete" onclick="deleteProductConfirm('${produto.id}')">
                    <i class="bi bi-trash"></i> Deletar
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openProductForm(id = null) {
    currentEditingProductId = id;

    document.getElementById('productFormModal').style.display = 'flex';

    if (id) {
        const produtos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUTOS)) || [];
        const produto = produtos.find(p => p.id === id);

        document.getElementById('productFormTitle').textContent = 'Editar Produto';
        document.getElementById('productNome').value = produto.nome;
        document.getElementById('productQuantidade').value = produto.quantidade;
        document.getElementById('productPreco').value = produto.preco;
        document.getElementById('productEstoqueMinimo').value = produto.estoqueMinimo;

    } else {
        document.getElementById('productFormTitle').textContent = 'Adicionar Produto';
        document.getElementById('productNome').value = '';
        document.getElementById('productQuantidade').value = '';
        document.getElementById('productPreco').value = '';
        document.getElementById('productEstoqueMinimo').value = '';
    }
}


function closeProductForm() {
    document.getElementById('productFormModal').style.display = 'none';
    currentEditingProductId = null;
}

function editProduto(id) {
    const produtos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUTOS)) || [];
    const produto = produtos.find(p => p.id === id);
    
    if (!produto) {
        showNotification('error', 'Produto não encontrado', 'Erro');
        return;
    }

    currentEditingProductId = id;
    document.getElementById('productFormTitle').textContent = 'Editar Produto';
    document.getElementById('productNome').value = produto.nome;
    document.getElementById('productCategoria').value = produto.categoria;
    document.getElementById('productQuantidade').value = produto.quantidade;
    document.getElementById('productPreco').value = produto.preco;
    document.getElementById('productEstoqueMinimo').value = produto.estoque_minimo;
    document.getElementById('productFormModal').style.display = 'flex';
}

function saveProduct(event) {
    event.preventDefault();
    
    const produtos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUTOS)) || [];
    
    const productData = {
        nome: document.getElementById('productNome').value,
        quantidade: parseInt(document.getElementById('productQuantidade').value),
        preco: parseFloat(document.getElementById('productPreco').value),
        estoque_minimo: parseInt(document.getElementById('productEstoqueMinimo').value)
    };

    if (currentEditingProductId) {
        const index = produtos.findIndex(p => p.id === currentEditingProductId);
        if (index !== -1) {
            produtos[index] = { ...produtos[index], ...productData };
        }
    } else {
        const newProduct = {
            id: Date.now().toString(),
            ...productData
        };
        produtos.push(newProduct);
    }

    localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify(produtos));
    
    closeProductForm();
    loadProdutos();
    loadProductsForPDV();
    
    const message = currentEditingProductId ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!';
    showNotification('success', message, 'Sucesso');
}

function deleteProductConfirm(id) {
    showConfirmation('Deseja realmente deletar este produto?', 'Confirmar Exclusão', () => {
        deleteProduto(id);
    });
}

function deleteProduto(id) {
    let produtos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUTOS)) || [];
    produtos = produtos.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify(produtos));
    loadProdutos();
    loadProductsForPDV();
    showNotification('success', 'Produto deletado com sucesso!', 'Sucesso');
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
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Nenhum produto disponível</p>';
        return;
    }

    produtos.forEach(produto => {
        const btn = document.createElement('button');
        btn.className = 'product-btn';
        btn.type = 'button';
        btn.innerHTML = `
            <i class="bi bi-bag-plus"></i>
            <h4>${produto.nome}</h4>
            <p>R$ ${produto.preco.toFixed(2)}</p>
        `;
        btn.onclick = () => addToCart(produto);
        grid.appendChild(btn);
    });
}

function filtrarClientes() {
    const filtro = document.getElementById('filtroClientes').value;
    const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];

    let clientesFiltrados = clientes;

    if (filtro !== 'todos') {
        clientesFiltrados = clientes.filter(c => c.tipo === filtro);
    }

    renderClientesTable(clientesFiltrados);
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
    const carrinho = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARRINHO)) || [];
    
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
        itemExistente.quantidade += 1;
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
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';

    let total = 0;

    carrinho.forEach((item, index) => {
        const itemTotal = item.preco * item.quantidade;
        total += itemTotal;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.nome}</h4>
                <p>R$ ${item.preco.toFixed(2)}</p>
            </div>
            <div class="cart-item-controls">
                <button onclick="decreaseQuantity(${index})">-</button>
                <span>${item.quantidade}</span>
                <button onclick="increaseQuantity(${index})">+</button>
                <button class="cart-item-remove" onclick="removeFromCart(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        cartItems.appendChild(itemDiv);
    });

    document.getElementById('subtotal').textContent = `R$ ${total.toFixed(2)}`;
    document.getElementById('total').textContent = `R$ ${total.toFixed(2)}`;
}

function increaseQuantity(index) {
    const carrinho = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARRINHO)) || [];
    if (carrinho[index]) {
        carrinho[index].quantidade += 1;
        localStorage.setItem(STORAGE_KEYS.CARRINHO, JSON.stringify(carrinho));
        loadCartUI();
    }
}

function decreaseQuantity(index) {
    const carrinho = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARRINHO)) || [];
    if (carrinho[index] && carrinho[index].quantidade > 1) {
        carrinho[index].quantidade -= 1;
        localStorage.setItem(STORAGE_KEYS.CARRINHO, JSON.stringify(carrinho));
        loadCartUI();
    }
}

function removeFromCart(index) {
    const carrinho = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARRINHO)) || [];
    carrinho.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.CARRINHO, JSON.stringify(carrinho));
    loadCartUI();
}

function updateClientInfo() {
    const clientId = document.getElementById('clientSelect').value;
    const clientInfo = document.getElementById('clientInfo');
    
    if (!clientId) {
        clientInfo.style.display = 'none';
        return;
    }

    const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
    const cliente = clientes.find(c => c.id === clientId);

    if (cliente) {
        clientInfo.innerHTML = `
            <div class="client-name">${cliente.nome}</div>
            <span class="client-type ${cliente.tipo}">${getClientTypeBadge(cliente.tipo)}</span>
            <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">
                Saldo: R$ ${cliente.saldo.toFixed(2)}
            </div>
        `;
        clientInfo.style.display = 'block';
    }
}

function updatePaymentMethod() {
    // Placeholder para futuras validações
}

function checkout() {
    const carrinho = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARRINHO)) || [];

    if (carrinho.length === 0) {
        showNotification('error', 'Carrinho vazio! Adicione produtos antes de finalizar.', 'Erro');
        return;
    }

    const clientId = document.getElementById('clientSelect').value || null;
    const pagamento = document.querySelector('input[name="payment"]:checked').value;
    const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
    const clienteInfo = clientId ? clientes.find(c => c.id === clientId) : null;

    // --- CALCULAR TOTAL ---
    let total = 0;
    carrinho.forEach(item => {
        total += item.preco * item.quantidade;
    });

    // --- VALIDAÇÃO PRÉ-PAGO ---
    if (clienteInfo && clienteInfo.tipo === 'prepago' && clienteInfo.saldo < total) {
        showNotification('error', 'Saldo insuficiente para esta transação!', 'Erro');
        return;
    }

    // --- CRIAÇÃO DA VENDA ---
    const vendas = JSON.parse(localStorage.getItem(STORAGE_KEYS.VENDAS)) || [];
    const now = new Date();

    const novaVenda = {
        id: Date.now().toString(),
        data: now.getTime(),
        dataFormatada: now.toLocaleString('pt-BR'),
        cliente: clienteInfo ? clienteInfo.nome : 'Não informado',
        clienteId: clientId || null,
        clienteTipo: clienteInfo ? clienteInfo.tipo : null,
        produtos: carrinho,
        valor: total,
        pagamento: pagamento
    };

    vendas.push(novaVenda);
    localStorage.setItem(STORAGE_KEYS.VENDAS, JSON.stringify(vendas));

    // --- ATUALIZAR ESTOQUE ---
    let produtos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUTOS)) || [];

    carrinho.forEach(itemCarrinho => {
        const produtoIndex = produtos.findIndex(p => p.id === itemCarrinho.id);
        if (produtoIndex !== -1) {
            produtos[produtoIndex].quantidade -= itemCarrinho.quantidade;

            // Evitar estoque negativo
            if (produtos[produtoIndex].quantidade < 0) {
                produtos[produtoIndex].quantidade = 0;
            }
        }
    });

    localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify(produtos));

    // --- ATUALIZAR SALDO DO CLIENTE ---
    if (clienteInfo) {
        let clientesAtualizado = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || [];
        const clienteIndex = clientesAtualizado.findIndex(c => c.id === clienteInfo.id);

        if (clienteIndex !== -1) {
            if (clienteInfo.tipo === 'prepago') {
                clientesAtualizado[clienteIndex].saldo -= total;
            } else if (clienteInfo.tipo === 'fiado') {
                clientesAtualizado[clienteIndex].saldo += total;
            }

            localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientesAtualizado));
        }
    }

    // --- LIMPAR CARRINHO ---
    localStorage.setItem(STORAGE_KEYS.CARRINHO, JSON.stringify([]));
    document.getElementById('clientSelect').value = '';
    updateClientInfo();

    // --- RECARREGAR TELAS ---
    loadCartUI();
    loadClientes();
    loadClientsForPDV();
    loadProdutos();
    renderEstoqueTable(JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUTOS)));

    // --- KPI HOME ---
    updateKPIs();

    // --- FINALIZAÇÃO ---
    showNotification('success', 'Venda finalizada com sucesso!', 'Sucesso');
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
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Nenhuma venda registrada</td></tr>';
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
            <td>${venda.dataFormatada || venda.data}</td>
            <td>${venda.cliente}</td>
            <td>${produtosText}</td>
            <td>R$ ${venda.valor.toFixed(2)}</td>
            <td>${pagamentoLabel}</td>
            <td>
                <button class="btn-edit" onclick="editVenda('${venda.id}')" style="padding: 6px 12px;">
                    <i class="bi bi-pencil"></i> Editar
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editVenda(id) {
    showNotification('info', 'Funcionalidade de edição de vendas em desenvolvimento', 'Informação');
}

function getVendasByPeriod(period) {
    const vendas = JSON.parse(localStorage.getItem(STORAGE_KEYS.VENDAS)) || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return vendas.filter(venda => {
        const vendaDate = typeof venda.data === 'number' ? new Date(venda.data) : new Date();
        const vendaDay = new Date(vendaDate.getFullYear(), vendaDate.getMonth(), vendaDate.getDate());

        switch(period) {
            case 'today':
                return vendaDay.getTime() === today.getTime();
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return vendaDay >= weekAgo && vendaDay <= today;
            case 'month':
                return vendaDate.getMonth() === now.getMonth() && vendaDate.getFullYear() === now.getFullYear();
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                const vendaQuarter = Math.floor(vendaDate.getMonth() / 3);
                return vendaQuarter === quarter && vendaDate.getFullYear() === now.getFullYear();
            case 'year':
                return vendaDate.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    });
}

function updateRelatorios() {
    const period = document.getElementById('periodSelect').value;
    const vendas = getVendasByPeriod(period);
    const produtos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUTOS)) || [];
    
    let totalVendas = vendas.length;
    let totalFaturamento = 0;
    let totalFiado = 0;
    let totalDinheiro = 0;
    let totalCartao = 0;

    vendas.forEach(venda => {
        totalFaturamento += venda.valor;
        if (venda.pagamento === 'fiado') {
            totalFiado += venda.valor;
        } else if (venda.pagamento === 'dinheiro') {
            totalDinheiro += venda.valor;
        } else if (venda.pagamento === 'cartao') {
            totalCartao += venda.valor;
        }
    });

    const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0;
    const lucro = totalFaturamento * 0.3;

    document.getElementById('relFaturamento').textContent = `R$ ${totalFaturamento.toFixed(2)}`;
    document.getElementById('relLucro').textContent = `R$ ${lucro.toFixed(2)}`;
    document.getElementById('relTicket').textContent = `R$ ${ticketMedio.toFixed(2)}`;
    document.getElementById('relTransacoes').textContent = totalVendas;

    renderProdutosVendidos(vendas);
    renderVendasTable(vendas);
    
    // Gráfico de Vendas por Período
    renderChartVendas(vendas);
    
    // Gráfico de Formas de Pagamento
    renderChartPagamento(totalDinheiro, totalCartao, totalFiado);
}

function renderChartVendas(vendas) {
    const ctx = document.getElementById('chartVendas');
    if (!ctx) return;

    // Agrupar vendas por dia
    const vendasPorDia = {};
    vendas.forEach(venda => {
        const vendaDate = typeof venda.data === 'number' ? new Date(venda.data) : new Date();
        const data = vendaDate.toLocaleDateString('pt-BR');
        if (!vendasPorDia[data]) {
            vendasPorDia[data] = 0;
        }
        vendasPorDia[data] += venda.valor;
    });

    const labels = Object.keys(vendasPorDia).sort();
    const data = labels.map(label => vendasPorDia[label]);

    // Destruir gráfico anterior se existir
    if (window.chartVendasInstance) {
        window.chartVendasInstance.destroy();
    }

    window.chartVendasInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas (R$)',
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#cbd5e1'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#cbd5e1',
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(0);
                        }
                    },
                    grid: {
                        color: 'rgba(51, 65, 85, 0.3)'
                    }
                },
                x: {
                    ticks: {
                        color: '#cbd5e1'
                    },
                    grid: {
                        color: 'rgba(51, 65, 85, 0.3)'
                    }
                }
            }
        }
    });
}

function renderChartPagamento(dinheiro, cartao, fiado) {
    const ctx = document.getElementById('chartPagamento');
    if (!ctx) return;

    const total = dinheiro + cartao + fiado;

    // Destruir gráfico anterior se existir
    if (window.chartPagamentoInstance) {
        window.chartPagamentoInstance.destroy();
    }

    window.chartPagamentoInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Dinheiro', 'Cartão', 'Fiado'],
            datasets: [{
                data: [dinheiro, cartao, fiado],
                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#f59e0b'
                ],
                borderColor: '#0f172a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#cbd5e1'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
                            return `R$ ${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
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
    showNotification('info', 'Funcionalidade de exportação em desenvolvimento', 'Informação');
}

// ==================== LOGOUT ====================
function confirmLogout() {
    showConfirmation('Deseja realmente sair do sistema?', 'Confirmar Saída', () => {
        logout();
    });
}

function logout() {
    showNotification('info', 'Você saiu do sistema', 'Saída');
    // Aqui você pode redirecionar para uma página de login ou fazer outras ações
}
