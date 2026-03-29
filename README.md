# Laboratório Virtual de Física: Lei de Ohm ⚡

Este é um aplicativo web interativo desenvolvido para auxiliar estudantes e professores em experimentos de física sobre a **Lei de Ohm**. O projeto permite a coleta de dados, plotagem de gráficos característicos (I vs V) e a geração automática de um relatório experimental completo em PDF.

## 🚀 Funcionalidades

- **Coleta de Dados Interativa:** Tabelas dinâmicas para registro de tensão (V) e corrente (I) para resistores de 560 Ω e 10 kΩ.
- **Gráficos em Tempo Real:** Plotagem automática dos pontos coletados em um plano cartesiano com papel milimetrado virtual.
- **Ferramentas de Desenho:** Ferramentas de ponto, linha e borracha para análise manual sobre os gráficos.
- **Cálculos Automáticos:** Cálculo imediato da inclinação da reta, resistência experimental, erro percentual em relação ao valor nominal e potência dissipada ($P = V \cdot I$).
- **Gerador de Relatório PDF:** Criação de um documento profissional contendo:
  - Capa personalizada.
  - Objetivos e Fundamentação Teórica.
  - Procedimento Experimental com diagramas.
  - Tabelas de dados e Gráficos capturados.
  - Respostas das perguntas pós-experimento.
- **Checklist de Organização:** Seção dedicada à disciplina no laboratório (limpeza e organização da bancada).

## 🛠️ Tecnologias Utilizadas

- **React 18** com **TypeScript**
- **Vite** (Build tool)
- **Tailwind CSS** (Estilização responsiva)
- **Lucide React** (Ícones)
- **jsPDF** (Geração do documento PDF)
- **html2canvas** (Captura de elementos DOM para o relatório)
- **Framer Motion** (Animações de interface)

## 📦 Instalação e Execução

Para rodar o projeto localmente, siga os passos abaixo:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/lab-fisica-ohm.git
   ```

2. **Acesse o diretório:**
   ```bash
   cd lab-fisica-ohm
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acesse no navegador:**
   O projeto estará disponível em `http://localhost:3000`.

## 📄 Estrutura do Relatório

O relatório gerado segue as normas acadêmicas padrão para roteiros de laboratório:
1. **Capa:** Identificação da instituição, curso, alunos e professor.
2. **Objetivos:** O que se pretende alcançar com o experimento.
3. **Material:** Lista de equipamentos utilizados.
4. **Teoria:** Breve explicação sobre a Lei de Ohm.
5. **Procedimento:** Passo a passo da montagem e medição.
6. **Dados e Gráficos:** Evidências visuais e numéricas do experimento.
7. **Análise:** Comparação entre valores teóricos e experimentais.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma *Issue* ou enviar um *Pull Request*.

---
Desenvolvido para fins educacionais. 🎓
