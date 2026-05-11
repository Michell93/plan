// Carrega lançamentos do localStorage ou inicia vazio
let lancamentosPorMes = JSON.parse(
  localStorage.getItem("lancamentosPorMes"),
) || {
  janeiro: [],
  fevereiro: [],
  marco: [],
  abril: [],
  maio: [],
  junho: [],
  julho: [],
  agosto: [],
  setembro: [],
  outubro: [],
  novembro: [],
  dezembro: [],
};

let mesAtivo = "janeiro";

// Configuração de ícones e cores por categoria
const categoriaInfo = {
  salario: { icone: "💵", cor: "#28a745" },
  conta: { icone: "🏠", cor: "#dc3545" },
  lazer: { icone: "🎉", cor: "#ff9f40" },
  entretenimento: { icone: "🎬", cor: "#9966ff" },
  transporte: { icone: "🚗", cor: "#36a2eb" },
  alimentacao: { icone: "🍔", cor: "#ffc107" },
  outros: { icone: "📦", cor: "#004d00" },
};

// Atualiza tabela, resumo e gráficos
function atualizarTabela() {
  const corpo = document.getElementById("lancamentos");
  corpo.innerHTML = "";
  let entradas = 0,
    saidas = 0;
  const categorias = {};

  const filtrados = aplicarFiltro(lancamentosPorMes[mesAtivo]);

  filtrados.forEach((l, index) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${l.data}</td>
      <td>${l.tipo}</td>
      <td style="color:${l.cor}">${l.icone} ${l.categoria}</td>
      <td>${l.descricao}</td>
      <td>${l.valor.toFixed(2)}</td>
      <td><button class="btn-excluir" onclick="excluirLancamento(${index})">🗑️</button></td>
    `;
    corpo.appendChild(linha);

    if (l.tipo === "Entrada") {
      entradas += l.valor;
      categorias["salario"] = (categorias["salario"] || 0) + l.valor;
    } else {
      saidas += l.valor;
      categorias[l.categoria] = (categorias[l.categoria] || 0) + l.valor;
    }
  });

  document.getElementById("entradas").textContent = entradas.toFixed(2);
  document.getElementById("saidas").textContent = saidas.toFixed(2);
  document.getElementById("saldo").textContent = (entradas - saidas).toFixed(2);

  atualizarResumoTabela(categorias);
  atualizarGraficos(categorias, filtrados);
  atualizarOpcoesFiltro();
}

// Excluir lançamento
function excluirLancamento(index) {
  lancamentosPorMes[mesAtivo].splice(index, 1);
  localStorage.setItem("lancamentosPorMes", JSON.stringify(lancamentosPorMes));
  atualizarTabela();
}

// Atualiza opções do filtro
function atualizarOpcoesFiltro() {
  const campo = document.getElementById("campoFiltro").value;
  const lancamentos = lancamentosPorMes[mesAtivo];
  let valores = [];

  if (campo === "data") valores = [...new Set(lancamentos.map((l) => l.data))];
  if (campo === "tipo") valores = [...new Set(lancamentos.map((l) => l.tipo))];
  if (campo === "categoria")
    valores = [...new Set(lancamentos.map((l) => l.categoria))];
  if (campo === "descricao")
    valores = [...new Set(lancamentos.map((l) => l.descricao.toLowerCase()))];
  if (campo === "valor")
    valores = [...new Set(lancamentos.map((l) => l.valor.toString()))];

  const selectValor = document.getElementById("valorFiltro");
  const valorAtual = selectValor.value;
  selectValor.innerHTML = `<option value="">Todos</option>`;
  valores.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectValor.appendChild(opt);
  });
  if (valores.includes(valorAtual)) selectValor.value = valorAtual;
}

// Filtra lançamentos
function aplicarFiltro(lancamentos) {
  const campo = document.getElementById("campoFiltro").value;
  const valor = document.getElementById("valorFiltro").value;
  if (valor === "") return lancamentos;
  return lancamentos.filter(
    (l) => l[campo].toString().toLowerCase() === valor.toLowerCase(),
  );
}

// Adiciona novo lançamento
document
  .getElementById("formLancamento")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const mesNome = document.getElementById("mes").value;
    const categoriaSelecionada = document.getElementById("categoria").value;

    const novo = {
      data: document.getElementById("data").value,
      tipo: document.getElementById("tipo").value,
      categoria: categoriaSelecionada,
      descricao: document.getElementById("descricao").value,
      valor: parseFloat(document.getElementById("valor").value),
      icone: categoriaInfo[categoriaSelecionada].icone,
      cor: categoriaInfo[categoriaSelecionada].cor,
    };

    lancamentosPorMes[mesNome].push(novo);
    localStorage.setItem(
      "lancamentosPorMes",
      JSON.stringify(lancamentosPorMes),
    );

    trocarMes(mesNome);
    this.reset();
  });

// Troca de mês
function trocarMes(mes) {
  mesAtivo = mes;
  atualizarTabela();
  const select = document.getElementById("mes");
  const nomeMes = select.options[select.selectedIndex].text;
  document.getElementById("mesResumo").textContent = `Resumo de ${nomeMes}`;
}

// Atualiza tabela de resumo
function atualizarResumoTabela(categorias) {
  const corpoResumo = document.getElementById("linhasResumo");
  if (!corpoResumo) return;
  corpoResumo.innerHTML = "";
  Object.keys(categorias).forEach((cat) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td style="color:${categoriaInfo[cat]?.cor || "#333"}">${categoriaInfo[cat]?.icone || ""} ${cat}</td>
      <td>${categorias[cat].toFixed(2)}</td>
    `;
    corpoResumo.appendChild(linha);
  });
}

// Gráficos com Google Charts
function atualizarGraficos(categorias, filtrados) {
  // Pizza
  const dataPizza = new google.visualization.DataTable();
  dataPizza.addColumn("string", "Categoria");
  dataPizza.addColumn("number", "Valor");
  Object.keys(categorias).forEach((cat) => {
    dataPizza.addRow([cat, categorias[cat]]);
  });
  const chartPizza = new google.visualization.PieChart(
    document.getElementById("graficoPizza"),
  );
  chartPizza.draw(dataPizza, {
    title: "Distribuição por Categoria",
    width: 400,
    height: 300,
  });

  // Linha
  const dataLinha = new google.visualization.DataTable();
  dataLinha.addColumn("string", "Data");
  dataLinha.addColumn("number", "Saldo");
  if (filtrados.length) {
    filtrados.forEach((l, i) => {
      const entradasParciais = filtrados
        .slice(0, i + 1)
        .filter((x) => x.tipo === "Entrada")
        .reduce((a, b) => a + b.valor, 0);
      const saidasParciais = filtrados
        .slice(0, i + 1)
        .filter((x) => x.tipo === "Saída")
        .reduce((a, b) => a + b.valor, 0);
      dataLinha.addRow([l.data, entradasParciais - saidasParciais]);
    });
  } else {
    dataLinha.addRow(["Sem dados", 0]);
  }
  const chartLinha = new google.visualization.LineChart(
    document.getElementById("graficoLinha"),
  );
  chartLinha.draw(dataLinha, {
    title: "Evolução do Saldo",
    curveType: "function",
    legend: { position: "bottom" },
    width: 600,
    height: 300,
  });
}

// Eventos de filtro
document
  .getElementById("campoFiltro")
  .addEventListener("change", atualizarOpcoesFiltro);
document
  .getElementById("valorFiltro")
  .addEventListener("change", atualizarTabela);
// Inicializa ao carregar a página
window.onload = function () {
  document.getElementById("mes").value = mesAtivo;
  trocarMes(mesAtivo);
};
