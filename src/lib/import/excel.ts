import * as XLSX from "xlsx";
import {
  emptyBundle,
  type ControladoriaBundle,
  type CreditCard,
} from "@/lib/domain/types";
import {
  parseDay,
  parseMoney,
  parseMonthToken,
  parsePaid,
} from "@/lib/format";

function uid(prefix: string, i: number) {
  return `${prefix}-${i}`;
}

function sheetRows(wb: XLSX.WorkBook, name: string): unknown[][] {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });
}

function cell(row: unknown[] | undefined, idx: number): unknown {
  return row?.[idx];
}

function str(v: unknown): string {
  return String(v ?? "").trim();
}

export function parseWorkbook(buffer: ArrayBuffer | Buffer): ControladoriaBundle {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const bundle = emptyBundle();

  // --- Settings from Inicio / Dashboard / Prioridades ---
  const inicio = sheetRows(wb, "Inicio");
  const dash = sheetRows(wb, "Dashboard");
  const prioridades = sheetRows(wb, "Prioridades");

  const refDay = parseDay(cell(inicio[4], 1) || cell(inicio.find((r) => str(r[0]).includes("Dia de referência")) || [], 1) || 10);
  bundle.settings.reference_day = refDay || 10;
  bundle.settings.display_name = "Renan";
  bundle.settings.current_month = 7;
  bundle.settings.current_year = 2026;

  // Dashboard: monthly surplus, days
  for (const row of dash) {
    if (str(row[0]).toLowerCase().includes("superávit médio")) {
      bundle.settings.monthly_surplus = parseMoney(row[1]);
    }
  }
  // Prioridades caixa livre
  for (const row of prioridades) {
    if (str(row[7]).toLowerCase() === "caixa_livre" || str(row[0]).toLowerCase().includes("caixa livre")) {
      // row with refs
    }
  }
  // I3 style: look for numeric near caixa
  const caixaFromPrior = prioridades.find((r) => str(r[7]) === "caixa_livre");
  if (caixaFromPrior) {
    bundle.settings.caixa_livre = parseMoney(caixaFromPrior[8]);
  } else {
    bundle.settings.caixa_livre = parseMoney(cell(inicio[13], 4));
  }
  if (!bundle.settings.monthly_surplus) {
    bundle.settings.monthly_surplus = 8500;
  }

  // --- Agenda ---
  const agendaSheet = sheetRows(wb, "Agenda");
  let agendaMode: "main" | "irpf" = "main";
  let agendaIdx = 0;
  for (let i = 0; i < agendaSheet.length; i++) {
    const row = agendaSheet[i];
    const c0 = str(row[0]);
    if (c0 === "Dia" && str(row[1]) === "Conta") continue;
    if (c0.startsWith("IRPF")) {
      agendaMode = "irpf";
      continue;
    }
    if (c0.startsWith("TOTAL")) continue;
    const day = Number(row[0]);
    if (!Number.isFinite(day) || day < 1 || day > 31) continue;
    const name = str(row[1]);
    if (!name) continue;
    const amount = parseMoney(row[2]);
    const paid = parsePaid(row[3]);
    const category = str(row[5]) || "Geral";
    // IRPF future months: "IRPF — Ago/26"
    let month = 7;
    let year = 2026;
    if (agendaMode === "irpf") {
      const token = name.split("—")[1]?.trim() || name.split("-")[1]?.trim();
      const parsed = token ? parseMonthToken(token) : null;
      if (parsed) {
        month = parsed.month;
        year = parsed.year;
      }
    }
    bundle.agenda.push({
      id: uid("ag", agendaIdx++),
      due_day: day,
      account_name: name,
      amount,
      paid,
      category,
      month,
      year,
      notes: null,
    });
  }

  // --- Contas matrix ---
  const contas = sheetRows(wb, "Contas_Ago_Jan");
  const header = contas.find((r) => str(r[0]) === "Conta");
  const monthCols: { idx: number; month: number; year: number }[] = [];
  if (header) {
    for (let c = 2; c <= 7; c++) {
      const parsed = parseMonthToken(str(header[c]));
      if (parsed) monthCols.push({ idx: c, ...parsed });
    }
  }
  let bi = 0;
  for (const row of contas) {
    const name = str(row[0]);
    if (!name || name === "Conta" || name.startsWith("TOTAL") || name.startsWith("Contas")) continue;
    const due = parseDay(row[1]);
    if (!due && !Number(row[1])) continue;
    const amounts = monthCols.map((m) => ({
      year: m.year,
      month: m.month,
      amount: parseMoney(row[m.idx]),
    }));
    bundle.billMatrix.push({
      id: uid("bm", bi++),
      account_name: name,
      due_day: due || 1,
      source: str(row[9]) || "Fixos",
      paid: parsePaid(row[10]),
      notes: str(row[11]) || null,
      amounts,
    });
  }

  // --- Fixos ---
  const fixos = sheetRows(wb, "Fixos");
  let fi = 0;
  for (const row of fixos) {
    const name = str(row[0]);
    if (!name || name === "Conta" || name.startsWith("TOTAL") || name.startsWith("PENDENTE") || name.startsWith("JÁ") || name.startsWith("Despesas")) continue;
    if (!str(row[1]) && !parseMoney(row[2])) continue;
    bundle.fixedExpenses.push({
      id: uid("fx", fi++),
      account_name: name,
      category: str(row[1]) || "Geral",
      amount: parseMoney(row[2]),
      due_day: parseDay(row[3]),
      bank: str(row[4]) || null,
      until_when: str(row[5]) || null,
      paid: parsePaid(row[6]),
      notes: str(row[7]) || null,
    });
  }

  // --- Empréstimos ---
  const emp = sheetRows(wb, "Emprestimos");
  let section: "installment" | "open" | "consignado" | "parcels" | null = null;
  let li = 0;
  let oi = 0;
  let pi = 0;
  for (const row of emp) {
    const c0 = str(row[0]);
    if (c0.includes("parcela mensal definida")) {
      section = "installment";
      continue;
    }
    if (c0.includes("regularizar") || c0.includes("quitar")) {
      section = "open";
      continue;
    }
    if (c0.includes("Consignado CLT")) {
      section = "consignado";
      continue;
    }
    if (c0.includes("cronograma de parcelas")) {
      section = "parcels";
      continue;
    }
    if (c0 === "Banco" || c0 === "#" || c0.startsWith("TOTAL") || c0.startsWith("Marque") || !c0) continue;
    if (c0 === "Restam" || c0.startsWith("Empréstimos")) continue;

    if (section === "installment" && parseMoney(row[1]) >= 0 && str(row[1]) !== "") {
      if (c0 === "TOTAL") continue;
      const rem = Number(row[3]);
      bundle.installmentLoans.push({
        id: uid("il", li++),
        bank: c0,
        balance: parseMoney(row[1]),
        installment: parseMoney(row[2]),
        remaining: Number.isFinite(rem) ? rem : null,
        end_estimated: str(row[4]) || null,
        status: str(row[5]) || "Em dia",
      });
    } else if (section === "open" && !c0.startsWith("TOTAL")) {
      bundle.openDebts.push({
        id: uid("od", oi++),
        bank: c0,
        total_balance: parseMoney(row[1]),
        overdue: parseMoney(row[2]),
        payoff_amount: parseMoney(row[3]),
        priority: Number(row[4]) || null,
        status: str(row[5]) || "Em aberto",
        strategy: str(row[6]) || null,
      });
    } else if (section === "consignado" && c0.startsWith("Consignado")) {
      bundle.liabilities.push({
        id: uid("lc", oi++),
        name: c0,
        balance: parseMoney(row[1]),
        source: "Consignado",
        notes: "Informativo — descontado em folha",
        is_consignado: true,
      });
    } else if (section === "parcels" && Number(row[0]) >= 1) {
      bundle.loanParcels.push({
        id: uid("lp", pi++),
        debt_label: "Caixa PJ",
        parcel_index: Number(row[0]),
        parcel_number: Number(row[1]) || 0,
        situation: str(row[2]) || "Não Paga",
        amount: parseMoney(row[3]),
        amount_with_interest: parseMoney(row[4]),
      });
    }
  }

  // Enrich open debt interest from Ranking
  const ranking = sheetRows(wb, "Ranking");
  for (const row of ranking) {
    const name = str(row[1]);
    if (!name || name === "Dívida") continue;
    const rate = parseMoney(String(row[3]).replace("%", ""));
    const debt = bundle.openDebts.find((d) =>
      name.toLowerCase().includes(d.bank.toLowerCase().split(" ")[0]),
    );
    if (debt) debt.interest_rate_month = rate;
    const loan = bundle.installmentLoans.find((d) =>
      name.toLowerCase().includes(d.bank.toLowerCase().split(" ")[0]),
    );
    if (loan && !debt) {
      // keep
    }
  }

  // --- Cartões ---
  const cartoes = sheetRows(wb, "Cartoes");
  let ci = 0;
  const scheduleHeader = cartoes.find(
    (r) => str(r[0]) === "Cartão" && str(r[1]).includes("Ago"),
  );
  const scheduleMonths: { idx: number; month: number; year: number }[] = [];
  if (scheduleHeader) {
    for (let c = 1; c <= 10; c++) {
      const parsed = parseMonthToken(str(scheduleHeader[c]));
      if (parsed) scheduleMonths.push({ idx: c, ...parsed });
    }
  }
  const scheduleMap = new Map<string, { year: number; month: number; amount: number }[]>();
  let inSchedule = false;
  for (const row of cartoes) {
    if (str(row[0]) === "Cartão" && str(row[1]).includes("/")) {
      inSchedule = true;
      continue;
    }
    if (inSchedule) {
      const name = str(row[0]);
      if (!name || name === "TOTAL" || name.startsWith("Dica")) continue;
      scheduleMap.set(
        name,
        scheduleMonths.map((m) => ({
          year: m.year,
          month: m.month,
          amount: parseMoney(row[m.idx]),
        })),
      );
      continue;
    }
  }
  for (const row of cartoes) {
    const bank = str(row[0]);
    if (
      bank.startsWith("Cronograma") ||
      (bank === "Cartão" && str(row[1]).includes("/"))
    ) {
      break;
    }
    const cardName = str(row[1]);
    if (
      !bank ||
      bank === "Banco" ||
      bank === "Status:" ||
      bank.startsWith("Cartões") ||
      bank.startsWith("Limite") ||
      bank === "TOTAL" ||
      bank.startsWith("Dica") ||
      bank === "Cartão"
    ) {
      continue;
    }
    if (!cardName || !parseMoney(row[2])) continue;
    const card: CreditCard = {
      id: uid("cc", ci++),
      bank,
      card_name: cardName,
      limit_total: parseMoney(row[2]),
      used_amount: parseMoney(row[3]),
      close_day: Number(row[6]) || null,
      due_day: Number(row[7]) || null,
      current_bill: parseMoney(row[8]),
      next_bill: parseMoney(row[9]),
      remaining_installments: parseMoney(row[10]),
      schedule: scheduleMap.get(cardName) ?? [],
    };
    bundle.cards.push(card);
  }

  // --- Fluxo diário ---
  const fluxo = sheetRows(wb, "Fluxo_Diario");
  let opening = 0;
  let caixaLivreFluxo = bundle.settings.caixa_livre;
  for (const row of fluxo) {
    if (str(row[0]).includes("Mês/Ano") || str(row[2]).toLowerCase().includes("saldo inicial")) {
      opening = parseMoney(row[3]);
    }
    if (str(row[0]).toLowerCase().includes("caixa livre")) {
      caixaLivreFluxo = parseMoney(row[1]) || caixaLivreFluxo;
    }
  }
  const days: ControladoriaBundle["cashflow"] extends null
    ? never
    : NonNullable<ControladoriaBundle["cashflow"]>["days"] = [];
  let di = 0;
  for (const row of fluxo) {
    const day = Number(row[0]);
    if (!Number.isFinite(day) || day < 1 || day > 31) continue;
    days.push({
      id: uid("cf", di++),
      year: 2026,
      month: 7,
      day,
      inflows: parseMoney(row[2]),
      outflows: parseMoney(row[3]),
      events: str(row[6]) || null,
    });
  }
  bundle.cashflow = {
    year: 2026,
    month: 7,
    opening_balance: opening,
    caixa_livre: caixaLivreFluxo,
    days,
  };
  bundle.settings.caixa_livre = caixaLivreFluxo || bundle.settings.caixa_livre;

  // --- Prioridades ---
  let pri = 0;
  let inPri = false;
  for (const row of prioridades) {
    if (str(row[0]) === "#" && str(row[1]) === "Dívida") {
      inPri = true;
      continue;
    }
    if (!inPri) continue;
    if (str(row[0]).startsWith("Próxima") || str(row[0]).startsWith("Uso") || str(row[0]).startsWith("Ação") || str(row[0]).startsWith("Valor") || str(row[0]).startsWith("Caixa PJ")) {
      if (str(row[0]).startsWith("Uso")) inPri = false;
      continue;
    }
    const orderRaw = str(row[0]);
    if (!orderRaw || orderRaw.startsWith("Caixa")) continue;
    const sort = orderRaw === "✓" ? 99 : Number(orderRaw) || pri;
    const debt = str(row[1]);
    if (!debt) continue;
    bundle.priorities.push({
      id: uid("pr", pri++),
      sort_order: sort,
      debt_name: debt,
      action: str(row[2]),
      amount: parseMoney(row[3]) || null,
      status: str(row[4]) || "Em aberto",
      reason: str(row[5]) || null,
    });
  }

  // --- Patrimônio ---
  const pat = sheetRows(wb, "Patrimonio");
  let ai = 0;
  let sectionPat: "assets" | "liabilities" | null = null;
  for (const row of pat) {
    const c0 = str(row[0]);
    if (c0 === "Ativo" && str(row[1]) === "Valor") {
      sectionPat = "assets";
      continue;
    }
    if (c0 === "Dívida" && str(row[1]) === "Saldo") {
      sectionPat = "liabilities";
      continue;
    }
    if (c0.startsWith("TOTAL") || c0.startsWith("Passivos") || c0.startsWith("Consignado") || c0.startsWith("Resumo") || c0.startsWith("Meta") || c0.startsWith("Patrimônio") || c0.startsWith("Estratégia") || c0.startsWith("Valor alvo") || c0.startsWith("Carta") || c0.startsWith("Entrada") || c0.startsWith("Falta") || c0.startsWith("Prazo") || c0 === "Ativos" || !c0) {
      if (c0.startsWith("Valor alvo")) {
        bundle.netWorthGoal = {
          home_target: parseMoney(row[1]),
          credit_letter: 0,
          down_payment_needed: 0,
          down_payment_missing: 0,
          estimated_deadline: null,
          strategy: null,
        };
      }
      if (c0.startsWith("Carta de crédito") && bundle.netWorthGoal) {
        bundle.netWorthGoal.credit_letter = parseMoney(row[1]);
      }
      if (c0.startsWith("Entrada necessária") && bundle.netWorthGoal) {
        bundle.netWorthGoal.down_payment_needed = parseMoney(row[1]);
      }
      if (c0.startsWith("Falta para entrada") && bundle.netWorthGoal) {
        bundle.netWorthGoal.down_payment_missing = parseMoney(row[1]);
      }
      if (c0.startsWith("Prazo estimado") && bundle.netWorthGoal) {
        bundle.netWorthGoal.estimated_deadline = str(row[1]);
      }
      if (c0.startsWith("Estratégia") && bundle.netWorthGoal) {
        bundle.netWorthGoal.strategy = c0.replace(/^Estratégia:\s*/i, "") || str(row[1]);
      }
      if (c0.startsWith("Total consignado")) {
        bundle.liabilities.push({
          id: uid("lcons", ai++),
          name: "Total consignado CLT",
          balance: parseMoney(row[1]),
          source: "Consignado",
          notes: null,
          is_consignado: true,
        });
      }
      continue;
    }
    if (sectionPat === "assets") {
      bundle.assets.push({
        id: uid("as", ai++),
        name: c0,
        value: parseMoney(row[1]),
        asset_type: str(row[2]) || "Outro",
        notes: str(row[3]) || null,
      });
    } else if (sectionPat === "liabilities") {
      bundle.liabilities.push({
        id: uid("lb", ai++),
        name: c0,
        balance: parseMoney(row[1]),
        source: str(row[2]) || null,
        notes: str(row[3]) || null,
        is_consignado: false,
      });
    }
  }

  // --- Projeção ---
  const proj = sheetRows(wb, "Projecao");
  let pji = 0;
  for (const row of proj) {
    const token = str(row[0]);
    const parsed = parseMonthToken(token);
    if (!parsed) continue;
    bundle.projections.push({
      year: parsed.year,
      month: parsed.month,
      commitments: parseMoney(row[1]),
      income: parseMoney(row[2]),
      notes: str(row[6]) || null,
    });
    pji++;
  }
  void pji;

  // --- Alertas ---
  let al = 0;
  let inAlerts = false;
  for (const row of dash) {
    if (str(row[0]) === "Alertas") {
      inAlerts = true;
      continue;
    }
    if (!inAlerts) continue;
    if (str(row[0]).startsWith("Navegação")) break;
    const title = str(row[0]);
    const message = str(row[1]);
    if (!title || !message) continue;
    bundle.alerts.push({
      id: uid("al", al++),
      severity: title.toLowerCase().includes("urgente")
        ? "urgent"
        : title.toLowerCase().includes("oportunidade")
          ? "opportunity"
          : "info",
      title,
      message,
    });
  }

  // --- Cenários / candidatos ---
  const cen = sheetRows(wb, "Cenarios");
  bundle.scenario.caixa_livre = bundle.settings.caixa_livre;
  bundle.scenario.monthly_surplus = bundle.settings.monthly_surplus;
  for (const row of cen) {
    const label = str(row[0]).toLowerCase();
    if (label.includes("recebi extra")) bundle.scenario.extra_income = parseMoney(row[1]);
    if (label.includes("bônus")) bundle.scenario.bonus = parseMoney(row[1]);
    if (label.includes("venda de bem")) bundle.scenario.asset_sale = parseMoney(row[1]);
    if (label === "outro valor") bundle.scenario.other_amount = parseMoney(row[1]);
  }
  let dci = 0;
  let inCand = false;
  for (const row of cen) {
    if (str(row[0]) === "Dívida" && str(row[1]).includes("Custo")) {
      inCand = true;
      continue;
    }
    if (!inCand) continue;
    if (str(row[0]).startsWith("3.") || str(row[0]).startsWith("PLANO") || !str(row[0])) {
      if (str(row[0]).startsWith("3.") || str(row[0]).startsWith("PLANO")) inCand = false;
      continue;
    }
    const name = str(row[0]);
    const rate = parseMoney(String(row[4]).replace("%", ""));
    bundle.debtCandidates.push({
      id: uid("dc", dci++),
      name,
      cost_to_act: parseMoney(row[1]),
      cancels_amount: parseMoney(row[2]),
      interest_rate_month: rate,
      installment_freed: parseMoney(row[6]),
      is_risk_first: /caixa\s*pj/i.test(name),
    });
  }

  // Simulator default received
  const sim = sheetRows(wb, "Simulador");
  for (const row of sim) {
    if (str(row[0]).toUpperCase() === "RECEBI") {
      bundle.scenario.simulator_received = parseMoney(row[1]);
    }
  }

  return bundle;
}

export async function parseWorkbookFromFile(path: string): Promise<ControladoriaBundle> {
  const fs = await import("fs/promises");
  const buf = await fs.readFile(path);
  return parseWorkbook(buf);
}
