document.addEventListener('DOMContentLoaded', function () {
    const motivosLoading = document.getElementById('motivosLoading')
    const motivosError = document.getElementById('motivosError')
    const estadosLoading = document.getElementById('estadosLoading')
    const estadosError = document.getElementById('estadosError')
    const selectRegiao = document.getElementById('regiao')
    
    // armazenar as instâncias dos gráficos
    let graficoAnos = null
    let graficoEstados = null
    
    const baseURL = 'https://api.qedu.org.br/v1/ideb'
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

    // dados de um ano específico
    async function buscarDadosAno(ano, tentativa = 1) {
        const maxTentativas = 3
        const params = {
            id: estados[0].id,
            ano: ano,
            dependencia_id: 0,
            ciclo_id: 'AI'
        }

        try {
            const response = await axios.get(baseURL, { ...options, params })
            if (!response.data || !response.data.data || !response.data.data.length) {
                throw new Error(`Nenhum dado encontrado para o ano ${ano}`)
            }
            return {
                ano: ano,
                ideb: response.data.data[0].ideb
            }
        } catch (error) {
            console.error(`Erro ao buscar dados do ano ${ano} (tentativa ${tentativa}):`, error)
            
            if (tentativa < maxTentativas) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, tentativa - 1) * 1000))
                return buscarDadosAno(ano, tentativa + 1)
            }

            return {
                ano: ano,
                ideb: null
            }
        }
    }

    // dados de todos os anos
    async function buscarTodosAnos() {
        motivosLoading.style.display = 'block'
        motivosError.style.display = 'none'

        try {
            const promessas = anos.map(ano => buscarDadosAno(ano))
            const resultados = await Promise.all(promessas)

            if (resultados.every(r => r.ideb === null)) {
                throw new Error('Não foi possível carregar os dados de nenhum ano')
            }

            const dadosValidos = resultados.map(r => ({
                ...r,
                ideb: r.ideb === null ? 0 : r.ideb
            }))

            atualizarGraficoAnos(dadosValidos)
            motivosLoading.style.display = 'none'
        } catch (error) {
            console.error('Erro ao buscar dados dos anos:', error)
            motivosError.style.display = 'block'
            motivosLoading.style.display = 'none'
        }
    }

    function atualizarGraficoAnos(dados) {
        const ctx = document.getElementById('motivosChart').getContext('2d')
        
        if (graficoAnos) {
            graficoAnos.destroy()
        }

        const dadosAnos = {
            labels: dados.map(d => d.ano.toString()),
            datasets: [{
                label: 'IDEB',
                data: dados.map(d => d.ideb),
                backgroundColor: '#FF4444',
                borderColor: '#FF4444',
                borderWidth: 1
            }]
        }

        graficoAnos = new Chart(ctx, {
            type: 'bar',
            data: dadosAnos,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
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
                        text: 'IDEB por Ano',
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

    async function buscarDadosDeUmEstado(estado, tentativa = 1) {
        const maxTentativas = 3
        const params = {
            id: estado.id,
            ano: 2019,
            dependencia_id: 0,
            ciclo_id: 'AI'
        }

        try {
            const response = await axios.get(baseURL, { ...options, params })
            if (!response.data || !response.data.data || !response.data.data.length) {
                throw new Error(`Nenhum dado encontrado para ${estado.nome}`)
            }
            return {
                nome: estado.nome,
                ideb: response.data.data[0].ideb
            }
        } catch (error) {
            console.error(`Erro ao buscar dados de ${estado.nome} (tentativa ${tentativa}):`, error)
            
            if (tentativa < maxTentativas) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, tentativa - 1) * 1000))
                return buscarDadosDeUmEstado(estado, tentativa + 1)
            }

            return {
                nome: estado.nome,
                ideb: null
            }
        }
    }

    async function buscarEstadosPorRegiao(regiao) {
        estadosLoading.style.display = 'block'
        estadosError.style.display = 'none'

        try {
            const estadosFiltrados = filtrarEstadosPorRegiao(regiao)
            const promessas = estadosFiltrados.map(estado => buscarDadosDeUmEstado(estado))
            const resultados = await Promise.all(promessas)

            if (resultados.every(r => r.ideb === null)) {
                throw new Error('Não foi possível carregar os dados de nenhum estado')
            }

            const dadosValidos = resultados.map(r => ({
                ...r,
                ideb: r.ideb === null ? 0 : r.ideb
            }))

            atualizarGraficoEstados(dadosValidos)
            estadosLoading.style.display = 'none'
        } catch (error) {
            console.error('Erro ao buscar dados dos estados:', error)
            estadosError.style.display = 'block'
            estadosLoading.style.display = 'none'
        }
    }

    function atualizarGraficoEstados(dados) {
        const ctx = document.getElementById('estadosChart').getContext('2d')
        
        if (graficoEstados) {
            graficoEstados.destroy()
        }

        const dadosEstados = {
            labels: dados.map(d => d.nome),
            datasets: [{
                label: 'IDEB',
                data: dados.map(d => d.ideb),
                backgroundColor: '#FF4444',
                borderColor: '#FF4444',
                borderWidth: 1
            }]
        }

        graficoEstados = new Chart(ctx, {
            type: 'bar',
            data: dadosEstados,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
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
                        text: 'IDEB por Estado',
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
        buscarEstadosPorRegiao(this.value)
    })

    buscarTodosAnos()
    buscarEstadosPorRegiao(selectRegiao.value) // Usa a região Norte como padrão inicial
});
