document.addEventListener('DOMContentLoaded', function () {
    const selectEstado = document.getElementById('estado')
    const estadoNome = document.getElementById('estado-nome')
    const estadoEscolas = document.getElementById('estado-escolas')
    const estadoBandeira = document.getElementById('estado-bandeira')
    
    const baseURL = 'https://api.qedu.org.br/v1'
    const token = 'uCepcSkwipY8IqOGft3XWe8RWvUTyjr94abLkYN6'

    const estados = {
        12: 'Acre',
        27: 'Alagoas',
        16: 'Amapá',
        13: 'Amazonas',
        29: 'Bahia',
        23: 'Ceará',
        53: 'Distrito Federal',
        32: 'Espírito Santo',
        52: 'Goiás',
        21: 'Maranhão',
        51: 'Mato Grosso',
        50: 'Mato Grosso do Sul',
        31: 'Minas Gerais',
        15: 'Pará',
        25: 'Paraíba',
        41: 'Paraná',
        26: 'Pernambuco',
        22: 'Piauí',
        33: 'Rio de Janeiro',
        24: 'Rio Grande do Norte',
        43: 'Rio Grande do Sul',
        11: 'Rondônia',
        14: 'Roraima',
        42: 'Santa Catarina',
        35: 'São Paulo',
        28: 'Sergipe',
        17: 'Tocantins'
    }

    const options = {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        timeout: 10000
    }

    // Formatar percentual
    function formatarPercentual(valor) {
        return `${(valor * 100).toFixed(0)}%`
    }

    // Buscar dados do get de infraestrutura(censo)
    async function buscarDadosInfraestrutura(estadoId, tentativa = 1) {
        const maxTentativas = 3
        const params = {
            ibge_id: estadoId,
            ano: 2023,
            dependencia_id: 0,
            localizacao_id: 0
        }

        try {
            const response = await axios.get(`${baseURL}/censo/territorio`, { ...options, params })
            
            if (!response.data || !response.data.data || response.data.data.length === 0) {
                throw new Error(`Nenhum dado encontrado para ${estados[estadoId]}`)
            }

            const dados = response.data.data[0]
            const totalEscolas = dados.qtd_escolas
            
            // Calcula as porcentagens baseadas nos dados reais da API
            return {
                nome: estados[estadoId],
                totalEscolas: totalEscolas,
                biblioteca: dados.dependencias_biblioteca / totalEscolas,
                labInfo: dados.dependencias_lab_informatica / totalEscolas,
                internet: dados.tecnologia_banda_larga / totalEscolas,
                quadra: dados.dependencias_quadra_esportes / totalEscolas,
                esgoto: dados.servicos_esgoto_rede_publica / totalEscolas,
                labCiencias: dados.dependencias_lab_ciencias / totalEscolas,
                alimentacao: dados.alimentacao_fornecida / totalEscolas,
                tv: dados.equipamento_tv / totalEscolas
            }
        } catch (error) {
            console.error(`Erro ao buscar dados de ${estados[estadoId]} (tentativa ${tentativa}):`, error)
            
            if (tentativa < maxTentativas) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, tentativa - 1) * 1000))
                return buscarDadosInfraestrutura(estadoId, tentativa + 1)
            }

            return null
        }
    }

    selectEstado.value = '12'
    estadoNome.textContent = 'Carregando...'
    estadoEscolas.textContent = 'Carregando número de escolas...'
    buscarDadosInfraestrutura('12').then(dados => {
        atualizarCards(dados)
    })

    // Event listener pra mudança de estado
    selectEstado.addEventListener('change', async function() {
        const estadoId = this.value
        if (!estadoId) {
            estadoNome.textContent = 'Selecione um estado'
            estadoEscolas.textContent = '-'
            return
        }

        estadoNome.textContent = 'Carregando...'
        estadoEscolas.textContent = 'Carregando número de escolas...'

        const dados = await buscarDadosInfraestrutura(estadoId)
        atualizarCards(dados)
    })

    function atualizarCards(dados) {
        if (!dados) {
            estadoNome.textContent = 'Erro ao carregar dados'
            estadoEscolas.textContent = 'Tente novamente mais tarde'
            estadoBandeira.style.display = 'none'
            
            document.getElementById('biblioteca-valor').textContent = '0%'
            document.getElementById('lab-info-valor').textContent = '0%'
            document.getElementById('internet-valor').textContent = '0%'
            document.getElementById('quadra-valor').textContent = '0%'
            document.getElementById('esgoto-valor').textContent = '0%'
            document.getElementById('lab-ciencias-valor').textContent = '0%'
            document.getElementById('alimentacao-valor').textContent = '0%'
            document.getElementById('tv-valor').textContent = '0%'
            return
        }

        estadoNome.textContent = dados.nome
        estadoEscolas.textContent = `${dados.totalEscolas.toLocaleString()} Escolas`
        
        estadoBandeira.src = `../assets/bandeiras/${selectEstado.value}.png`
        estadoBandeira.style.display = 'block'

        document.getElementById('biblioteca-valor').textContent = formatarPercentual(dados.biblioteca)
        document.getElementById('lab-info-valor').textContent = formatarPercentual(dados.labInfo)
        document.getElementById('internet-valor').textContent = formatarPercentual(dados.internet)
        document.getElementById('quadra-valor').textContent = formatarPercentual(dados.quadra)
        document.getElementById('esgoto-valor').textContent = formatarPercentual(dados.esgoto)
        document.getElementById('lab-ciencias-valor').textContent = formatarPercentual(dados.labCiencias)
        document.getElementById('alimentacao-valor').textContent = formatarPercentual(dados.alimentacao)
        document.getElementById('tv-valor').textContent = formatarPercentual(dados.tv)
    }
});
