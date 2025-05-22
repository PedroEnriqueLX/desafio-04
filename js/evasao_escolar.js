document.addEventListener('DOMContentLoaded', function () {
    const motivosLoading = document.getElementById('motivosLoading')
    const motivosError = document.getElementById('motivosError')
    const estadosLoading = document.getElementById('estadosLoading')
    const estadosError = document.getElementById('estadosError')
    const selectRegiao = document.getElementById('regiao')
    
    // armazenar as instâncias dos gráficos
    let graficoDistorcao = null
    let graficoAbandono = null
    
    const baseURL = 'https://api.qedu.org.br/v1'
    const token = 'uCepcSkwipY8IqOGft3XWe8RWvUTyjr94abLkYN6'

    const anos = [2013, 2015, 2017, 2019]

    const estados = [
   
        { id: 12, nome: 'Acre', regiao: 'norte' },
        { id: 16, nome: 'Amapá', regiao: 'norte' },
        { id: 13, nome: 'Amazonas', regiao: 'norte' },
        { id: 15, nome: 'Pará', regiao: 'norte' },
        { id: 11, nome: 'Rondônia', regiao: 'norte' },
        { id: 14, nome: 'Roraima', regiao: 'norte' },
        { id: 17, nome: 'Tocantins', regiao: 'norte' },
        
        { id: 27, nome: 'Alagoas', regiao: 'nordeste' },
        { id: 29, nome: 'Bahia', regiao: 'nordeste' },
        { id: 23, nome: 'Ceará', regiao: 'nordeste' },
        { id: 21, nome: 'Maranhão', regiao: 'nordeste' },
        { id: 25, nome: 'Paraíba', regiao: 'nordeste' },
        { id: 26, nome: 'Pernambuco', regiao: 'nordeste' },
        { id: 22, nome: 'Piauí', regiao: 'nordeste' },
        { id: 24, nome: 'Rio Grande do Norte', regiao: 'nordeste' },
        { id: 28, nome: 'Sergipe', regiao: 'nordeste' },

        { id: 53, nome: 'Distrito Federal', regiao: 'centro-oeste' },
        { id: 52, nome: 'Goiás', regiao: 'centro-oeste' },
        { id: 51, nome: 'Mato Grosso', regiao: 'centro-oeste' },
        { id: 50, nome: 'Mato Grosso do Sul', regiao: 'centro-oeste' },

        { id: 32, nome: 'Espírito Santo', regiao: 'sudeste' },
        { id: 31, nome: 'Minas Gerais', regiao: 'sudeste' },
        { id: 33, nome: 'Rio de Janeiro', regiao: 'sudeste' },
        { id: 35, nome: 'São Paulo', regiao: 'sudeste' },

        { id: 41, nome: 'Paraná', regiao: 'sul' },
        { id: 43, nome: 'Rio Grande do Sul', regiao: 'sul' },
        { id: 42, nome: 'Santa Catarina', regiao: 'sul' }
    ]

    const options = {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        timeout: 10000
    }

    function filtrarEstadosPorRegiao(regiao) {
        return estados.filter(estado => estado.regiao === regiao)
    }

    // buscar dados de distorção idade-série para um ano específico
    async function buscarDadosDistorcaoAno(ano, estado, tentativa = 1) {
        const maxTentativas = 3
        const params = {
            ibge_id: estado.id,
            ano: ano,
            dependencia_id: 0,
            localizacao_id: 0
        }

        try {
            console.log('Buscando dados de distorção:', params)
            const response = await axios.get(`${baseURL}/indicador/dis/territorio`, { ...options, params })
            console.log('Resposta da API de distorção:', response.data)
            
            if (!response.data || !response.data.data || response.data.data.length === 0) {
                throw new Error(`Nenhum dado encontrado para o ano ${ano}`)
            }
            
            const taxaDistorcao = response.data.data[0].em_total
            console.log('Taxa de distorção:', taxaDistorcao)
            
            return {
                ano: ano,
                valor: taxaDistorcao
            }
        } catch (error) {
            console.error(`Erro ao buscar dados de distorção do ano ${ano} (tentativa ${tentativa}):`, error)
            
            if (tentativa < maxTentativas) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, tentativa - 1) * 1000))
                return buscarDadosDistorcaoAno(ano, estado, tentativa + 1)
            }

            return {
                ano: ano,
                valor: null
            }
        }
    }

    // buscar dados de abandono para um ano específico
    async function buscarDadosAbandonoAno(ano, estado, tentativa = 1) {
        const maxTentativas = 3
        const params = {
            ibge_id: estado.id,
            ano: ano,
            dependencia_id: 0,
            localizacao_id: 0
        }

        try {
          
            const response = await axios.get(`${baseURL}/indicador/tr/territorio`, { ...options, params })
         
            
            if (!response.data || !response.data.data || response.data.data.length === 0) {
                throw new Error(`Nenhum dado encontrado para o ano ${ano}`)
            }
            
            const taxaAbandono = parseFloat(response.data.data[0].abandonos)
            console.log('Taxa de abandono:', taxaAbandono)
            
            return {
                ano: ano,
                valor: taxaAbandono
            }
        } catch (error) {
            console.error(`Erro ao buscar dados de abandono do ano ${ano} (tentativa ${tentativa}):`, error)
            
            if (tentativa < maxTentativas) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, tentativa - 1) * 1000))
                return buscarDadosAbandonoAno(ano, estado, tentativa + 1)
            }

            return {
                ano: ano,
                valor: null
            }
        }
    }

    async function buscarDadosPorRegiao(regiao) {
        estadosLoading.style.display = 'block'
        estadosError.style.display = 'none'
        motivosLoading.style.display = 'block'
        motivosError.style.display = 'none'

        try {
            const estadosFiltrados = filtrarEstadosPorRegiao(regiao)
            const estadoSelecionado = estadosFiltrados[0]
            
            // buscar dados de distorção para todos os anos
            const promessasDistorcao = anos.map(ano => buscarDadosDistorcaoAno(ano, estadoSelecionado))
            const resultadosDistorcao = await Promise.all(promessasDistorcao)

            // buscar dados de abandono para todos os anos
            const promessasAbandono = anos.map(ano => buscarDadosAbandonoAno(ano, estadoSelecionado))
            const resultadosAbandono = await Promise.all(promessasAbandono)

            if (resultadosDistorcao.every(r => r.valor === null) || resultadosAbandono.every(r => r.valor === null)) {
                throw new Error('Não foi possível carregar os dados')
            }

            const dadosValidosDistorcao = resultadosDistorcao.map(r => ({
                ...r,
                valor: r.valor === null ? 0 : r.valor
            }))

            const dadosValidosAbandono = resultadosAbandono.map(r => ({
                ...r,
                valor: r.valor === null ? 0 : r.valor
            }))

            atualizarGraficoDistorcao(dadosValidosDistorcao)
            atualizarGraficoAbandono(dadosValidosAbandono)
            
            estadosLoading.style.display = 'none'
            motivosLoading.style.display = 'none'
        } catch (error) {
            console.error('Erro ao buscar dados:', error)
            estadosError.style.display = 'block'
            motivosError.style.display = 'block'
            estadosLoading.style.display = 'none'
            motivosLoading.style.display = 'none'
        }
    }

    // atualizar o gráfico de distorção idade-série
    function atualizarGraficoDistorcao(dados) {
        const ctx = document.getElementById('motivosChart').getContext('2d')
        
        if (graficoDistorcao) {
            graficoDistorcao.destroy()
        }

        const dadosGrafico = {
            labels: dados.map(d => d.ano.toString()),
            datasets: [{
                label: 'Distorção Idade-Série (%)',
                data: dados.map(d => d.valor),
                backgroundColor: '#FF4444',
                borderColor: '#FF4444',
                borderWidth: 1
            }]
        }

        graficoDistorcao = new Chart(ctx, {
            type: 'bar',
            data: dadosGrafico,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: '#E2E2E2'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Distorção Idade-Série',
                        align: 'start',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        })
    }

    // atualizar o gráfico de abandono
    function atualizarGraficoAbandono(dados) {
        const ctx = document.getElementById('estadosChart').getContext('2d')
        
        if (graficoAbandono) {
            graficoAbandono.destroy()
        }

        const dadosGrafico = {
            labels: dados.map(d => d.ano.toString()),
            datasets: [{
                label: 'Taxa de Abandono (%)',
                data: dados.map(d => d.valor),
                backgroundColor: '#FF4444',
                borderColor: '#FF4444',
                borderWidth: 1
            }]
        }

        graficoAbandono = new Chart(ctx, {
            type: 'bar',
            data: dadosGrafico,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        grid: {
                            color: '#E2E2E2'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Taxa de Abandono',
                        align: 'start',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        })
    }

    // Event listener pra mudança de região
    selectRegiao.addEventListener('change', function() {
        buscarDadosPorRegiao(this.value)
    })

    buscarDadosPorRegiao(selectRegiao.value)
});
