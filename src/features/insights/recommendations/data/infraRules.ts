import type { PatternRule } from "../patternRule"

export const INFRA_RULES: PatternRule[] = [
  {
    patterns: ["heap out of memory"],
    text: "Memória heap esgotada. Aumente o --max-old-space-size, otimize uso de memória ou escale verticalmente.",
    specificity: 0.95
  },
  {
    patterns: ["out of memory"],
    text: "Memória esgotada. Aumente os limites de memória, otimize uso de memória ou escale verticalmente.",
    specificity: 0.9
  },
  {
    patterns: ["enomem"],
    text: "Erro ENOMEM. O sistema operacional não conseguiu alocar memória. Aumente a RAM disponível.",
    specificity: 0.9
  },
  {
    patterns: ["enospc"],
    text: "Disco cheio (ENOSPC). Limpe logs, arquivos temporários ou aumente o volume de armazenamento.",
    specificity: 0.9
  },
  {
    patterns: ["no space left"],
    text: "Disco cheio. Limpe logs, arquivos temporários ou aumente o volume de armazenamento.",
    specificity: 0.9
  },
  {
    patterns: ["eacces"],
    text: "Permissão de filesystem negada (EACCES). Verifique owner, group e permissões do arquivo/diretório no container.",
    specificity: 0.8
  },
  {
    patterns: ["oom"],
    text: "Processo terminado pelo OOM killer. O container excedeu o limite de memória. Aumente o resource limit ou otimize.",
    specificity: 0.85
  },
  {
    patterns: ["segmentation fault"],
    text: "Segfault em módulo nativo. Verifique compatibilidade da dependência nativa com a arquitetura/OS do container.",
    specificity: 0.9
  },
  {
    patterns: ["sigsegv"],
    text: "SIGSEGV recebido. Possível crash em módulo nativo. Verifique compatibilidade com a arquitetura do container.",
    specificity: 0.9
  }
]
