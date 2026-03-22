import type { PatternRule } from "../patternRule"

export const RUNTIME_RULES: PatternRule[] = [
  {
    patterns: ["cannot read properties of undefined"],
    text: "Acesso a propriedade de objeto undefined. Adicione optional chaining (?.) ou verifique se os dados foram carregados antes do render.",
    specificity: 0.9
  },
  {
    patterns: ["cannot read properties of null"],
    text: "Acesso a propriedade de null. Verifique se o elemento DOM existe ou se o dado retornou null da API.",
    specificity: 0.9
  },
  {
    patterns: ["is not a function"],
    text: "Chamada de função em algo que não é function. Verifique imports, named exports vs default exports e versões de dependências.",
    specificity: 0.85
  },
  {
    patterns: ["is not defined"],
    text: "Variável não definida no escopo. Possível import faltando, typo no nome ou variável fora de escopo.",
    specificity: 0.8
  },
  {
    patterns: ["undefined is not an object"],
    text: "Tentativa de acessar undefined como objeto (Safari). Mesmo que 'cannot read properties of undefined' -- adicione null guard.",
    specificity: 0.85
  },
  {
    patterns: ["maximum call stack"],
    text: "Stack overflow por recursão infinita. Verifique loops recursivos, useEffect sem dependências corretas ou re-renders infinitos.",
    specificity: 0.9
  },
  {
    patterns: ["loading chunk"],
    text: "Falha ao carregar chunk JS. Possível deploy recente invalidou os chunks. Considere implementar retry ou forçar reload.",
    specificity: 0.85
  },
  {
    patterns: ["chunk", "failed to fetch"],
    text: "Falha ao carregar chunk JS. Possível deploy recente invalidou os chunks. Considere implementar retry ou forçar reload.",
    specificity: 0.8
  }
]
